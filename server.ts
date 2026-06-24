import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { WishRecord, PosterTemplate, ColleagueGroup } from "./src/types";
import { supabase, isSupabaseConfigured } from "./src/supabase";
import { Buffer } from "buffer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" })); // Support large base64 image uploads

const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "wishes.json");
const POSTER_FILE = path.join(DB_DIR, "poster_templates.json");

const DEFAULT_POSTERS: Record<string, PosterTemplate> = {
  Visionary: { group: "Visionary", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#60A5FA", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#E0E7FF", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Lead: { group: "Lead", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#F59E0B", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#FEF3C7", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Builder: { group: "Builder", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#10B981", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#ECFDF5", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Connector: { group: "Connector", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#EC4899", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#FCE7F3", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Pragmatist: { group: "Pragmatist", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#3B82F6", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#E0F2FE", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Skeptic: { group: "Skeptic", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#64748B", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#F1F5F9", goalSize: 18, goalAlign: "center", goalBgVisible: true }
};

// Database Schema mappings
function mapWishFromDb(row: any): WishRecord {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    wish: row.wish,
    photoUrl: row.photo_url || "",
    createdAt: row.created_at || new Date().toISOString(),
    group: row.group as ColleagueGroup,
  };
}

function mapWishToDb(wish: WishRecord): any {
  return {
    id: wish.id,
    email: wish.email,
    username: wish.username,
    wish: wish.wish,
    photo_url: wish.photoUrl,
    group: wish.group || "Builder",
    created_at: wish.createdAt,
  };
}

function mapTemplateFromDb(row: any): PosterTemplate {
  return {
    group: row.group as ColleagueGroup,
    background: row.background || "",
    photoX: row.photo_x ?? 50,
    photoY: row.photo_y ?? 28,
    photoSize: row.photo_size ?? 180,
    nameX: row.name_x ?? 50,
    nameY: row.name_y ?? 44,
    nameColor: row.name_color || "#FFFFFF",
    nameSize: row.name_size ?? 28,
    nameAlign: row.name_align || "center",
    emailX: row.email_x ?? 50,
    emailY: row.email_y ?? 49,
    emailColor: row.email_color || "#94A3B8",
    emailSize: row.email_size ?? 16,
    emailAlign: row.email_align || "center",
    groupX: row.group_x ?? 50,
    groupY: row.group_y ?? 41,
    groupColor: row.group_color || "#60A5FA",
    groupSize: row.group_size ?? 14,
    groupVisible: row.group_visible ?? true,
    groupAlign: row.group_align || "center",
    goalX: row.goal_x ?? 50,
    goalY: row.goal_y ?? 65,
    goalWidth: row.goal_width ?? 80,
    goalColor: row.goal_color || "#E0E7FF",
    goalSize: row.goal_size ?? 18,
    goalAlign: row.goal_align || "center",
    goalBgVisible: row.goal_bg_visible ?? true,
    goalPaddingTop: row.goal_padding_top ?? 20,
    goalPaddingBottom: row.goal_padding_bottom ?? 20,
    goalPaddingLeft: row.goal_padding_left ?? 40,
    goalPaddingRight: row.goal_padding_right ?? 40,
  };
}

function mapTemplateToDb(t: PosterTemplate): any {
  return {
    group: t.group,
    background: t.background,
    photo_x: t.photoX,
    photo_y: t.photoY,
    photo_size: t.photoSize,
    name_x: t.nameX,
    name_y: t.nameY,
    name_color: t.nameColor,
    name_size: t.nameSize,
    name_align: t.nameAlign,
    email_x: t.emailX,
    email_y: t.emailY,
    email_color: t.emailColor,
    email_size: t.emailSize,
    email_align: t.emailAlign,
    group_x: t.groupX,
    group_y: t.groupY,
    group_color: t.groupColor,
    group_size: t.groupSize,
    group_visible: t.groupVisible,
    group_align: t.groupAlign,
    goal_x: t.goalX,
    goal_y: t.goalY,
    goal_width: t.goalWidth,
    goal_color: t.goalColor,
    goal_size: t.goalSize,
    goal_align: t.goalAlign,
    goal_bg_visible: t.goalBgVisible,
    goal_padding_top: t.goalPaddingTop,
    goal_padding_bottom: t.goalPaddingBottom,
    goal_padding_left: t.goalPaddingLeft,
    goal_padding_right: t.goalPaddingRight,
  };
}

