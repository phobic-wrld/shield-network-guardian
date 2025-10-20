// controllers/deviceController.js
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const oui = require("oui");

const CACHE_FILE = path.resolve("./device-cache.json");
let pendingRequests = [];

/* 🧠 Load and Save Cache */
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

/* 🧩 Categorize device type */
const categorizeDevice = (vendor, name) => {
  const v = `${vendor} ${name}`.toLowerCase();
  if (v.includes("iphone") || v.includes("android") || v.includes("samsung"))
    return "Phone";
  if (v.includes("intel") || v.includes("hp") || v.includes("dell") || v.includes("lenovo"))
    return "Laptop";
  if (v.includes("lg") || v.includes("tv") || v.includes("smart tv") || v.includes("samsung tv"))
    return "TV";
  return "Other";
};

/* ⚙️ System Commands */
const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`⚠️ Command failed: ${error.message}`);
        return reject(stderr);
      }
      resolve(stdout);
    });
  });

/* 🚫 Block Device */
export const blockDevice = async (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  const cmd = `
    sudo iptables -I INPUT -m mac --mac-source ${mac} -j DROP;
    sudo iptables -I FORWARD -m mac --mac-source ${mac} -j DROP;
    sudo hostapd_cli deauthenticate ${mac} || true;
  `;

  try {
    await runCommand(cmd);
    const cache = loadCache();
    if (!cache[mac]) cache[mac] = {};
    cache[mac].blocked = true;
    saveCache(cache);
    console.log(`🚫 Device blocked: ${mac}`);
    res.json({ message: `Device ${mac} blocked successfully` });
  } catch {
    res.status(500).json({ error: "Failed to block device" });
  }
};

/* ✅ Unblock Device */
export const unblockDevice = async (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  const cmd = `
    sudo iptables -D INPUT -m mac --mac-source ${mac} -j DROP 2>/dev/null || true;
    sudo iptables -D FORWARD -m mac --mac-source ${mac} -j DROP 2>/dev/null || true;
  `;

  try {
    await runCommand(cmd);
    const cache = loadCache();
    if (!cache[mac]) cache[mac] = {};
    cache[mac].blocked = false;
    saveCache(cache);
    console.log(`✅ Device unblocked: ${mac}`);
    res.json({ message: `Device ${mac} unblocked successfully` });
  } catch {
    res.status(500).json({ error: "Failed to unblock device" });
  }
};

/* 🕒 Auto-block device after specific duration */
export const scheduleBlock = (mac, minutes) => {
  console.log(`⏳ Scheduling ${mac} to be blocked after ${minutes} minutes...`);
  setTimeout(async () => {
    try {
      await runCommand(`
        sudo iptables -I INPUT -m mac --mac-source ${mac} -j DROP;
        sudo iptables -I FORWARD -m mac --mac-source ${mac} -j DROP;
        sudo hostapd_cli deauthenticate ${mac} || true;
      `);
      const cache = loadCache();
      if (!cache[mac]) cache[mac] = {};
      cache[mac].blocked = true;
      saveCache(cache);
      console.log(`🕓 Auto-blocked ${mac} after ${minutes} minutes`);
    } catch (err) {
      console.error(`❌ Failed to auto-block ${mac}:`, err);
    }
  }, minutes * 60 * 1000);
};

/* 🛰️ Get connected devices */
export const getConnectedDevices = (req, res) => {
  exec("sudo arp-scan --interface=wlan0 --localnet", (error, stdout, stderr) => {
    if (error) {
      console.error("❌ arp-scan failed:", stderr);
      return res.status(500).json({ error: "Failed to scan network" });
    }

    const lines = stdout.split("\n");
    const cache = loadCache();
    const devices = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2 && /^\d+\.\d+\.\d+\.\d+$/.test(parts[0])) {
        const ip = parts[0];
        const mac = parts[1].toLowerCase();
        const rawName = parts.slice(2).join(" ").trim();

        let vendor = "Unknown";
        try {
          const lookup = oui(mac);
          if (lookup) vendor = lookup;
        } catch {
          vendor = "Unknown";
        }

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

    // Mark cached devices as offline if missing
    for (const mac in cache) {
      if (!devices.find((d) => d.mac === mac)) {
        cache[mac].status = "offline";
      }
    }

    saveCache(cache);
    res.json(Object.values(cache).sort((a, b) => a.name.localeCompare(b.name)));
  });
};

/* 📥 Handle authorization requests */
export const handleAuthorizationRequest = (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  if (!pendingRequests.find((r) => r.mac === mac)) {
    pendingRequests.push({
      mac,
      timestamp: new Date().toISOString(),
      status: "pending",
    });
    console.log(`🔔 Authorization request from: ${mac}`);
  }

  res.json({ message: "Authorization request received", mac });
};

/* 🟢 Approve / 🔴 Deny authorization */
export const resolveAuthorizationRequest = (req, res) => {
  const { mac, action, timeLimit } = req.body;
  if (!mac || !action)
    return res.status(400).json({ error: "MAC and action required" });

  const index = pendingRequests.findIndex((r) => r.mac === mac);
  if (index === -1) return res.status(404).json({ error: "Request not found" });

  const request = pendingRequests[index];
  pendingRequests.splice(index, 1);

  const approveCmd = `
    sudo iptables -D INPUT -m mac --mac-source ${mac} -j DROP 2>/dev/null || true;
    sudo iptables -D FORWARD -m mac --mac-source ${mac} -j DROP 2>/dev/null || true;
  `;
  const blockCmd = `
    sudo iptables -I INPUT -m mac --mac-source ${mac} -j DROP;
    sudo iptables -I FORWARD -m mac --mac-source ${mac} -j DROP;
    sudo hostapd_cli deauthenticate ${mac} || true;
  `;

  exec(action === "approve" ? approveCmd : blockCmd, (error) => {
    if (error) console.warn(`⚠️ ${action} command warning for ${mac}: ${error.message}`);
  });

  const cache = loadCache();
  if (!cache[mac]) cache[mac] = {};
  cache[mac].blocked = action !== "approve";
  saveCache(cache);

  if (action === "approve" && timeLimit) {
    scheduleBlock(mac, timeLimit); // auto block after minutes
  }

  console.log(`${action === "approve" ? "✅ Approved" : "🚫 Blocked"} device ${mac}`);
  res.json({ message: `Device ${mac} ${action}ed successfully` });
};

/* 📋 Get pending authorization requests */
export const getPendingRequests = (req, res) => {
  res.json(pendingRequests);
};
