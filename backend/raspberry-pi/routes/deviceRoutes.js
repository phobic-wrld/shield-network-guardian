// routes/deviceRoutes.js
import express from "express";
import {
  getConnectedDevices,
  blockDevice,
  unblockDevice,
} from "../controllers/deviceController.js";

const router = express.Router();

/**
 * ✅ Get all devices (online + offline)
 * Uses cache to merge previously known devices
 */
router.get("/", getConnectedDevices);

/**
 * 🚫 Block a specific device by MAC address
 * Example: POST /api/devices/block { "mac": "XX:XX:XX:XX:XX:XX" }
 */
router.post("/block", blockDevice);

/**
 * ✅ Unblock a specific device by MAC address
 * Example: POST /api/devices/unblock { "mac": "XX:XX:XX:XX:XX:XX" }
 */
router.post("/unblock", unblockDevice);

/**
 * ⚡ [Optional] Fetch device details by MAC
 * Example: GET /api/devices/:mac
 */
router.get("/:mac", async (req, res) => {
  const mac = req.params.mac?.toLowerCase();
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  try {
    const fs = await import("fs");
    const path = await import("path");
    const cacheFile = path.resolve("./device-cache.json");

    if (!fs.existsSync(cacheFile)) {
      return res.status(404).json({ error: "No cache file found" });
    }

    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    const device = cache[mac];

    if (!device) return res.status(404).json({ error: "Device not found" });

    res.json(device);
  } catch (err) {
    console.error("⚠️ Error reading cache:", err.message);
    res.status(500).json({ error: "Failed to load device details" });
  }
});

/**
 * 🚨 [Optional] Webhook placeholder for new device alerts
 * Will be triggered when a new device connects
 */
router.post("/alert", (req, res) => {
  const { mac, ip, name } = req.body;
  console.log(`🚨 New device attempting to connect: ${name} (${mac}) @ ${ip}`);
  // TODO: integrate with frontend or Telegram/email alert
  res.json({ message: "Alert received" });
});

export default router;
