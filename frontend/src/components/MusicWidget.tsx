// frontend/src/components/MusicWidget.tsx

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Download,
  Music,
  Volume2,
  VolumeX,
  Loader2,
  XCircle,
  CheckCircle,
  ListMusic,
  Search,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

// --- Type Definitions ---
interface Track {
  path: string;
  title: string;
  artist: string;
  album: string;
}
interface PlaybackState {
  duration: number;
  currentTime: number;
}
type DownloadStatus = "idle" | "downloading" | "success" | "error";

// --- Sub-component for the Download Modal ---
const DownloadModal = ({ onDownload, status, logs, url, setUrl }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Download Spotify Playlist</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex gap-2">
          <Input
            placeholder="Paste Spotify playlist URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === "downloading"}
          />
          <Button
            onClick={onDownload}
            disabled={status === "downloading" || !url.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {status === "downloading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div
          ref={logContainerRef}
          className="bg-gray-900 text-white font-mono text-xs rounded-md p-3 h-48 overflow-y-auto"
        >
          {logs.length === 0 && (
            <p className="text-gray-500">{`> Logs will appear here...`}</p>
          )}
          {logs.map((log, index) => (
            <p
              key={index}
              className="whitespace-pre-wrap break-words"
            >{`> ${log}`}</p>
          ))}
        </div>
      </div>
    </DialogContent>
  );
};

// --- Main Music Widget Component ---
const MusicWidget = () => {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
  const [downloadLogs, setDownloadLogs] = useState<string[]>([]);

  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    duration: 0,
    currentTime: 0,
  });
  const [volume, setVolume] = useState(0.75);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);
  const lastVolumeRef = useRef(0.75);

  const fetchPlaylist = useCallback(async () => {
    setPlaylistError(null);
    try {
      const response = await fetch("/api/music/playlist");
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to parse error response." }));
        throw new Error(errorData.error || "Failed to fetch playlist.");
      }
      const data: Track[] = await response.json();
      setPlaylist(data);
    } catch (error) {
      console.error("Failed to fetch playlist:", error);
      setPlaylistError(error.message);
    }
  }, []);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("connect_error", () =>
      setDownloadLogs((prev) => [
        ...prev,
        `Socket Error: Could not connect to server.`,
      ])
    );
    socket.on("download:start", () => {
      setDownloadLogs(["Download process initiated..."]);
      setDownloadStatus("downloading");
    });
    socket.on("download:log", (log: string) =>
      setDownloadLogs((prev) => [...prev, ...log.split("\n").filter(Boolean)])
    );
    socket.on("download:finish", (log: string) => {
      setDownloadLogs((prev) => [...prev, log]);
      setDownloadStatus("success");
      fetchPlaylist();
    });
    socket.on("download:error", (log: string) => {
      setDownloadLogs((prev) => [...prev, log]);
      setDownloadStatus("error");
    });
    return () => {
      socket.disconnect();
    };
  }, [fetchPlaylist]);

  const handleDownloadPlaylist = async () => {
    if (!playlistUrl.trim() || downloadStatus === "downloading") return;
    await fetch("/api/spotdl/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistUrl }),
    });
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updatePlayback = () =>
      setPlaybackState({
        duration: audio.duration || 0,
        currentTime: audio.currentTime || 0,
      });
    const handleTrackEnd = () => handleSkip("forward");
    audio.addEventListener("timeupdate", updatePlayback);
    audio.addEventListener("loadedmetadata", updatePlayback);
    audio.addEventListener("ended", handleTrackEnd);
    return () => {
      audio.removeEventListener("timeupdate", updatePlayback);
      audio.removeEventListener("loadedmetadata", updatePlayback);
      audio.removeEventListener("ended", handleTrackEnd);
    };
  }, [currentTrackIndex, playlist]);

  const playTrack = (track: Track) => {
    const originalIndex = playlist.findIndex((p) => p.path === track.path);
    if (originalIndex !== -1) {
      setCurrentTrackIndex(originalIndex);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (currentTrackIndex === null && playlist.length > 0)
      playTrack(playlist[0]);
    else setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying) audioRef.current?.play().catch(console.error);
    else audioRef.current?.pause();
  }, [isPlaying, currentTrackIndex]);

  const handleSkip = (direction: "forward" | "backward") => {
    if (currentTrackIndex === null || playlist.length === 0) return;
    const nextIndex =
      direction === "forward"
        ? (currentTrackIndex + 1) % playlist.length
        : (currentTrackIndex - 1 + playlist.length) % playlist.length;
    playTrack(playlist[nextIndex]);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Number(e.target.value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
  };

  const handleMuteToggle = () => {
    if (volume > 0) {
      lastVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(lastVolumeRef.current || 0.75);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (volume > 0) {
      lastVolumeRef.current = volume;
    }
  }, [volume]);

  const filteredPlaylist = playlist.filter(
    (track) =>
      track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentTrack =
    currentTrackIndex !== null ? playlist[currentTrackIndex] : null;
  const formatTime = (seconds: number) =>
    isNaN(seconds)
      ? "0:00"
      : new Date(seconds * 1000).toISOString().substr(14, 5);

  return (
    <Card className="p-6 space-y-6">
      <audio
        ref={audioRef}
        src={
          currentTrack
            ? `/api/music/stream?path=${encodeURIComponent(currentTrack.path)}`
            : ""
        }
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-semibold">Music Player</h2>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="border-purple-500 text-purple-500 hover:bg-purple-500/10 hover:text-purple-500 focus:ring-purple-500"
            >
              <Download className="h-4 w-4 mr-2" /> Download Playlist
            </Button>
          </DialogTrigger>
          <DownloadModal
            onDownload={handleDownloadPlaylist}
            status={downloadStatus}
            logs={downloadLogs}
            url={playlistUrl}
            setUrl={setPlaylistUrl}
          />
        </Dialog>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Now Playing
        </h3>
        <div className="text-center">
          <h4 className="font-semibold">
            {currentTrack?.title || "No Track Selected"}
          </h4>
          <p className="text-sm text-muted-foreground">
            {currentTrack?.artist || "Download or select a song"}
          </p>
        </div>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={playbackState.duration || 1}
            value={playbackState.currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(playbackState.currentTime)}</span>
            <span>{formatTime(playbackState.duration)}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-purple-500/10 hover:text-purple-500"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSkip("backward")}
            className="text-muted-foreground hover:bg-purple-500/10 hover:text-purple-500"
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={togglePlayPause}
            className="rounded-full w-10 h-10 bg-purple-600 hover:bg-purple-700"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSkip("forward")}
            className="text-muted-foreground hover:bg-purple-500/10 hover:text-purple-500"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-purple-500/10 hover:text-purple-500"
              onClick={handleMuteToggle}
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Downloaded Tracks
          </h3>
        </div>
        <Input
          placeholder="Search downloaded songs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {playlistError && (
            <div className="p-4 text-center text-red-500">{playlistError}</div>
          )}

          {!playlistError &&
            filteredPlaylist.map((track) => (
              <div
                key={track.path}
                onClick={() => playTrack(track)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                  currentTrack?.path === track.path
                    ? "bg-purple-600/20"
                    : "hover:bg-purple-600/10"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{track.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {track.artist}
                  </p>
                </div>
              </div>
            ))}

          {!playlistError && playlist.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <p>Your music library is empty.</p>
              <p className="text-xs">Use the download button to add songs.</p>
            </div>
          )}

          {!playlistError &&
            searchTerm &&
            filteredPlaylist.length === 0 &&
            playlist.length > 0 && (
              <div className="p-4 text-center text-muted-foreground">
                <p>No results found for "{searchTerm}".</p>
              </div>
            )}
        </div>
      </div>
    </Card>
  );
};

export default MusicWidget;
