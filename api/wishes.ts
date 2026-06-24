import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase, isConfigured } from "./_lib/supabase";
import { Buffer } from "buffer";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function uploadBase64Image(base64Data: string, filename: string, bucket = "avatars"): Promise<string | null> {
  try {
    if (!base64Data || !base64Data.startsWith("data:image/")) return base64Data || null;
    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) return null;
    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, "base64");
    let ext = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
    else if (mimeType.includes("gif")) ext = "gif";
    else if (mimeType.includes("webp")) ext = "webp";
    const fullFilename = `${filename}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fullFilename, buffer, { contentType: mimeType, upsert: true });
    if (error) { console.error("Storage upload error:", error); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(fullFilename);
    return data.publicUrl;
  } catch (e) {
    console.error("uploadBase64Image error:", e);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!isConfigured) {
    return res.status(503).json({ success: false, error: "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables." });
  }

  const { url, method } = req;
  const path = (url || "").split("?")[0];

  try {
    // GET /api/wishes
    if (method === "GET" && (path === "/api/wishes" || path === "/wishes")) {
      const { data, error } = await supabase.from("wishes").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      const wishes = data.map((row: any) => ({
        id: row.id, email: row.email, username: row.username, wish: row.wish,
        photoUrl: row.photo_url || "", createdAt: row.created_at || new Date().toISOString(),
        group: row.group,
      }));
      return res.json({ success: true, wishes });
    }

    // POST /api/wishes/query
    if (method === "POST" && (path === "/api/wishes/query" || path === "/wishes/query")) {
      const { identifier } = req.body || {};
      if (!identifier) return res.status(400).json({ success: false, error: "identifier is required" });
      const queryClean = identifier.trim().toLowerCase();
      const { data, error } = await supabase.from("wishes").select("*").or(`email.ilike.${queryClean},username.ilike.${queryClean}`).maybeSingle();
      if (error) throw error;
      if (data) {
        return res.json({ success: true, wish: { id: data.id, email: data.email, username: data.username, wish: data.wish, photoUrl: data.photo_url || "", createdAt: data.created_at, group: data.group } });
      } else {
        return res.status(404).json({ success: false, error: "No wish found for this email or username. Let your Admin know to upload it!" });
      }
    }

    // POST /api/wishes (create/update)
    if (method === "POST" && (path === "/api/wishes" || path === "/wishes")) {
      const { id, email, username, wish, photoUrl, group } = req.body || {};
      if (!email || !username || !wish) return res.status(400).json({ success: false, error: "Email, username, and wish are required" });

      const emailClean = email.trim();
      const usernameClean = username.trim();

      const { data: existing } = await supabase.from("wishes").select("*")
        .or(`id.eq.${id || "nonexistent"},email.ilike.${emailClean},username.ilike.${usernameClean}`)
        .maybeSingle();

      const recordId = existing ? existing.id : (id || `wish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      const createdAt = existing ? existing.created_at : new Date().toISOString();

      let finalPhotoUrl = photoUrl || "";
      if (photoUrl && photoUrl.startsWith("data:image/")) {
        const uploaded = await uploadBase64Image(photoUrl, `avatar_${recordId}`);
        if (uploaded) finalPhotoUrl = uploaded;
      } else if (!photoUrl && !existing) {
        finalPhotoUrl = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%236B7280' rx='50'/><text x='50' y='55' fill='%23FFFFFF' font-size='24' font-family='sans-serif' font-weight='bold' text-anchor='middle'>${usernameClean.slice(0, 2).toUpperCase()}</text></svg>`;
      } else if (!photoUrl && existing) {
        finalPhotoUrl = existing.photo_url || "";
      }

      const finalGroup = group?.trim() || (existing?.group) || "Builder";
      const record = { id: recordId, email: emailClean, username: usernameClean, wish: wish.trim(), photo_url: finalPhotoUrl, group: finalGroup, created_at: createdAt };
      const { error: saveError } = await supabase.from("wishes").upsert(record);
      if (saveError) throw saveError;

      return res.json({ success: true, id: recordId, updated: !!existing });
    }

    // DELETE /api/wishes/:id
    if (method === "DELETE" && (path.startsWith("/api/wishes/") || path.startsWith("/wishes/"))) {
      const id = path.split("/").pop();
      if (!id) return res.status(400).json({ success: false, error: "id required" });
      const { error } = await supabase.from("wishes").delete().eq("id", id);
      if (error) throw error;
      return res.json({ success: true });
    }

    return res.status(404).json({ success: false, error: `Route not found: ${method} ${path}` });

  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
}
