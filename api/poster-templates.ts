import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase, isConfigured } from "./_lib/supabase";
import { Buffer } from "buffer";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function uploadBase64Image(base64Data: string, filename: string, bucket = "backgrounds"): Promise<string | null> {
  try {
    if (!base64Data || !base64Data.startsWith("data:image/")) return base64Data || null;
    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) return null;
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
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

function mapFromDb(row: any) {
  return {
    group: row.group, background: row.background || "", photoX: row.photo_x ?? 50, photoY: row.photo_y ?? 28,
    photoSize: row.photo_size ?? 180, nameX: row.name_x ?? 50, nameY: row.name_y ?? 44,
    nameColor: row.name_color || "#FFFFFF", nameSize: row.name_size ?? 28, nameAlign: row.name_align || "center",
    emailX: row.email_x ?? 50, emailY: row.email_y ?? 49, emailColor: row.email_color || "#94A3B8",
    emailSize: row.email_size ?? 16, emailAlign: row.email_align || "center",
    groupX: row.group_x ?? 50, groupY: row.group_y ?? 41, groupColor: row.group_color || "#60A5FA",
    groupSize: row.group_size ?? 14, groupVisible: row.group_visible ?? true, groupAlign: row.group_align || "center",
    goalX: row.goal_x ?? 50, goalY: row.goal_y ?? 65, goalWidth: row.goal_width ?? 80,
    goalColor: row.goal_color || "#E0E7FF", goalSize: row.goal_size ?? 18, goalAlign: row.goal_align || "center",
    goalBgVisible: row.goal_bg_visible ?? true, goalPaddingTop: row.goal_padding_top ?? 20,
    goalPaddingBottom: row.goal_padding_bottom ?? 20, goalPaddingLeft: row.goal_padding_left ?? 40,
    goalPaddingRight: row.goal_padding_right ?? 40,
  };
}

function mapToDb(t: any) {
  return {
    group: t.group, background: t.background || "", photo_x: t.photoX, photo_y: t.photoY, photo_size: t.photoSize,
    name_x: t.nameX, name_y: t.nameY, name_color: t.nameColor, name_size: t.nameSize, name_align: t.nameAlign,
    email_x: t.emailX, email_y: t.emailY, email_color: t.emailColor, email_size: t.emailSize, email_align: t.emailAlign,
    group_x: t.groupX, group_y: t.groupY, group_color: t.groupColor, group_size: t.groupSize,
    group_visible: t.groupVisible, group_align: t.groupAlign, goal_x: t.goalX, goal_y: t.goalY,
    goal_width: t.goalWidth, goal_color: t.goalColor, goal_size: t.goalSize, goal_align: t.goalAlign,
    goal_bg_visible: t.goalBgVisible, goal_padding_top: t.goalPaddingTop, goal_padding_bottom: t.goalPaddingBottom,
    goal_padding_left: t.goalPaddingLeft, goal_padding_right: t.goalPaddingRight,
  };
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
    // GET /api/poster-templates
    if (method === "GET") {
      const { data, error } = await supabase.from("poster_templates").select("*");
      if (error) throw error;
      const templates: Record<string, any> = {};
      (data || []).forEach((row: any) => { templates[row.group] = mapFromDb(row); });
      return res.json({ success: true, templates });
    }

    // POST /api/poster-templates/copy
    if (method === "POST" && (path.includes("/copy"))) {
      const { sourceGroup, targetGroup } = req.body || {};
      if (!sourceGroup || !targetGroup) return res.status(400).json({ success: false, error: "sourceGroup and targetGroup required" });

      const { data: sourceDb, error: fetchError } = await supabase.from("poster_templates").select("*").eq("group", sourceGroup).maybeSingle();
      if (fetchError) throw fetchError;
      if (!sourceDb) return res.status(404).json({ success: false, error: "Source group not found" });

      const sourceTpl = mapFromDb(sourceDb);
      const newTpl = { ...sourceTpl, group: targetGroup };
      const { error: saveError } = await supabase.from("poster_templates").upsert(mapToDb(newTpl));
      if (saveError) throw saveError;
      return res.json({ success: true, template: newTpl });
    }

    // POST /api/poster-templates (update)
    if (method === "POST") {
      const body = req.body || {};
      const { group } = body;
      if (!group) return res.status(400).json({ success: false, error: "group is required" });

      // Fetch current to fill defaults
      const { data: currentDb } = await supabase.from("poster_templates").select("*").eq("group", group).maybeSingle();
      const current = currentDb ? mapFromDb(currentDb) : { group, background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#60A5FA", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#E0E7FF", goalSize: 18, goalAlign: "center", goalBgVisible: true, goalPaddingTop: 20, goalPaddingBottom: 20, goalPaddingLeft: 40, goalPaddingRight: 40 };

      let finalBackground = body.background;
      if (finalBackground && finalBackground.startsWith("data:image/")) {
        const uploaded = await uploadBase64Image(finalBackground, `background_${group}`);
        if (uploaded) finalBackground = uploaded;
      }

      const updated = {
        group,
        background: finalBackground !== undefined ? finalBackground : current.background,
        photoX: typeof body.photoX === "number" ? body.photoX : current.photoX,
        photoY: typeof body.photoY === "number" ? body.photoY : current.photoY,
        photoSize: typeof body.photoSize === "number" ? body.photoSize : current.photoSize,
        nameX: typeof body.nameX === "number" ? body.nameX : current.nameX,
        nameY: typeof body.nameY === "number" ? body.nameY : current.nameY,
        nameColor: body.nameColor || current.nameColor,
        nameSize: typeof body.nameSize === "number" ? body.nameSize : current.nameSize,
        nameAlign: body.nameAlign || current.nameAlign || "center",
        emailX: typeof body.emailX === "number" ? body.emailX : current.emailX,
        emailY: typeof body.emailY === "number" ? body.emailY : current.emailY,
        emailColor: body.emailColor || current.emailColor,
        emailSize: typeof body.emailSize === "number" ? body.emailSize : current.emailSize,
        emailAlign: body.emailAlign || current.emailAlign || "center",
        groupX: typeof body.groupX === "number" ? body.groupX : current.groupX,
        groupY: typeof body.groupY === "number" ? body.groupY : current.groupY,
        groupColor: body.groupColor || current.groupColor,
        groupSize: typeof body.groupSize === "number" ? body.groupSize : current.groupSize,
        groupVisible: typeof body.groupVisible === "boolean" ? body.groupVisible : current.groupVisible,
        groupAlign: body.groupAlign || current.groupAlign || "center",
        goalX: typeof body.goalX === "number" ? body.goalX : current.goalX,
        goalY: typeof body.goalY === "number" ? body.goalY : current.goalY,
        goalWidth: typeof body.goalWidth === "number" ? body.goalWidth : current.goalWidth,
        goalColor: body.goalColor || current.goalColor,
        goalSize: typeof body.goalSize === "number" ? body.goalSize : current.goalSize,
        goalAlign: body.goalAlign || current.goalAlign || "center",
        goalBgVisible: typeof body.goalBgVisible === "boolean" ? body.goalBgVisible : current.goalBgVisible,
        goalPaddingTop: typeof body.goalPaddingTop === "number" ? body.goalPaddingTop : current.goalPaddingTop,
        goalPaddingBottom: typeof body.goalPaddingBottom === "number" ? body.goalPaddingBottom : current.goalPaddingBottom,
        goalPaddingLeft: typeof body.goalPaddingLeft === "number" ? body.goalPaddingLeft : current.goalPaddingLeft,
        goalPaddingRight: typeof body.goalPaddingRight === "number" ? body.goalPaddingRight : current.goalPaddingRight,
      };

      const { error: saveError } = await supabase.from("poster_templates").upsert(mapToDb(updated));
      if (saveError) throw saveError;
      return res.json({ success: true, template: updated });
    }

    return res.status(404).json({ success: false, error: `Route not found: ${method} ${path}` });

  } catch (err: any) {
    console.error("poster-templates API Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
}
