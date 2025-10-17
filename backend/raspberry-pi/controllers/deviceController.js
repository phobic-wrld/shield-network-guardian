// controllers/deviceController.js
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import oui from "oui";

const CACHE_FILE = path.resolve("./device-cache.json");

/**
 * 🧠 Load previous device state from cache
 */
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

/**
 * 💾 Save device state to cache
 */
const saveCache = (data) => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("⚠️ Failed to save cache:", err.message);
  }
};

/**
 * 🧩 Categorize devices based on vendor/name
 */
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

/**
 * 🛰️ Get all connected devices on the network
 */
export const getConnectedDevices = (req, res) => {
  exec("sudo arp-scan --interface=wlan0 --localnet", (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Error running arp-scan:", error);
      console.error(stderr);
      return res.status(500).json({ error: "Failed to scan network" });
    }

    const lines = stdout.split("\n");
    const devices = [];
    const cache = loadCache();

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2 && /^\d+\.\d+\.\d+\.\d+$/.test(parts[0])) {
        const ip = parts[0];
        const mac = parts[1].toLowerCase();
        const rawName = parts.slice(2).join(" ").trim();

        // ✅ Vendor Lookup
        let vendor = "Unknown";
        try {
          const lookup = oui(mac);
          if (lookup) vendor = lookup;
        } catch {
          vendor = "Unknown";
        }

        const deviceType = categorizeDevice(vendor, rawName);

        devices.push({
          ip,
          mac,
          name: rawName || vendor || "Unknown Device",
          vendor,
          type: deviceType,
          status: "online",
          lastSeen: new Date().toISOString(),
        });

        // Update cache
        cache[mac] = {
          ...cache[mac],
          ip,
          vendor,
          name: rawName || vendor,
          lastSeen: new Date().toISOString(),
          status: "online",
        };
      }
    }

    // 💤 Mark devices as offline if missing
    for (const mac in cache) {
      if (!devices.find((d) => d.mac === mac)) {
        cache[mac].status = "offline";
      }
    }

    // Save the updated cache
    saveCache(cache);

    // Merge current + offline
    const allDevices = Object.values(cache);

    // Sort alphabetically
    allDevices.sort((a, b) => a.name.localeCompare(b.name));

    res.json(allDevices);
  });
};

/**
 * 🚫 Block a device by MAC address
 * Prevents communication + forces re-auth
 */
export const blockDevice = (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  const blockCommand = `
    sudo iptables -I INPUT -m mac --mac-source ${mac} -j DROP &&
    sudo iptables -I FORWARD -m mac --mac-source ${mac} -j DROP &&
    sudo hostapd_cli deauthenticate ${mac} || true
  `;

  exec(blockCommand, (error) => {
    if (error) {
      console.error("❌ Error blocking device:", error);
      return res.status(500).json({ error: "Failed to block device" });
    }
    console.log(`🚫 Blocked device: ${mac}`);

    // Update cache
    const cache = loadCache();
    if (cache[mac]) cache[mac].blocked = true;
    saveCache(cache);

    res.json({ message: `Device ${mac} blocked successfully` });
  });
};

/**
 * ✅ Unblock a device by MAC address
 */
export const unblockDevice = (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  const unblockCommand = `
    sudo iptables -D INPUT -m mac --mac-source ${mac} -j DROP &&
    sudo iptables -D FORWARD -m mac --mac-source ${mac} -j DROP
  `;

  exec(unblockCommand, (error) => {
    if (error) {
      console.error("❌ Error unblocking device:", error);
      return res.status(500).json({ error: "Failed to unblock device" });
    }
    console.log(`✅ Unblocked device: ${mac}`);

    // Update cache
    const cache = loadCache();
    if (cache[mac]) cache[mac].blocked = false;
    saveCache(cache);

    res.json({ message: `Device ${mac} unblocked successfully` });
  });
};
