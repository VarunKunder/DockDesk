// backend/src/index.ts

import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import servicesRouter from "./routes/services";
import statsRouter from "./routes/stats";
import dockerRouter from "./routes/docker";
import filesRouter from "./routes/files";
import { createSpotdlRoutes } from "./routes/spotdl";
import musicRouter from "./routes/music";

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
});

const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/services", servicesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/docker", dockerRouter);
app.use("/api/files", filesRouter);
app.use("/api/spotdl", createSpotdlRoutes(io));
app.use("/api/music", musicRouter);

server.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  console.log(
    `🎵 SpotifyDL API configured for output: ${
      process.env.SPOTDL_OUTPUT_PATH || "Not Set"
    }`
  );
});
