// backend/src/routes/music.ts

import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

const MUSIC_DIRECTORY = process.env.SPOTDL_OUTPUT_PATH;

const findMusicFiles = async (
  dir: string,
  relativeDir = ""
): Promise<any[]> => {
  if (!MUSIC_DIRECTORY) return [];

  const fullDirPath = path.join(dir, relativeDir);

  // ✅ FIX: Check if the directory exists before trying to read it
  try {
    await fs.access(fullDirPath);
  } catch (error) {
    console.warn(`Music directory not found, creating it: ${fullDirPath}`);
    // If it doesn't exist, create it so it's ready for downloads
    await fs.mkdir(fullDirPath, { recursive: true });
    return []; // Return an empty array since it's a new directory
  }

  const entries = await fs.readdir(fullDirPath, { withFileTypes: true });
  let files: any[] = [];

  for (const entry of entries) {
    const entryPath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await findMusicFiles(dir, entryPath));
    } else if (
      entry.isFile() &&
      /\.(mp3|m4a|flac|ogg|wav)$/i.test(entry.name)
    ) {
      const pathParts = entryPath.split(path.sep);
      files.push({
        path: entryPath,
        title: path.basename(entry.name, path.extname(entry.name)),
        artist:
          pathParts.length > 2
            ? pathParts[pathParts.length - 3]
            : "Unknown Artist",
        album:
          pathParts.length > 1
            ? pathParts[pathParts.length - 2]
            : "Unknown Album",
      });
    }
  }
  return files;
};

router.get("/playlist", async (req, res) => {
  if (!MUSIC_DIRECTORY) {
    return res
      .status(500)
      .json({ error: "Music directory is not configured on the server." });
  }

  try {
    const tracks = await findMusicFiles(MUSIC_DIRECTORY);
    res.json(tracks); // ✅ This will now be an empty array if the folder is empty/new
  } catch (error) {
    console.error("Error scanning music directory:", error);
    res.status(500).json({ error: "Could not read music library." });
  }
});

router.get("/stream", (req, res) => {
  const trackPath = req.query.path as string;

  if (!MUSIC_DIRECTORY || !trackPath) {
    return res.status(400).json({ error: "Track path is required." });
  }

  const absolutePath = path.join(MUSIC_DIRECTORY, trackPath);

  if (!absolutePath.startsWith(MUSIC_DIRECTORY)) {
    return res.status(403).json({ error: "Access denied." });
  }

  res.sendFile(absolutePath, (err) => {
    if (err) {
      console.error("Stream error:", err);
      res.status(404).send("File not found.");
    }
  });
});

export default router;
