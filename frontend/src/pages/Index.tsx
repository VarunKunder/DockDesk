import SystemStats from "@/components/SystemStats";
import ServicesGrid from "@/components/ServicesGrid";
import FileBrowser from "@/components/FileBrowser";
import DockerStatus from "@/components/DockerStatus";
import MusicWidget from "@/components/MusicWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Homelab Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor, manage, and control your self-hosted infrastructure
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <SystemStats />

            <DockerStatus />
          </div>

          {/* Center Column */}
          <div className="lg:col-span-2 space-y-6">
            <ServicesGrid />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <FileBrowser />
              <MusicWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