// Helper to upload base64 images to Supabase Storage
async function uploadBase64Image(base64Data: string, filename: string, bucket = "avatars"): Promise<string | null> {
  try {
    if (!base64Data || !base64Data.startsWith("data:image/")) {
      return base64Data || null;
    }

    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      console.error("Invalid base64 string format");
      return null;
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, "base64");

    let extension = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      extension = "jpg";
    } else if (mimeType.includes("gif")) {
      extension = "gif";
    } else if (mimeType.includes("webp")) {
      extension = "webp";
    } else if (mimeType.includes("svg")) {
      extension = "svg";
    }

    const fullFilename = `${filename}.${extension}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fullFilename, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error(`Supabase storage upload error for bucket '${bucket}':`, error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullFilename);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadBase64Image:", error);
    return null;
  }
}

// Seed function
async function seedDefaultTemplates() {
  try {
    const { count, error } = await supabase
      .from("poster_templates")
      .select("*", { count: "exact", head: true });
    
    if (error) {
      console.error("Error checking poster templates count:", error);
      return;
    }

    if (count === 0) {
      console.log("[Supabase Seeding] Seeding default poster templates...");
      const templatesToInsert = Object.keys(DEFAULT_POSTERS).map(groupName => {
        return mapTemplateToDb(DEFAULT_POSTERS[groupName]);
      });

      const { error: insertError } = await supabase
        .from("poster_templates")
        .insert(templatesToInsert);

      if (insertError) {
        console.error("Error seeding default templates:", insertError);
      } else {
        console.log("[Supabase Seeding] Seeding successful.");
      }
    }
  } catch (e) {
    console.error("Seeding failed:", e);
  }
}

// Migration function
async function migrateLocalDataToSupabase() {
  try {
    // 1. Migrate Wishes
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const localWishes = JSON.parse(content) as WishRecord[];
      if (localWishes.length > 0) {
        console.log(`[Supabase Migration] Found ${localWishes.length} wishes in local database. Starting migration...`);

        for (const localWish of localWishes) {
          let finalPhotoUrl = localWish.photoUrl;
          if (localWish.photoUrl && localWish.photoUrl.startsWith("data:image/")) {
            console.log(`[Supabase Migration] Uploading image for colleague: ${localWish.username}`);
            const uploadedUrl = await uploadBase64Image(localWish.photoUrl, `avatar_${localWish.id}`);
            if (uploadedUrl) {
              finalPhotoUrl = uploadedUrl;
            }
          }

          const wishToDb = mapWishToDb({
            ...localWish,
            photoUrl: finalPhotoUrl,
          });

          const { error: upsertError } = await supabase
            .from("wishes")
            .upsert(wishToDb);

          if (upsertError) {
            console.error(`[Supabase Migration] Error migrating wish for ${localWish.username}:`, upsertError);
          } else {
            console.log(`[Supabase Migration] Successfully migrated ${localWish.username}`);
          }
        }

        fs.renameSync(DB_FILE, `${DB_FILE}.migrated`);
        console.log(`[Supabase Migration] Migration completed. Archived local wishes file to ${DB_FILE}.migrated`);
      }
    }

    // 2. Migrate Poster Templates
    if (fs.existsSync(POSTER_FILE)) {
      const content = fs.readFileSync(POSTER_FILE, "utf-8");
      const localTemplates = JSON.parse(content) as Record<string, PosterTemplate>;
      
      console.log(`[Supabase Migration] Found local poster templates. Migrating custom values...`);
      for (const groupName of Object.keys(localTemplates)) {
        const localTemplate = localTemplates[groupName];
        let finalBg = localTemplate.background;
        if (localTemplate.background && localTemplate.background.startsWith("data:image/")) {
          console.log(`[Supabase Migration] Uploading background image for group template: ${groupName}`);
          const uploadedUrl = await uploadBase64Image(localTemplate.background, `background_${groupName}`);
          if (uploadedUrl) {
            finalBg = uploadedUrl;
          }
        }

        const templateToDb = mapTemplateToDb({
          ...localTemplate,
          background: finalBg,
        });

        const { error: upsertError } = await supabase
          .from("poster_templates")
          .upsert(templateToDb);

        if (upsertError) {
          console.error(`[Supabase Migration] Error migrating template for ${groupName}:`, upsertError);
        } else {
          console.log(`[Supabase Migration] Successfully migrated template for ${groupName}`);
        }
      }

      fs.renameSync(POSTER_FILE, `${POSTER_FILE}.migrated`);
      console.log(`[Supabase Migration] Migration completed. Archived local templates file to ${POSTER_FILE}.migrated`);
    }
  } catch (error) {
    console.error("[Supabase Migration] Migration failed:", error);
  }
}

// --- API ROUTES ---

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Middleware to guard api requests when Supabase is not configured
const supabaseConfigGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!isSupabaseConfigured) {
    res.status(503).json({
      success: false,
      error: "Supabase integration is active but credentials are not configured. Please fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your local .env file and restart the server to test.",
    });
    return;
  }
  next();
};

app.use("/api", supabaseConfigGuard);

// GET poster templates
app.get("/api/poster-templates", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("poster_templates")
      .select("*");
    if (error) throw error;
    
    const templates: Record<string, PosterTemplate> = {};
    data.forEach((row: any) => {
      templates[row.group] = mapTemplateFromDb(row);
    });
    res.json({ success: true, templates });
  } catch (err: any) {
    console.error("Error fetching templates:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST update poster template
app.post("/api/poster-templates", async (req, res) => {
  try {
    const { group, background, photoX, photoY, photoSize, nameX, nameY, nameColor, nameSize, nameAlign, emailX, emailY, emailColor, emailSize, emailAlign, groupX, groupY, groupColor, groupSize, groupVisible, groupAlign, goalX, goalY, goalWidth, goalColor, goalSize, goalAlign, goalBgVisible, goalPaddingTop, goalPaddingBottom, goalPaddingLeft, goalPaddingRight } = req.body;
    
    if (!group) {
      res.status(400).json({ success: false, error: "Group name is required" });
      return;
    }

    const { data: currentDb, error: fetchError } = await supabase
      .from("poster_templates")
      .select("*")
      .eq("group", group)
      .maybeSingle();
    
    if (fetchError) throw fetchError;

    const current: PosterTemplate = currentDb ? mapTemplateFromDb(currentDb) : (DEFAULT_POSTERS[group] || {
      group: group as ColleagueGroup, background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#60A5FA", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#E0E7FF", goalSize: 18, goalAlign: "center", goalBgVisible: true
    });

    let finalBackground = background;
    if (background && background.startsWith("data:image/")) {
      const uploadedUrl = await uploadBase64Image(background, `background_${group}`);
      if (uploadedUrl) {
        finalBackground = uploadedUrl;
      }
    }

    const updated: PosterTemplate = {
      group,
      background: finalBackground !== undefined ? finalBackground : current.background,
      photoX: typeof photoX === "number" ? photoX : current.photoX,
      photoY: typeof photoY === "number" ? photoY : current.photoY,
      photoSize: typeof photoSize === "number" ? photoSize : current.photoSize,
      nameX: typeof nameX === "number" ? nameX : current.nameX,
      nameY: typeof nameY === "number" ? nameY : current.nameY,
      nameColor: nameColor || current.nameColor,
      nameSize: typeof nameSize === "number" ? nameSize : current.nameSize,
      nameAlign: nameAlign || current.nameAlign || "center",
      emailX: typeof emailX === "number" ? emailX : (current.emailX !== undefined ? current.emailX : 50),
      emailY: typeof emailY === "number" ? emailY : (current.emailY !== undefined ? current.emailY : 49),
      emailColor: emailColor || current.emailColor || "#94A3B8",
      emailSize: typeof emailSize === "number" ? emailSize : (current.emailSize !== undefined ? current.emailSize : 16),
      emailAlign: emailAlign || current.emailAlign || "center",
      groupX: typeof groupX === "number" ? groupX : (current.groupX !== undefined ? current.groupX : 50),
      groupY: typeof groupY === "number" ? groupY : (current.groupY !== undefined ? current.groupY : 41),
      groupColor: groupColor || current.groupColor || "#38BDF8",
      groupSize: typeof groupSize === "number" ? groupSize : (current.groupSize !== undefined ? current.groupSize : 14),
      groupVisible: typeof groupVisible === "boolean" ? groupVisible : (current.groupVisible !== undefined ? current.groupVisible : true),
      groupAlign: groupAlign || current.groupAlign || "center",
      goalX: typeof goalX === "number" ? goalX : current.goalX,
      goalY: typeof goalY === "number" ? goalY : current.goalY,
      goalWidth: typeof goalWidth === "number" ? goalWidth : current.goalWidth,
      goalColor: goalColor || current.goalColor,
      goalSize: typeof goalSize === "number" ? goalSize : current.goalSize,
      goalAlign: goalAlign || current.goalAlign || "center",
      goalBgVisible: typeof goalBgVisible === "boolean" ? goalBgVisible : (current.goalBgVisible !== undefined ? current.goalBgVisible : true),
      goalPaddingTop: typeof goalPaddingTop === "number" ? goalPaddingTop : (current.goalPaddingTop !== undefined ? current.goalPaddingTop : 20),
      goalPaddingBottom: typeof goalPaddingBottom === "number" ? goalPaddingBottom : (current.goalPaddingBottom !== undefined ? current.goalPaddingBottom : 20),
      goalPaddingLeft: typeof goalPaddingLeft === "number" ? goalPaddingLeft : (current.goalPaddingLeft !== undefined ? current.goalPaddingLeft : 40),
      goalPaddingRight: typeof goalPaddingRight === "number" ? goalPaddingRight : (current.goalPaddingRight !== undefined ? current.goalPaddingRight : 40),
    };

    const { error: saveError } = await supabase
      .from("poster_templates")
      .upsert(mapTemplateToDb(updated));

    if (saveError) throw saveError;
    res.json({ success: true, template: updated });
  } catch (err: any) {
    console.error("Error updating template:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Copy poster template settings
app.post("/api/poster-templates/copy", async (req, res) => {
  try {
    const { sourceGroup, targetGroup } = req.body;
    if (!sourceGroup || !targetGroup) {
      res.status(400).json({ success: false, error: "sourceGroup and targetGroup are required" });
      return;
    }

    const { data: sourceDb, error: fetchError } = await supabase
      .from("poster_templates")
      .select("*")
      .eq("group", sourceGroup)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!sourceDb) {
      res.status(404).json({ success: false, error: "Source group not found" });
      return;
    }

    const sourceTemplate = mapTemplateFromDb(sourceDb);
    const { photoX, photoY, photoSize, nameX, nameY, nameSize, nameColor, emailX, emailY, emailSize, emailColor } = sourceTemplate;
    
    const newTemplate: PosterTemplate = {
      ...sourceTemplate,
      group: targetGroup,
      photoX, photoY, photoSize, nameX, nameY, nameSize, nameColor, emailX, emailY, emailSize, emailColor
    };

    const updatedTemplate = { ...(DEFAULT_POSTERS[targetGroup] || {}), ...newTemplate };
    const { error: saveError } = await supabase
      .from("poster_templates")
      .upsert(mapTemplateToDb(updatedTemplate));

    if (saveError) throw saveError;
    res.json({ success: true, template: updatedTemplate });
  } catch (err: any) {
    console.error("Error copying template:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all wishes
app.get("/api/wishes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    
    const wishes = data.map(mapWishFromDb);
    res.json({ success: true, wishes });
  } catch (err: any) {
    console.error("Error fetching wishes:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Query user's exact wish by Email or Username
app.post("/api/wishes/query", async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== "string") {
      res.status(400).json({ success: false, error: "Please provide a valid search query" });
      return;
    }

    const queryClean = identifier.trim().toLowerCase();

    const { data, error } = await supabase
      .from("wishes")
      .select("*")
      .or(`email.ilike.${queryClean},username.ilike.${queryClean}`)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      res.json({ success: true, wish: mapWishFromDb(data) });
    } else {
      res.status(404).json({
        success: false,
        error: "No wish found for this email or username. Let your Admin know to upload it!"
      });
    }
  } catch (err: any) {
    console.error("Error querying wish:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add high-resolution wish
app.post("/api/wishes", async (req, res) => {
  try {
    const { id, email, username, wish, photoUrl, group } = req.body;

    if (!email || !username || !wish) {
      res.status(400).json({ success: false, error: "Email, username, and goal/wish are required fields" });
      return;
    }

    const emailClean = email.trim();
    const usernameClean = username.trim();

    const { data: existing, error: checkError } = await supabase
      .from("wishes")
      .select("*")
      .or(`id.eq.${id || "non_existent_id"},email.ilike.${emailClean},username.ilike.${usernameClean}`)
      .maybeSingle();

    if (checkError) throw checkError;

    const recordId = existing ? existing.id : (id || "wish_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9));
    const createdAtVal = existing ? existing.created_at : new Date().toISOString();

    let finalPhotoUrl = photoUrl || "";
    if (photoUrl && photoUrl.startsWith("data:image/")) {
      const uploadedUrl = await uploadBase64Image(photoUrl, `avatar_${recordId}`);
      if (uploadedUrl) {
        finalPhotoUrl = uploadedUrl;
      }
    } else if (!photoUrl && !existing) {
      finalPhotoUrl = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%236B7280' rx='50' /><text x='50' y='55' fill='%23FFFFFF' font-size='24' font-family='sans-serif' font-weight='bold' text-anchor='middle'>${usernameClean.slice(0, 2).toUpperCase()}</text></svg>`;
    } else if (!photoUrl && existing) {
      finalPhotoUrl = existing.photo_url;
    }

    let finalGroup = group ? group.trim() : "Builder";
    if (!group && existing && existing.group) {
      finalGroup = existing.group;
    }

    const newWish: WishRecord = {
      id: recordId,
      email: emailClean,
      username: usernameClean,
      wish: wish.trim(),
      photoUrl: finalPhotoUrl,
      group: finalGroup as ColleagueGroup,
      createdAt: createdAtVal
    };

    const { error: saveError } = await supabase
      .from("wishes")
      .upsert(mapWishToDb(newWish));

    if (saveError) throw saveError;

    res.json({ success: true, id: newWish.id, wish: newWish, updated: !!existing });
  } catch (err: any) {
    console.error("Error creating/updating wish:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a wish
app.delete("/api/wishes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("wishes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    try {
      await supabase.storage
        .from("avatars")
        .remove([`avatar_${id}.png`, `avatar_${id}.jpg`, `avatar_${id}.webp`, `avatar_${id}.gif`, `avatar_${id}.svg`]);
    } catch (err) {
      console.warn("Could not remove avatar file from storage bucket:", err);
    }

    res.json({ success: true, message: `Wish ${id} removed successfully` });
  } catch (err: any) {
    console.error("Error deleting wish:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- VITE MIDDLEWARE CONFIGURATION ---

async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Time Capsule Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

// Run DB Seeds and Migration on module load
if (isSupabaseConfigured) {
  seedDefaultTemplates().catch(console.error);
  migrateLocalDataToSupabase().catch(console.error);
} else {
  console.warn("[Supabase Warning] Server running in offline fallback mode. Database operations are disabled until credentials are set in .env.");
}

// Do not start the Express listener if running as a serverless function on Vercel
if (!process.env.VERCEL) {
  initServer().catch((error) => {
    console.error("Failed to start server:", error);
  });
}

export default app;
