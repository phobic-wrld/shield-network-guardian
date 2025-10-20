/**
 * 🖥️ Shield Network Guardian – Raspberry Pi Server
 * --------------------------------------------------
 * Features:
 *  ✅ Speedtest (Download, Upload, Ping)
 *  ✅ Device Scan with Hostnames
 *  ✅ Latency Monitor
 *  ✅ WebSocket Real-Time Broadcasts
 *  ✅ Device Block/Unblock + Authorization Events
 *  ✅ Guest WiFi Management (time-limited access)
 *  ✅ Scheduler + Suspicious Device Alerts
 */

import express from "express";
import http from "http";
import cors from "cors";
import { exec } from "child_process";
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
let latestStats = {
  downloadSpeed: 0,
  uploadSpeed: 0,
  ping: 0,
  timestamp: new Date(),
};

// ======================= UTILITY FUNCTIONS =======================
const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });

/**
 * ✅ Run speedtest via shield-venv speedtest-cli
 */
async function runSpeedTest() {
  try {
    // Use the virtual environment path explicitly
    const output = await runCommand("~/shield-venv/bin/speedtest-cli --json");
    const result = JSON.parse(output);

    return {
      downloadSpeed: +(result.download / 1e6).toFixed(2), // Mbps
      uploadSpeed: +(result.upload / 1e6).toFixed(2),     // Mbps
      ping: result.ping,
      timestamp: new Date(result.timestamp),
    };
  } catch (err) {
    console.error("❌ Speedtest error:", err.message);
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
    return { latency };
  } catch {
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
    return devices;
  } catch (err) {
    console.error("❌ Device scan error:", err.message);
    return [];
  }
}

/**
 * 🔄 Update stats and broadcast to clients
 */
async function updateLatestStats() {
  const speed = await runSpeedTest();
  const latency = await getLatency();
  latestStats = { ...speed, ping: latency.latency, timestamp: new Date() };
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

  // Send initial stats
  ws.send(JSON.stringify({ type: "initial_stats", data: latestStats }));

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
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToClients(data) {
  const msg = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ======================= PERIODIC LATENCY UPDATE =======================
setInterval(async () => {
  const latency = await getLatency();
  broadcastToClients({ type: "latency_update", data: latency });
}, 30 * 1000); // every 30 sec

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
