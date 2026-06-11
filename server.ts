import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { WishRecord } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" })); // Support large base64 image uploads

const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "wishes.json");

// Helper to ensure database file exists
function readDatabase(): WishRecord[] {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content) as WishRecord[];
  } catch (error) {
    console.error("Error reading database:", error);
    return [];
  }
}

function writeDatabase(data: WishRecord[]): boolean {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing database:", error);
    return false;
  }
}

const POSTER_FILE = path.join(DB_DIR, "poster_templates.json");

interface PosterTemplate {
  group: string;
  background: string;
  photoX: number;
  photoY: number;
  photoSize: number;
  nameX: number;
  nameY: number;
  nameColor: string;
  nameSize: number;
  emailX: number;
  emailY: number;
  emailColor: string;
  emailSize: number;
  groupX: number;
  groupY: number;
  groupColor: string;
  groupSize: number;
  groupVisible: boolean;
  goalX: number;
  goalY: number;
  goalWidth: number;
  goalColor: string;
  goalSize: number;
  goalAlign?: string;
  goalBgVisible?: boolean;
  goalPaddingTop?: number;
  goalPaddingBottom?: number;
  goalPaddingLeft?: number;
  goalPaddingRight?: number;
  nameAlign?: string;
  groupAlign?: string;
  emailAlign?: string;
}

const DEFAULT_POSTERS: Record<string, PosterTemplate> = {
  Visionary: { group: "Visionary", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#60A5FA", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#E0E7FF", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Lead: { group: "Lead", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#F59E0B", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#FEF3C7", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Builder: { group: "Builder", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#10B981", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#ECFDF5", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Connector: { group: "Connector", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#EC4899", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#FCE7F3", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Pragmatist: { group: "Pragmatist", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#3B82F6", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#E0F2FE", goalSize: 18, goalAlign: "center", goalBgVisible: true },
  Skeptic: { group: "Skeptic", background: "", photoX: 50, photoY: 28, photoSize: 180, nameX: 50, nameY: 44, nameColor: "#FFFFFF", nameSize: 28, nameAlign: "center", emailX: 50, emailY: 49, emailColor: "#94A3B8", emailSize: 16, emailAlign: "center", groupX: 50, groupY: 41, groupColor: "#64748B", groupSize: 14, groupVisible: true, groupAlign: "center", goalX: 50, goalY: 65, goalWidth: 80, goalColor: "#F1F5F9", goalSize: 18, goalAlign: "center", goalBgVisible: true }
};

function readPosterTemplates(): Record<string, PosterTemplate> {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(POSTER_FILE)) {
      fs.writeFileSync(POSTER_FILE, JSON.stringify(DEFAULT_POSTERS, null, 2), "utf-8");
      return DEFAULT_POSTERS;
    }
    const content = fs.readFileSync(POSTER_FILE, "utf-8");
    const parsed = JSON.parse(content);
    // Fill in any missing default groups
    const finalPosters = { ...DEFAULT_POSTERS };
    Object.keys(parsed).forEach(k => {
      finalPosters[k] = { ...finalPosters[k], ...parsed[k] };
    });
    return finalPosters;
  } catch (error) {
    console.error("Error reading poster templates:", error);
    return DEFAULT_POSTERS;
  }
}

