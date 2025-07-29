// src/components/ServicesGrid.tsx

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Server,
  Music,
  Cloud,
  Monitor,
  Activity,
  Home,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Service {
  name: string;
  description: string;
  url: string;
  icon: string;
  status: "online" | "offline" | "warning";
  category: string;
}

const iconMap: Record<string, any> = {
  Server,
  Music,
  Cloud,
  Monitor,
  Activity,
  Home,
};

const ServicesGrid = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    description: "",
    url: "",
    icon: "Server",
    category: "",
  });

  const fetchServices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Error fetching services:", err);
      alert(`Failed to fetch services. Is the backend running?`);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "warning":
        return "Warning";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const addService = async () => {
    if (!newService.name || !newService.url) {
      alert("Please fill in both the Name and URL fields.");
      return;
    }

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newService),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error || `Server responded with status ${response.status}`;
        throw new Error(errorMessage);
      }

      fetchServices();
      setNewService({
        name: "",
        description: "",
        url: "",
        icon: "Server",
        category: "",
      });
      setDialogOpen(false);
    } catch (err) {
      alert(`Error saving service: ${err.message}`);
    }
  };

  const deleteService = async (name: string) => {
    try {
      const response = await fetch(
        `/api/services/${encodeURIComponent(name)}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      fetchServices();
    } catch (err) {
      alert(`Error deleting service: ${err.message}`);
    }
  };

  return (
    <Card className="p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Services</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {services.filter((s) => s.status === "online").length}/
            {services.length} Online
          </Badge>

          <Button
            size="sm"
            onClick={fetchServices}
            disabled={isRefreshing}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={newService.url}
                    onChange={(e) =>
                      setNewService({ ...newService, url: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newService.description}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Icon</Label>
                  <Select
                    value={newService.icon}
                    onValueChange={(val) =>
                      setNewService({ ...newService, icon: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(iconMap).map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Input
                    value={newService.category}
                    onChange={(e) =>
                      setNewService({ ...newService, category: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={addService}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Server;
          return (
            <div
              key={service.name}
              className="group relative p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {service.category}
                    </p>
                  </div>
                </div>
                <a href={service.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" />
                </a>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {service.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(
                      service.status
                    )}`}
                  ></div>
                  <span className="text-xs">
                    {getStatusText(service.status)}
                  </span>
                </div>
                <button
                  className="text-xs text-red-500 hover:underline"
                  onClick={() => deleteService(service.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ServicesGrid;
