// controllers/deviceController.js
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { deviceEvents } from "../routes/deviceRoutes.js";

const require = createRequire(import.meta.url);
const oui = require("oui");

const CACHE_FILE = path.resolve("./data/device-cache.json");
let pendingRequests = [];

/* 🧠 Load & Save Cache */
const loadCache = () => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    }
  } catch (err) {
    console.error("⚠️ Failed to load cache:", err.message);
  }
  return {};
};

const saveCache = (data) => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("⚠️ Failed to save cache:", err.message);
  }
};

/* 🧩 Categorize Device */
const categorizeDevice = (vendor, name) => {
  const v = `${vendor} ${name}`.toLowerCase();
  if (v.includes("iphone") || v.includes("android") || v.includes("samsung")) return "Phone";
  if (v.includes("intel") || v.includes("hp") || v.includes("dell") || v.includes("lenovo")) return "Laptop";
  if (v.includes("lg") || v.includes("tv") || v.includes("smart tv") || v.includes("samsung tv")) return "TV";
  return "Other";
};

/* ⚙️ Run System Command */
const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(stderr || error);
      resolve(stdout);
    });
  });

/* 🛰️ Get Connected Devices (Internal Helper) */
const getConnectedDevicesInternal = async () => {
  const cache = loadCache();
  try {
    const output = await runCommand("sudo arp-scan --interface=wlan0 --localnet");
    const lines = output.split("\n");
    const devices = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2 && /^\d+\.\d+\.\d+\.\d+$/.test(parts[0])) {
        const ip = parts[0];
        const mac = parts[1].toLowerCase();
        const rawName = parts.slice(2).join(" ").trim();

        let vendor = "Unknown";
        try { vendor = oui(mac) || "Unknown"; } catch {}

        const deviceType = categorizeDevice(vendor, rawName);
        const device = {
          ip,
          mac,
          name: rawName || vendor || "Unknown Device",
          vendor,
          type: deviceType,
          status: "online",
          lastSeen: new Date().toISOString(),
          blocked: cache[mac]?.blocked || false,
        };

        devices.push(device);
        cache[mac] = device;
      }
    }

    // Mark offline devices
    for (const mac in cache) {
      if (!devices.find((d) => d.mac === mac)) cache[mac].status = "offline";
    }

    saveCache(cache);
    return Object.values(cache).sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("❌ Failed to scan devices:", err);
    return Object.values(cache);
  }
};

/* 🚫 Block Device */
export const blockDevice = async (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC required" });

  try {
    await runCommand(`sudo iptables -I INPUT -m mac --mac-source ${mac} -j DROP`);
    await runCommand(`sudo iptables -I FORWARD -m mac --mac-source ${mac} -j DROP`);
    await runCommand(`sudo hostapd_cli -i wlan0 -p /var/run/hostapd deauthenticate ${mac}`);

    const cache = loadCache();
    cache[mac] = { ...(cache[mac] || {}), blocked: true };
    saveCache(cache);

    console.log(`🚫 Device blocked: ${mac}`);
    deviceEvents.emit("deviceBlocked", { mac });

    // Broadcast updated device list
    const devices = await getConnectedDevicesInternal();
    deviceEvents.emit("device_scan", devices);

    res.json({ message: `Device ${mac} blocked successfully` });
  } catch (err) {
    console.error("❌ Block device error:", err);
    res.status(500).json({ error: "Failed to block device" });
  }
};

/* ✅ Unblock Device */
export const unblockDevice = async (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC required" });

  try {
    await runCommand(`sudo iptables -D INPUT -m mac --mac-source ${mac} -j DROP`);
    await runCommand(`sudo iptables -D FORWARD -m mac --mac-source ${mac} -j DROP`);

    const cache = loadCache();
    cache[mac] = { ...(cache[mac] || {}), blocked: false };
    saveCache(cache);

    console.log(`✅ Device unblocked: ${mac}`);
    deviceEvents.emit("deviceUnblocked", { mac });

    // Broadcast updated device list
    const devices = await getConnectedDevicesInternal();
    deviceEvents.emit("device_scan", devices);

    res.json({ message: `Device ${mac} unblocked successfully` });
  } catch (err) {
    console.error("❌ Unblock device error:", err);
    res.status(500).json({ error: "Failed to unblock device" });
  }
};

/* 🕒 Schedule Auto-Block */
export const scheduleBlock = (mac, minutes) => {
  console.log(`⏳ Scheduling ${mac} to be blocked after ${minutes} minutes`);
  setTimeout(() => blockDevice({ body: { mac } }, { json: () => {} }), minutes * 60 * 1000);
};

/* 📥 Authorization Request */
export const handleAuthorizationRequest = (req, res) => {
  const { mac, ip, name } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC required" });

  if (!pendingRequests.find(r => r.mac === mac)) {
    pendingRequests.push({ mac, ip: ip || "unknown", name: name || "Unknown Device", timestamp: new Date().toISOString(), status: "pending" });
    console.log(`🔔 New device request: ${mac}`);
    deviceEvents.emit("newDeviceAttempt", { mac, ip: ip || "unknown", name: name || "Unknown Device" });
  }

  res.json({ message: "Authorization request received", mac });
};

/* 🟢 Approve / 🔴 Deny */
export const resolveAuthorizationRequest = async (req, res) => {
  const { mac, action, timeLimit } = req.body;
  if (!mac || !action) return res.status(400).json({ error: "MAC and action required" });

  const index = pendingRequests.findIndex(r => r.mac === mac);
  if (index !== -1) pendingRequests.splice(index, 1);

  try {
    if (action === "approve") {
      await runCommand(`sudo iptables -D INPUT -m mac --mac-source ${mac} -j DROP || true`);
      await runCommand(`sudo iptables -D FORWARD -m mac --mac-source ${mac} -j DROP || true`);
      if (timeLimit) scheduleBlock(mac, timeLimit);
      deviceEvents.emit("deviceApproved", { mac });
    } else {
      await runCommand(`sudo iptables -I INPUT -m mac --mac-source ${mac} -j DROP`);
      await runCommand(`sudo iptables -I FORWARD -m mac --mac-source ${mac} -j DROP`);
      await runCommand(`sudo hostapd_cli -i wlan0 deauthenticate ${mac}`);
      deviceEvents.emit("deviceBlocked", { mac });
    }

    // Update cache
    const cache = loadCache();
    cache[mac] = { ...(cache[mac] || {}), blocked: action !== "approve" };
    saveCache(cache);

    // Broadcast updated device list
    const devices = await getConnectedDevicesInternal();
    deviceEvents.emit("device_scan", devices);

    res.json({ message: `Device ${mac} ${action}ed successfully` });
  } catch (err) {
    console.error("❌ Resolve request error:", err);
    res.status(500).json({ error: `Failed to ${action} device` });
  }
};

/* 📋 Get Pending Requests */
export const getPendingRequests = (req, res) => {
  res.json(pendingRequests);
};

/* 🛰️ API Route: Get Connected Devices */
export const getConnectedDevices = async (req, res) => {
  const devices = await getConnectedDevicesInternal();
  res.json(devices);
};