function writePosterTemplates(templates: Record<string, PosterTemplate>): boolean {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(POSTER_FILE, JSON.stringify(templates, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing poster templates:", error);
    return false;
  }
}

// Ensure database is initialized on startup
readDatabase();
readPosterTemplates();

// --- API ROUTES ---

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// GET poster templates
app.get("/api/poster-templates", (req, res) => {
  const data = readPosterTemplates();
  res.json({ success: true, templates: data });
});

// POST update poster template
app.post("/api/poster-templates", (req, res) => {
  const { group, background, photoX, photoY, photoSize, nameX, nameY, nameColor, nameSize, nameAlign, emailX, emailY, emailColor, emailSize, emailAlign, groupX, groupY, groupColor, groupSize, groupVisible, groupAlign, goalX, goalY, goalWidth, goalColor, goalSize, goalAlign, goalBgVisible, goalPaddingTop, goalPaddingBottom, goalPaddingLeft, goalPaddingRight } = req.body;
  
  if (!group) {
    res.status(400).json({ success: false, error: "Group name is required" });
    return;
  }

  const templates = readPosterTemplates();
  if (!templates[group]) {
    res.status(400).json({ success: false, error: "Invalid group name" });
    return;
  }

  // Update specific template fields
  templates[group] = {
    group,
    background: background !== undefined ? background : templates[group].background,
    photoX: typeof photoX === "number" ? photoX : templates[group].photoX,
    photoY: typeof photoY === "number" ? photoY : templates[group].photoY,
    photoSize: typeof photoSize === "number" ? photoSize : templates[group].photoSize,
    nameX: typeof nameX === "number" ? nameX : templates[group].nameX,
    nameY: typeof nameY === "number" ? nameY : templates[group].nameY,
    nameColor: nameColor || templates[group].nameColor,
    nameSize: typeof nameSize === "number" ? nameSize : templates[group].nameSize,
    nameAlign: nameAlign || templates[group].nameAlign || "center",
    emailX: typeof emailX === "number" ? emailX : (templates[group].emailX !== undefined ? templates[group].emailX : 50),
    emailY: typeof emailY === "number" ? emailY : (templates[group].emailY !== undefined ? templates[group].emailY : 49),
    emailColor: emailColor || templates[group].emailColor || "#94A3B8",
    emailSize: typeof emailSize === "number" ? emailSize : (templates[group].emailSize !== undefined ? templates[group].emailSize : 16),
    emailAlign: emailAlign || templates[group].emailAlign || "center",
    groupX: typeof groupX === "number" ? groupX : (templates[group].groupX !== undefined ? templates[group].groupX : 50),
    groupY: typeof groupY === "number" ? groupY : (templates[group].groupY !== undefined ? templates[group].groupY : 41),
    groupColor: groupColor || templates[group].groupColor || "#38BDF8",
    groupSize: typeof groupSize === "number" ? groupSize : (templates[group].groupSize !== undefined ? templates[group].groupSize : 14),
    groupVisible: typeof groupVisible === "boolean" ? groupVisible : (templates[group].groupVisible !== undefined ? templates[group].groupVisible : true),
    groupAlign: groupAlign || templates[group].groupAlign || "center",
    goalX: typeof goalX === "number" ? goalX : templates[group].goalX,
    goalY: typeof goalY === "number" ? goalY : templates[group].goalY,
    goalWidth: typeof goalWidth === "number" ? goalWidth : templates[group].goalWidth,
    goalColor: goalColor || templates[group].goalColor,
    goalSize: typeof goalSize === "number" ? goalSize : templates[group].goalSize,
    goalAlign: goalAlign || templates[group].goalAlign || "center",
    goalBgVisible: typeof goalBgVisible === "boolean" ? goalBgVisible : (templates[group].goalBgVisible !== undefined ? templates[group].goalBgVisible : true),
    goalPaddingTop: typeof goalPaddingTop === "number" ? goalPaddingTop : (templates[group].goalPaddingTop !== undefined ? templates[group].goalPaddingTop : 20),
    goalPaddingBottom: typeof goalPaddingBottom === "number" ? goalPaddingBottom : (templates[group].goalPaddingBottom !== undefined ? templates[group].goalPaddingBottom : 20),
    goalPaddingLeft: typeof goalPaddingLeft === "number" ? goalPaddingLeft : (templates[group].goalPaddingLeft !== undefined ? templates[group].goalPaddingLeft : 40),
    goalPaddingRight: typeof goalPaddingRight === "number" ? goalPaddingRight : (templates[group].goalPaddingRight !== undefined ? templates[group].goalPaddingRight : 40),
  };

  if (writePosterTemplates(templates)) {
    res.json({ success: true, template: templates[group] });
  } else {
    res.status(500).json({ success: false, error: "Internal server error saving templates to disk" });
  }
});

// Get all wishes (For Admin Panel)
app.get("/api/wishes", (req, res) => {
  const data = readDatabase();
  // We can return everything, including Base64 photos
  res.json({ success: true, wishes: data });
});

// Query user's exact wish by Email or Username (Case-Insensitive)
app.post("/api/wishes/query", (req, res) => {
  const { identifier } = req.body;
  if (!identifier || typeof identifier !== "string") {
    res.status(400).json({ success: false, error: "Please provide a valid search query" });
    return;
  }

  const queryClean = identifier.trim().toLowerCase();
  const database = readDatabase();

  const matched = database.find((item) => {
    const emailMatch = item.email.trim().toLowerCase() === queryClean;
    const userMatch = item.username.trim().toLowerCase() === queryClean;
    return emailMatch || userMatch;
  });

  if (matched) {
    res.json({ success: true, wish: matched });
  } else {
    res.status(404).json({
      success: false,
      error: "No wish found for this email or username. Let your Admin know to upload it!"
    });
  }
});

// Add high-resolution wish (Admin or User upload)
app.post("/api/wishes", (req, res) => {
  const { id, email, username, wish, photoUrl, group } = req.body;

  if (!email || !username || !wish) {
    res.status(400).json({ success: false, error: "Email, username, and goal/wish are required fields" });
    return;
  }

  const database = readDatabase();

  // Check if ID or email/username already exists to prevent duplicate
  const existsIndex = database.findIndex((item) => {
    if (id && item.id === id) return true;
    return item.email.trim().toLowerCase() === email.trim().toLowerCase() ||
           item.username.trim().toLowerCase() === username.trim().toLowerCase();
  });

  const photo = photoUrl || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%236B7280' rx='50' /><text x='50' y='55' fill='%23FFFFFF' font-size='24' font-family='sans-serif' font-weight='bold' text-anchor='middle'>${username.slice(0, 2).toUpperCase()}</text></svg>`;

  const newWish: WishRecord = {
    id: existsIndex >= 0 ? database[existsIndex].id : "wish_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    email: email.trim(),
    username: username.trim(),
    wish: wish.trim(),
    photoUrl: photo,
    group: group ? group.trim() : "Builder",
    createdAt: existsIndex >= 0 ? database[existsIndex].createdAt : new Date().toISOString()
  };

  if (existsIndex >= 0) {
    // Keep group if updated request doesn't override it with a valid one
    if (!group && database[existsIndex].group) {
      newWish.group = database[existsIndex].group;
    }
    // Update existing record
    database[existsIndex] = newWish;
  } else {
    // Insert new record
    database.push(newWish);
  }

  if (writeDatabase(database)) {
    res.json({ success: true, id: newWish.id, wish: newWish, updated: existsIndex >= 0 });
  } else {
    res.status(500).json({ success: false, error: "Internal server error saving record to disk" });
  }
});

// Delete a wish (Admin)
app.delete("/api/wishes/:id", (req, res) => {
  const { id } = req.params;
  const database = readDatabase();
  const filtered = database.filter((item) => item.id !== id);

  if (filtered.length === database.length) {
    res.status(404).json({ success: false, error: "Record not found" });
    return;
  }

  if (writeDatabase(filtered)) {
    res.json({ success: true, message: `Wish ${id} removed successfully` });
  } else {
    res.status(500).json({ success: false, error: "Internal server error deleting record from disk" });
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

initServer().catch((error) => {
  console.error("Failed to start server:", error);
});
