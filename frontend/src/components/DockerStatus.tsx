// frontend/src/components/DockerStatus.tsx

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Container,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Square,
} from "lucide-react";

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state:
    | "created"
    | "running"
    | "paused"
    | "restarting"
    | "removing"
    | "exited"
    | "dead";
  status: string;
}

const DockerStatus = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchContainers = useCallback(async () => {
    if (!actionInProgress) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await fetch("/api/docker/containers");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch container data.");
      }
      const data: DockerContainer[] = await response.json();
      setContainers(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [actionInProgress]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  const handleContainerAction = async (
    containerId: string,
    action: "start" | "stop" | "restart"
  ) => {
    setActionInProgress(containerId);
    try {
      const response = await fetch(
        `/api/docker/containers/${containerId}/${action}`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to send ${action} command.`);
      }
      setTimeout(fetchContainers, 2000); // Refresh after a delay
    } catch (err) {
      alert(`Error performing action: ${err.message}`);
      fetchContainers(); // Refresh immediately on error
    } finally {
      setTimeout(() => setActionInProgress(null), 2000); // Reset after delay
    }
  };

  const getStatusInfo = (
    state: DockerContainer["state"]
  ): { icon: JSX.Element; color: string } => {
    // ... (This function remains the same as your previous version)
    switch (state) {
      case "running":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          color: "border-green-500/20 bg-green-500/10 text-green-500",
        };
      case "exited":
        return {
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          color: "border-red-500/20 bg-red-500/10 text-red-500",
        };
      case "restarting":
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
          color: "border-blue-500/20 bg-blue-500/10 text-blue-500",
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
          color: "border-yellow-500/20 bg-yellow-500/10 text-yellow-500",
        };
    }
  };

  const runningCount = containers.filter((c) => c.state === "running").length;
  const stoppedCount = containers.length - runningCount;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Docker Status</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {runningCount} Running
            </Badge>
            {stoppedCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stoppedCount} Stopped
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchContainers}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isLoading && !actionInProgress ? "animate-spin" : ""
            }`}
          />
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading && !actionInProgress && (
          <div className="text-center text-muted-foreground">
            Loading containers...
          </div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500 bg-red-500/10 rounded-lg">
            {error}
          </div>
        )}

        {!isLoading &&
          !error &&
          containers.map((container) => {
            const { icon, color } = getStatusInfo(container.state);
            const isThisContainerInProgress = actionInProgress === container.id;

            return (
              <div
                key={container.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="text-muted-foreground">
                    {isThisContainerInProgress ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      icon
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {container.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {container.status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs capitalize ${color}`}>
                    {container.state}
                  </Badge>

                  {container.state === "running" ? (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleContainerAction(container.id, "stop")
                        }
                        disabled={isThisContainerInProgress}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleContainerAction(container.id, "restart")
                        }
                        disabled={isThisContainerInProgress}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleContainerAction(container.id, "start")
                      }
                      disabled={isThisContainerInProgress}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </Card>
  );
};

export default DockerStatus;
