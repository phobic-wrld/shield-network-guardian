// routes/deviceRoutes.js
import express from "express";
import {
  getConnectedDevices,
  blockDevice,
  unblockDevice,
  getPendingRequests,
  handleAuthorizationRequest,
  resolveAuthorizationRequest,
} from "../controllers/deviceController.js";
import { EventEmitter } from "events";
import fs from "fs";
import path from "path";

const router = express.Router();
export const deviceEvents = new EventEmitter();

/* ---------------------------------------------
   🛰️ Get all connected devices (online + cached)
---------------------------------------------- */
router.get("/", getConnectedDevices);

/* ---------------------------------------------
   🚫 Block a specific device by MAC address
---------------------------------------------- */
router.post("/block", async (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  try {
    await blockDevice(req, res);
    deviceEvents.emit("deviceBlocked", { mac, time: new Date() });
  } catch (err) {
    console.error("❌ Failed to block device:", err);
    if (!res.headersSent)
      res.status(500).json({ error: "Failed to block device" });
  }
});

/* ---------------------------------------------
   ✅ Unblock device
---------------------------------------------- */
router.post("/unblock", async (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  try {
    await unblockDevice(req, res);
    deviceEvents.emit("deviceUnblocked", { mac, time: new Date() });
  } catch (err) {
    console.error("❌ Failed to unblock device:", err);
    if (!res.headersSent)
      res.status(500).json({ error: "Failed to unblock device" });
  }
});

/* ---------------------------------------------
   🔍 Get device details from cache (by MAC)
---------------------------------------------- */
router.get("/:mac", (req, res) => {
  const mac = req.params.mac?.toLowerCase();
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  const cacheFile = path.resolve("./device-cache.json");
  if (!fs.existsSync(cacheFile))
    return res.status(404).json({ error: "No cache file found" });

  const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  const device = cache[mac];
  if (!device) return res.status(404).json({ error: "Device not found" });

  res.json(device);
});

/* ---------------------------------------------
   🚨 Alert route (frontend -> backend)
   Used for new connection attempts
---------------------------------------------- */
router.post("/alert", (req, res) => {
  const { mac, ip, name } = req.body;
  console.log(`🚨 ALERT: New device ${name || "Unknown"} (${mac}) at ${ip}`);

  deviceEvents.emit("newDeviceAttempt", { mac, ip, name, time: new Date() });

  // In future: integrate WebSocket/Telegram/Email notifications
  res.json({ message: "Alert received" });
});

/* ---------------------------------------------
   🧠 Get pending authorization requests
---------------------------------------------- */
router.get("/pending/requests", getPendingRequests);

/* ---------------------------------------------
   🧩 Handle new authorization requests
---------------------------------------------- */
router.post("/authorize", handleAuthorizationRequest);

/* ---------------------------------------------
   ✅ Approve or 🚫 Deny authorization requests
   Optional: { mac, action, timeLimit }
---------------------------------------------- */
router.post("/resolve", async (req, res) => {
  try {
    await resolveAuthorizationRequest(req, res);
    const { mac, action, timeLimit } = req.body;

    // Emit event for UI live updates
    deviceEvents.emit("authorizationResolved", {
      mac,
      action,
      timeLimit: timeLimit || null,
      time: new Date(),
    });
  } catch (err) {
    console.error("❌ Failed to resolve authorization:", err);
    if (!res.headersSent)
      res.status(500).json({ error: "Failed to resolve authorization" });
  }
});

export default router;
