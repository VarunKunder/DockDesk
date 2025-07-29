// backend/routes/services.ts

import express from "express";
import fs from "fs/promises";
import path from "path";
import { checkServiceStatus } from "../utils/statusChecker";

const router = express.Router();
const dataPath = path.join(__dirname, "..", "data", "services.json");

interface Service {
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  status: "online" | "offline";
}

async function loadServices(): Promise<Service[]> {
  try {
    const data = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }
    // For any other error, re-throw it to be handled by the route's catch block
    throw error;
  }
}

async function saveServices(services: Service[]): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(services, null, 2));
}

// GET all services with fresh statuses
router.get("/", async (req, res) => {
  try {
    const services = await loadServices();

    const servicesWithFreshStatus = await Promise.all(
      services.map(async (service) => {
        const status = await checkServiceStatus(service.url);
        return { ...service, status };
      })
    );

    res.json(servicesWithFreshStatus);
  } catch (error) {
    console.error("Failed to load or refresh services:", error);
    res.status(500).json({ error: "Failed to retrieve services." });
  }
});

// POST a new service
// POST a new service
router.post("/", async (req, res) => {
  try {
    const { name, description, url, icon, category } = req.body;

    if (!name || !url || !icon) {
      return res
        .status(400)
        .json({ error: "Missing required fields: name, url, icon." });
    }

    const services = await loadServices();

    // ✅ Check if URL already exists
    if (services.some((s) => s.url === url)) {
      return res
        .status(409)
        .json({ error: "Service with this URL already exists." });
    }

    // ✅ Check if name already exists (case insensitive)
    if (services.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      return res
        .status(409)
        .json({ error: "A service with this name already exists." });
    }

    const status = await checkServiceStatus(url);

    const newService: Service = {
      name,
      description: description || "",
      url,
      icon,
      category: category || "Uncategorized",
      status,
    };

    services.push(newService);
    await saveServices(services);

    res.status(201).json(newService);
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ error: "Failed to add new service." });
  }
});

// DELETE a service by name
router.delete("/:name", async (req, res) => {
  try {
    const serviceNameToDelete = req.params.name;
    let services = await loadServices();

    const initialLength = services.length;
    services = services.filter((s) => s.name !== serviceNameToDelete);

    if (services.length === initialLength) {
      return res.status(404).json({ error: "Service not found." });
    }

    await saveServices(services);

    res.status(204).send(); // 204 No Content is standard for a successful DELETE
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Failed to delete service." });
  }
});

export default router;
