// controllers/networkController.js
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const STATS_FILE = path.resolve("./network-stats.json");
let latestStats = [];

/* 🧩 Load / Save Stats */
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
   📊 Get network performance stats (latest + history)
---------------------------------------------- */
export const getPerformance = (req, res) => {
  latestStats = loadStats();
  const latest = latestStats[0] || {
    timestamp: new Date().toISOString(),
    download: 0,
    upload: 0,
    ping: 0,
    devices: 0,
    stability: 100,
    alerts: [],
  };
  res.json({ latest, history: latestStats });
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
        download: (result.download.bandwidth * 8) / 1e6, // Mbps
        upload: (result.upload.bandwidth * 8) / 1e6, // Mbps
        devices: latestStats[0]?.devices || 0,
        stability: latestStats[0]?.stability || 100,
        alerts: latestStats[0]?.alerts || [],
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
   🔍 Scan devices on WiFi
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

    latestStats = loadStats();
    if (latestStats[0]) {
      latestStats[0].devices = devices.length;

      if (devices.length > 10) {
        latestStats[0].alerts.push({
          type: "warning",
          message: `High device load: ${devices.length} devices connected`,
        });
      }

      saveStats(latestStats);
    }

    res.json(devices);
  });
};

/* ---------------------------------------------
   🌐 Check network stability & ping
---------------------------------------------- */
export const checkNetworkStatus = (req, res) => {
  exec("ping -c 3 8.8.8.8", (error, stdout, stderr) => {
    if (error) return res.status(500).json({ status: "offline" });

    const packetLossMatch = stdout.match(/, (\d+)% packet loss,/);
    const packetLoss = packetLossMatch ? parseInt(packetLossMatch[1], 10) : 0;

    const avgPingMatch = stdout.match(
      /rtt min\/avg\/max\/mdev = [\d.]+\/([\d.]+)\/[\d.]+\/[\d.]+ ms/
    );
    const avgPing = avgPingMatch ? parseFloat(avgPingMatch[1]) : null;

    latestStats = loadStats();
    if (latestStats[0]) {
      latestStats[0].stability = 100 - packetLoss;

      if (packetLoss > 20) {
        latestStats[0].alerts.push({
          type: "warning",
          message: `High packet loss detected: ${packetLoss}%`,
        });
      }

      saveStats(latestStats);
    }

    res.json({
      status: packetLoss === 100 ? "offline" : "online",
      packetLoss,
      avgPing,
    });
  });
};

/* ---------------------------------------------
   🚨 Get current network alerts
---------------------------------------------- */
export const getAlerts = (req, res) => {
  latestStats = loadStats();
  const alerts = latestStats[0]?.alerts || [];
  res.json({ alerts });
};
