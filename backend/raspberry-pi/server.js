/**
 * 🖥️ Shield Network Guardian – Raspberry Pi Server
 * --------------------------------------------------
 * Features:
 *  ✅ Speedtest (Download, Upload, Ping)
 *  ✅ Device Scan with Hostnames
 *  ✅ Latency Monitor
 *  ✅ WebSocket Real-Time Broadcasts
 *  ✅ Device Block/Unblock + Authorization Events
 *  ✅ Scheduler + Suspicious Device Alerts
 */

import express from "express";
import http from "http";
import cors from "cors";
import { exec } from "child_process";
import { WebSocketServer } from "ws";
import deviceRoutes, { deviceEvents } from "./routes/deviceRoutes.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/network-stats" });

app.use(cors());
app.use(express.json());
app.use("/api/devices", deviceRoutes);

// ======================= GLOBAL STATE =======================

let clients = new Set();
let latestStats = {
  downloadSpeed: 0,
  uploadSpeed: 0,
  ping: 0,
  timestamp: new Date(),
};

// ======================= UTILITY FUNCTIONS =======================

/**
 * 🧰 Run a shell command and return output
 */
const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ Command failed: ${cmd}\n${stderr}`);
        return reject(err);
      }
      resolve(stdout.trim());
    });
  });

/**
 * 🌐 Run internet speed test using speedtest-cli
 */
async function runSpeedTest() {
  try {
    const output = await runCommand("speedtest-cli --json");
    const result = JSON.parse(output);
    return {
      downloadSpeed: (result.download / 1e6).toFixed(2),
      uploadSpeed: (result.upload / 1e6).toFixed(2),
      ping: result.ping,
      timestamp: new Date(),
    };
  } catch (err) {
    console.error("❌ Speedtest error:", err.message);
    return { downloadSpeed: 0, uploadSpeed: 0, ping: 0, timestamp: new Date() };
  }
}

/**
 * 🕓 Measure average network latency
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
 * 📡 Scan connected devices via ARP
 */
async function scanNetworkDevices() {
  try {
    const output = await runCommand("arp -a");
    const devices = output
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
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
      .filter((d) => d.ip !== "unknown" && d.mac !== "unknown");
    return devices;
  } catch (err) {
    console.error("❌ Device scan error:", err.message);
    return [];
  }
}

/**
 * 🚀 Update network speed & latency stats
 */
async function updateLatestStats() {
  const speed = await runSpeedTest();
  const latency = await getLatency();
  latestStats = { ...speed, ping: latency.latency, timestamp: new Date() };

  console.log(
    `✅ Updated stats → ↓ ${latestStats.downloadSpeed} Mbps | ↑ ${latestStats.uploadSpeed} Mbps | Ping ${latestStats.ping} ms`
  );

  broadcastToClients({ type: "stats_update", data: latestStats });
}

// Run initial speed test and repeat every 10 min
updateLatestStats();
setInterval(updateLatestStats, 10 * 60 * 1000);

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

app.post("/api/network/suspicious-device", (req, res) => {
  const { deviceInfo, threatScore } = req.body;
  if (!deviceInfo?.mac)
    return res.status(400).json({ error: "Missing device info" });

  console.log(`⚠️ Suspicious Device:`, deviceInfo, "| Threat Score:", threatScore);

  broadcastToClients({
    type: "suspicious_device",
    data: { deviceInfo, threatScore, timestamp: new Date() },
  });

  res.json({ success: true });
});

// ======================= WEBSOCKET HANDLER =======================

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("🔗 WebSocket client connected");

  ws.send(JSON.stringify({ type: "initial_stats", data: latestStats }));

  ws.on("message", async (msg) => {
    const message = msg.toString();

    if (message === "speedtest") {
      const result = await runSpeedTest();
      ws.send(JSON.stringify({ type: "speedtest", data: result }));
    }

    if (message === "scandevices") {
      const devices = await scanNetworkDevices();
      ws.send(JSON.stringify({ type: "device_scan", data: devices }));
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ WebSocket disconnected");
  });
});

/**
 * 📢 Broadcast data to all connected clients
 */
function broadcastToClients(data) {
  const msg = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

/**
 * 🌐 Send periodic latency updates
 */
setInterval(async () => {
  const latency = await getLatency();
  broadcastToClients({ type: "latency_update", data: latency });
}, 30 * 1000);

// ======================= DEVICE EVENT LISTENERS =======================

deviceEvents.on("newDeviceAttempt", (device) => {
  console.log(`📡 New device connection attempt: ${device.mac}`);
  broadcastToClients({ type: "new_device_attempt", data: device });
});

deviceEvents.on("deviceBlocked", (device) => {
  console.log(`🚫 Device blocked: ${device.mac}`);
  broadcastToClients({ type: "device_blocked", data: device });
});

deviceEvents.on("deviceUnblocked", (device) => {
  console.log(`✅ Device unblocked: ${device.mac}`);
  broadcastToClients({ type: "device_unblocked", data: device });
});

deviceEvents.on("authorizationResolved", (event) => {
  console.log(
    `🔐 Authorization resolved → MAC: ${event.mac}, Action: ${event.action}, TimeLimit: ${event.timeLimit || "none"}`
  );
  broadcastToClients({ type: "authorization_resolved", data: event });
});

// ======================= START SERVER =======================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Shield Network Guardian (Pi) running on port ${PORT}`);
});
