// backend/src/routes/spotdl.ts

import express from "express";
import { spawn } from "child_process";
import { Server as SocketIOServer } from "socket.io";

const router = express.Router();

export const createSpotdlRoutes = (io: SocketIOServer) => {
  router.post("/download", (req, res) => {
    const { playlistUrl } = req.body;

    // --- FIX: Improved regex to accept Spotify URLs with extra query parameters ---
    const spotifyUrlRegex =
      /^https:\/\/open\.spotify\.com\/(playlist|track|album)\/[a-zA-Z0-9]+/;
    if (!playlistUrl || !spotifyUrlRegex.test(playlistUrl)) {
      return res
        .status(400)
        .json({
          error: "A valid Spotify Playlist, Track, or Album URL is required.",
        });
    }

    const outputPath = process.env.SPOTDL_OUTPUT_PATH;
    if (!outputPath) {
      console.error(
        "CRITICAL: SPOTDL_OUTPUT_PATH environment variable is not set."
      );
      return res
        .status(500)
        .json({ error: "Server is not configured for downloads." });
    }
    const outputTemplate = `${outputPath}/{artist}/{album}/{title}.{output-ext}`;

    const spotdlProcess = spawn("spotdl", [
      playlistUrl,
      "--output",
      outputTemplate,
    ]);

    io.emit("download:start");
    console.log(`Starting spotdl download for: ${playlistUrl}`);

    spotdlProcess.stdout.on("data", (data) => {
      io.emit("download:log", data.toString());
      console.log(data.toString());
    });

    spotdlProcess.stderr.on("data", (data) => {
      io.emit("download:log", `ERROR: ${data.toString()}`);
      console.error(data.toString());
    });

    spotdlProcess.on("close", (code) => {
      io.emit(
        "download:finish",
        `Download process finished with code ${code}.`
      );
      console.log(`Download process finished with code ${code}.`);
    });

    spotdlProcess.on("error", (err) => {
      io.emit(
        "download:error",
        `Failed to start spotdl process: ${err.message}`
      );
      console.error(`Failed to start spotdl process: ${err.message}`);
    });

    res.status(202).json({ message: "Download process started." });
  });

  return router;
};
