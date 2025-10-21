/**
 * 🖥️ Shield Network Guardian – Raspberry Pi Server
 * --------------------------------------------------
 * Features:
 *  ✅ Speedtest (Download, Upload, Ping)
 *  ✅ Device Scan with Hostnames
 *  ✅ Latency Monitor
 *  ✅ WebSocket Real-Time Broadcasts
 *  ✅ Alerts System (Auto-generated warnings)
 *  ✅ Device Block/Unblock + Authorization Events
 *  ✅ Guest WiFi Management (time-limited access)
 */

import express from "express";
import http from "http";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import deviceRoutes, { deviceEvents } from "./routes/deviceRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/network-stats" });

app.use(cors());
app.use(express.json());
app.use("/api/devices", deviceRoutes);
app.use("/api/guests", guestRoutes);

// ======================= GLOBAL STATE =======================
let clients = new Set();
const STATS_FILE = path.resolve("./network-stats.json");
let latestStats = {
  downloadSpeed: 0,
  uploadSpeed: 0,
  ping: 0,
  latency: 0,
  timestamp: new Date(),
  alerts: [],
};

// ======================= UTILITY FUNCTIONS =======================
const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });

// 🧩 Load stats from file (persist alerts)
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

/**
 * ✅ Run speedtest via shield-venv speedtest-cli
 */
async function runSpeedTest() {
  try {
    const output = await runCommand("~/shield-venv/bin/speedtest-cli --json");
    const result = JSON.parse(output);
    const data = {
      downloadSpeed: +(result.download / 1e6).toFixed(2), // Mbps
      uploadSpeed: +(result.upload / 1e6).toFixed(2),
      ping: result.ping,
      timestamp: new Date(result.timestamp),
    };

    // Simple alerts
    if (data.downloadSpeed < 5)
      addAlert("warning", `Low download speed detected: ${data.downloadSpeed} Mbps`);
    if (data.ping > 200)
      addAlert("warning", `High latency detected: ${data.ping} ms`);

    return data;
  } catch (err) {
    console.error("❌ Speedtest error:", err.message);
    addAlert("error", "Speedtest failed to run");
    return { downloadSpeed: 0, uploadSpeed: 0, ping: 0, timestamp: new Date() };
  }
}

/**
 * 🟢 Ping Google DNS for latency
 */
async function getLatency() {
  try {
    const output = await runCommand("ping -c 4 8.8.8.8");
    const match = output.match(/rtt min\/avg\/max\/mdev = [\d.]+\/([\d.]+)/);
    const latency = match ? parseFloat(match[1]) : 100;
    if (latency > 150)
      addAlert("warning", `Network latency is high: ${latency} ms`);
    return { latency };
  } catch {
    addAlert("error", "Failed to reach network (ping error)");
    return { latency: 100 };
  }
}

/**
 * 🖧 Scan network devices
 */
async function scanNetworkDevices() {
  try {
    const output = await runCommand("arp -a");
    const devices = output
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        const ipMatch = line.match(/\b\d{1,3}(\.\d{1,3}){3}\b/);
        const macMatch = line.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
        const hostnameMatch = line.match(/^([^\s]+)\s+\(/);
        return {
          name: hostnameMatch ? hostnameMatch[1] : "Unknown",
          ip: ipMatch ? ipMatch[0] : "unknown",
          mac: macMatch ? macMatch[0].toLowerCase() : "unknown",
          lastSeen: new Date(),
        };
      })
      .filter(d => d.ip !== "unknown" && d.mac !== "unknown");

    // Alert if too many devices
    if (devices.length > 10)
      addAlert("warning", `High device load: ${devices.length} connected`);

    return devices;
  } catch (err) {
    addAlert("error", "Device scan failed");
    console.error("❌ Device scan error:", err.message);
    return [];
  }
}

/**
 * 🔔 Add network alert
 */
function addAlert(type, message) {
  const alert = { type, message, timestamp: new Date().toISOString() };
  latestStats.alerts.push(alert);

  // Keep only recent 10
  if (latestStats.alerts.length > 10) latestStats.alerts.shift();

  broadcastToClients({ type: "new_alert", data: alert });

  // Persist to file
  const stats = loadStats();
  const updated = [latestStats, ...stats].slice(0, 50);
  saveStats(updated);
}

/**
 * 🔄 Update stats and broadcast to clients
 */
async function updateLatestStats() {
  const speed = await runSpeedTest();
  const latency = await getLatency();
  latestStats = { ...speed, latency: latency.latency, timestamp: new Date(), alerts: latestStats.alerts };
  broadcastToClients({ type: "stats_update", data: latestStats });

  console.log(
    `✅ Updated stats → ↓ ${latestStats.downloadSpeed} Mbps | ↑ ${latestStats.uploadSpeed} Mbps | Ping ${latestStats.ping} ms`
  );
}

// Initial update + periodic refresh
updateLatestStats();
setInterval(updateLatestStats, 10 * 60 * 1000); // every 10 min

// ======================= EXPRESS ROUTES =======================
app.get("/health", (_, res) => res.send("OK"));
app.get("/api/network/stats", (_, res) => res.json(latestStats));
app.get("/api/network/alerts", (_, res) => res.json({ alerts: latestStats.alerts }));

app.get("/api/network/speedtest", async (_, res) => {
  const result = await runSpeedTest();
  latestStats = { ...latestStats, ...result };
  broadcastToClients({ type: "speedtest", data: result });
  res.json(result);
});

app.get("/api/network/scan", async (_, res) => {
  const devices = await scanNetworkDevices();
  broadcastToClients({ type: "device_scan", data: devices });
  res.json({ devices });
});

// ======================= WEBSOCKET HANDLER =======================
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("🔗 WebSocket client connected");

  // Send initial stats + alerts
  ws.send(JSON.stringify({ type: "initial_stats", data: latestStats }));
  ws.send(JSON.stringify({ type: "initial_alerts", data: latestStats.alerts }));

  ws.on("message", async (msg) => {
    const message = msg.toString();
    if (message === "speedtest")
      ws.send(JSON.stringify({ type: "speedtest", data: await runSpeedTest() }));
    if (message === "scandevices")
      ws.send(JSON.stringify({ type: "device_scan", data: await scanNetworkDevices() }));
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ WebSocket disconnected");
  });
});

/**
 * 📡 Broadcast to all WebSocket clients
 */
function broadcastToClients(data) {
  const msg = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ======================= DEVICE EVENT LISTENERS =======================
deviceEvents.on("newDeviceAttempt", (device) =>
  broadcastToClients({ type: "new_device_attempt", data: device })
);
deviceEvents.on("deviceBlocked", (device) =>
  broadcastToClients({ type: "device_blocked", data: device })
);
deviceEvents.on("deviceUnblocked", (device) =>
  broadcastToClients({ type: "device_unblocked", data: device })
);
deviceEvents.on("authorizationResolved", (event) =>
  broadcastToClients({ type: "authorization_resolved", data: event })
);

// ======================= START SERVER =======================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Shield Network Guardian (Pi) running on port ${PORT}`)
);
