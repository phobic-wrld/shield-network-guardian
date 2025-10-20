// controllers/networkController.js
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const STATS_FILE = path.resolve("./network-stats.json");
let latestStats = [];

/* 🧩 Save / Load Stats */
const loadStats = () => {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
    }
  } catch (err) {
    console.error("⚠️ Failed to load stats:", err);
  }
  return [];
};

const saveStats = (data) => {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("⚠️ Failed to save stats:", err);
  }
};

/* ---------------------------------------------
   📊 Get network statistics
---------------------------------------------- */
export const getStats = (req, res) => {
  latestStats = loadStats();
  res.json({ stats: latestStats });
};

/* ---------------------------------------------
   🏎 Run speed test
---------------------------------------------- */
export const runSpeedTest = (req, res) => {
  exec("speedtest --format=json", (error, stdout, stderr) => {
    if (error) return res.status(500).json({ message: "Speedtest failed" });

    try {
      const result = JSON.parse(stdout);
      const stat = {
        timestamp: new Date().toISOString(),
        ping: result.ping.latency,
        download: (result.download.bandwidth * 8) / 1e6,
        upload: (result.upload.bandwidth * 8) / 1e6,
      };

      latestStats.unshift(stat);
      if (latestStats.length > 50) latestStats.pop();
      saveStats(latestStats);

      res.json(stat);
    } catch (parseError) {
      console.error("Parse error:", parseError);
      res.status(500).json({ message: "Failed to parse speed test result" });
    }
  });
};

/* ---------------------------------------------
   🔍 Scan devices on Shield Guardian WiFi
---------------------------------------------- */
export const scanDevices = (req, res) => {
  exec("sudo arp-scan --interface=wlan0 --localnet", (error, stdout, stderr) => {
    if (error) return res.status(500).json({ message: "Device scan failed" });

    const lines = stdout.split("\n");
    const devices = [];

    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2 && /^\d+\.\d+\.\d+\.\d+$/.test(parts[0])) {
        devices.push({ ip: parts[0], mac: parts[1].toLowerCase() });
      }
    });

    res.json(devices);
  });
};

/* ---------------------------------------------
   🌐 Network status check (optional)
---------------------------------------------- */
export const checkNetworkStatus = (req, res) => {
  exec("ping -c 3 8.8.8.8", (error, stdout, stderr) => {
    if (error) return res.status(500).json({ status: "offline" });

    const packetLossMatch = stdout.match(/, (\d+)% packet loss,/);
    const packetLoss = packetLossMatch ? parseInt(packetLossMatch[1], 10) : 0;

    const avgPingMatch = stdout.match(/rtt min\/avg\/max\/mdev = [\d.]+\/([\d.]+)\/[\d.]+\/[\d.]+ ms/);
    const avgPing = avgPingMatch ? parseFloat(avgPingMatch[1]) : null;

    res.json({
      status: packetLoss === 100 ? "offline" : "online",
      packetLoss,
      avgPing,
    });
  });
};
