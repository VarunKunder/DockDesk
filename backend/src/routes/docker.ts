// backend/src/routes/docker.ts

import express from "express";
import Docker from "dockerode";

const router = express.Router();

// This is the standard, secure way to connect when running inside a container
// that has the Docker socket mounted.
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

router.get("/containers", async (req, res) => {
  try {
    await docker.ping();
    // ... rest of the function is the same
  } catch (error) {
    // ...
  }
});

// ... all other routes (restart, stop, start) remain the same

// --- (You can copy the full content from a previous version, just ensure the docker connection is correct) ---
// The full file content is omitted here for brevity, but the key change is the docker constant above.
// Make sure the rest of the file (the GET and POST routes) is present.
