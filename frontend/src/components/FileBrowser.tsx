// frontend/src/components/FileBrowser.tsx

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Folder,
  File,
  Download,
  Search,
  Home,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface FileItem {
  name: string;
  type: "file" | "folder";
  size?: string;
  modified: string;
  path: string;
}

const FileBrowser = () => {
  const [currentPath, setCurrentPath] = useState("/");
  const [searchTerm, setSearchTerm] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // URL-encode the path to handle spaces and special characters
      const response = await fetch(
        `/api/files/browse?path=${encodeURIComponent(path)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch files.");
      }
      const data: FileItem[] = await response.json();
      setFiles(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath, fetchFiles]);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemClick = (item: FileItem) => {
    if (item.type === "folder") {
      setCurrentPath(item.path);
    }
    // Download is handled by a separate button
  };

  const handleDownload = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation(); // Prevent triggering the row's click event
    // Create a temporary link to trigger the download
    const downloadUrl = `/api/files/download?path=${encodeURIComponent(
      filePath
    )}`;
    window.open(downloadUrl, "_blank");
  };

  const goBack = () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    setCurrentPath(parentPath);
  };

  const goHome = () => {
    setCurrentPath("/");
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">File Browser</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goHome}
            disabled={isLoading}
          >
            <Home className="h-4 w-4" />
          </Button>
          {currentPath !== "/" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Search current directory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-4 bg-secondary border-border"
        />
        <div className="text-sm text-muted-foreground mb-4">
          Current path:{" "}
          <span className="font-mono text-foreground">{currentPath}</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="p-4 text-center text-red-500 bg-red-500/10 rounded-lg">
              {error}
            </div>
          )}

          {!isLoading &&
            !error &&
            filteredFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 cursor-pointer transition-colors group"
                onClick={() => handleItemClick(file)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {file.type === "folder" ? (
                    <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{file.modified}</span>
                      {file.size && <span>• {file.size}</span>}
                    </div>
                  </div>
                </div>

                {file.type === "file" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDownload(e, file.path)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          {!isLoading && !error && filteredFiles.length === 0 && (
            <div className="text-center text-muted-foreground p-8">
              This folder is empty.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FileBrowser;
