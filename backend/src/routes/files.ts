// backend/src/routes/files.ts

import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

// --- SECURITY: Define the root directory for the file browser ---
// This is the ONLY directory the API will be allowed to access.
// We'll get this path from an environment variable for flexibility.
const BROWSER_ROOT = process.env.FILE_BROWSER_ROOT || "/";

// Helper function to format file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * GET /api/files/browse
 * Lists the contents of a directory.
 * Expects a 'path' query parameter (e.g., /api/files/browse?path=/Documents)
 */
router.get("/browse", async (req, res) => {
  try {
    const userPath = req.query.path || "/";

    // --- SECURITY CHECK ---
    // Create an absolute path by joining the user's path with our root directory.
    const absolutePath = path.join(BROWSER_ROOT, userPath as string);

    // Ensure the resolved path is still inside our BROWSER_ROOT jail.
    // This prevents directory traversal attacks (e.g., using '../').
    if (!absolutePath.startsWith(BROWSER_ROOT)) {
      return res.status(403).json({ error: "Access denied." });
    }

    const dirEntries = await fs.readdir(absolutePath, { withFileTypes: true });

    const files = await Promise.all(
      dirEntries.map(async (entry) => {
        const entryPath = path.join(absolutePath, entry.name);
        const stats = await fs.stat(entryPath);
        return {
          name: entry.name,
          type: entry.isDirectory() ? "folder" : "file",
          size: entry.isFile() ? formatSize(stats.size) : undefined,
          modified: stats.mtime.toISOString().split("T")[0],
          path: path.join(userPath as string, entry.name),
        };
      })
    );

    res.json(files);
  } catch (error) {
    console.error("File browser error:", error);
    res.status(500).json({ error: "Failed to read directory." });
  }
});

/**
 * GET /api/files/download
 * Downloads a specific file.
 * Expects a 'path' query parameter.
 */
router.get("/download", (req, res) => {
  const userPath = req.query.path;

  if (!userPath) {
    return res.status(400).json({ error: "File path is required." });
  }

  const absolutePath = path.join(BROWSER_ROOT, userPath as string);

  if (!absolutePath.startsWith(BROWSER_ROOT)) {
    return res.status(403).json({ error: "Access denied." });
  }

  res.download(absolutePath, (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(404).send("File not found.");
    }
  });
});

export default router;
