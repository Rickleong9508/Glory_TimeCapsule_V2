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

// Ensure database is initialized on startup
readDatabase();

// --- API ROUTES ---

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
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
