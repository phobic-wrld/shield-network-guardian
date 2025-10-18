// routes/deviceRoutes.js
import express from "express";
import {
  getConnectedDevices,
  blockDevice,
  unblockDevice,
} from "../controllers/deviceController.js";
import { EventEmitter } from "events";
import fs from "fs";
import path from "path";

const router = express.Router();
export const deviceEvents = new EventEmitter();

/**
 * ✅ Get all devices (online + offline)
 */
router.get("/", getConnectedDevices);

/**
 * 🚫 Block a specific device by MAC address
 */
router.post("/block", async (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  try {
    const result = await blockDevice(req, res);

    // 🔔 Emit event for blocked device
    deviceEvents.emit("deviceBlocked", { mac, time: new Date() });

    res.json({
      message: `Device ${mac} has been blocked and disconnected.`,
    });
  } catch (err) {
    console.error("❌ Failed to block device:", err);
    res.status(500).json({ error: "Failed to block device" });
  }
});

/**
 * ✅ Unblock device
 */
router.post("/unblock", async (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  try {
    await unblockDevice(req, res);
    deviceEvents.emit("deviceUnblocked", { mac, time: new Date() });
    res.json({ message: `Device ${mac} unblocked successfully.` });
  } catch (err) {
    console.error("❌ Failed to unblock device:", err);
    res.status(500).json({ error: "Failed to unblock device" });
  }
});

/**
 * ⚡ Fetch device details by MAC address
 */
router.get("/:mac", (req, res) => {
  const mac = req.params.mac?.toLowerCase();
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  const cacheFile = path.resolve("./device-cache.json");

  if (!fs.existsSync(cacheFile)) {
    return res.status(404).json({ error: "No cache file found" });
  }

  const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  const device = cache[mac];

  if (!device) return res.status(404).json({ error: "Device not found" });
  res.json(device);
});

/**
 * 🚨 Webhook / Notification route for frontend alerts
 * e.g., when new device tries to connect
 */
router.post("/alert", (req, res) => {
  const { mac, ip, name } = req.body;
  console.log(`🚨 ALERT: New device ${name || "Unknown"} (${mac}) at ${ip}`);

  // Emit real-time event
  deviceEvents.emit("newDeviceAttempt", { mac, ip, name, time: new Date() });

  // Future: integrate with WebSocket/Telegram/Email notifications
  res.json({ message: "Alert received" });
});

export default router;
