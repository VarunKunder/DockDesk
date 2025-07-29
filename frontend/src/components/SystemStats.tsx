// frontend/src/components/SystemStats.tsx

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cpu, HardDrive, MemoryStick, Thermometer } from "lucide-react";
import { useState, useEffect } from "react";

interface SystemData {
  cpu: number;
  ram: number;
  disk: number;
  temp: number | null; // Allow temp to be null
}

const SystemStats = () => {
  const [stats, setStats] = useState<SystemData>({
    cpu: 0,
    ram: 0,
    disk: 0,
    temp: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use a relative path, relying on the Vite proxy
        const res = await fetch("/api/stats");
        if (!res.ok) {
          throw new Error(`Server responded with status ${res.status}`);
        }
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch system stats:", error);
      }
    };

    fetchStats(); // Initial fetch
    const interval = setInterval(fetchStats, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    unit,
    color,
    progress,
  }: {
    icon: typeof Cpu;
    label: string;
    value: number | string; // Allow value to be a string (for "N/A")
    unit: string;
    color: string;
    progress: number;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <Progress value={progress} className="h-2 [&>*]:bg-purple-500" />
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">System Stats</h2>
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <StatCard
          icon={Cpu}
          label="CPU Usage"
          value={stats.cpu}
          unit="%"
          color="text-purple-500"
          progress={stats.cpu}
        />
        <StatCard
          icon={MemoryStick}
          label="RAM Usage"
          value={stats.ram}
          unit="%"
          color="text-purple-500"
          progress={stats.ram}
        />
        <StatCard
          icon={HardDrive}
          label="Disk Usage"
          value={stats.disk}
          unit="%"
          color="text-purple-500"
          progress={stats.disk}
        />
        <StatCard
          icon={Thermometer}
          label="CPU Temp"
          // ✅ Display 'N/A' if temperature is not available
          value={stats.temp !== null ? stats.temp : "N/A"}
          unit={stats.temp !== null ? "°C" : ""}
          color="text-purple-500"
          progress={stats.temp || 0}
        />
      </div>
    </Card>
  );
};

export default SystemStats;
