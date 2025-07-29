// backend/src/routes/stats.ts

import express from "express";
import si from "systeminformation";

const router = express.Router();

// This path is configured in your package.json (e.g., 'C:' for Windows, '/mnt/hdd' for Linux)
const DISK_PATH = process.env.STATS_DISK_PATH || "/";

router.get("/", async (req, res) => {
  try {
    const [cpuData, memData, fsData, tempData] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.cpuTemperature(),
    ]);

    // --- FIX: Smarter disk detection for cross-platform compatibility ---
    let mainDisk = fsData.find((d) => d.mount === DISK_PATH);

    // If the direct match fails (common on Windows), try a more flexible check.
    if (!mainDisk && process.platform === "win32") {
      // On Windows, find a disk that starts with the specified drive letter (e.g., 'C:').
      mainDisk = fsData.find((d) =>
        d.mount.toUpperCase().startsWith(DISK_PATH.toUpperCase())
      );
    }
    // --- End of Fix ---

    const stats = {
      cpu: Math.round(cpuData.currentLoad),
      ram: Math.round((memData.used / memData.total) * 100),
      disk: mainDisk ? Math.round(mainDisk.use) : 0,
      temp: tempData.main !== null ? Math.round(tempData.main) : 25,
    };

    res.json(stats);
  } catch (error) {
    console.error("Failed to fetch system stats:", error);
    res.status(500).json({ error: "Could not retrieve system statistics." });
  }
});

export default router;
