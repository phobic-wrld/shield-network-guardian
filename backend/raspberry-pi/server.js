/**
 * 🖥️ Raspberry Pi Network Monitor Server
 * Provides: Speedtest, Device Scan, Latency Check, WebSocket Real-Time Updates
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/network-stats' });

app.use(cors());
app.use(express.json());

// ======================= GLOBAL STATE =======================

let clients = new Set();
let latestStats = {
  downloadSpeed: 0,
  uploadSpeed: 0,
  ping: 0,
  timestamp: new Date()
};

// ======================= UTILITY FUNCTIONS =======================

/**
 * Run internet speed test using speedtest-cli
 */
async function runSpeedTest() {
  return new Promise((resolve, reject) => {
    exec('speedtest-cli --json', (err, stdout) => {
      if (err) return reject(err);
      try {
        const result = JSON.parse(stdout);
        resolve({
          downloadSpeed: result.download / 1e6, // convert to Mbps
          uploadSpeed: result.upload / 1e6,
          ping: result.ping,
          timestamp: new Date()
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Get average network latency by pinging 8.8.8.8
 */
async function getLatency() {
  return new Promise((resolve) => {
    exec('ping -c 4 8.8.8.8', (err, stdout) => {
      if (err) return resolve({ latency: 100 });
      const match = stdout.match(/rtt min\/avg\/max\/mdev = \d+\.\d+\/(\d+\.\d+)/);
      const latency = match ? parseFloat(match[1]) : 100;
      resolve({ latency });
    });
  });
}

/**
 * Scan local network devices using ARP
 */
async function scanNetworkDevices() {
  return new Promise((resolve, reject) => {
    exec('arp -a', (err, stdout) => {
      if (err) return reject(err);
      try {
        const devices = stdout
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const ip = line.match(/\b\d{1,3}(\.\d{1,3}){3}\b/);
            const mac = line.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
            const hostname = line.match(/\(([^)]+)\)/);
            return {
              ip: ip ? ip[0] : 'unknown',
              mac: mac ? mac[0] : 'unknown',
              hostname: hostname ? hostname[1] : '',
              lastSeen: new Date()
            };
          })
          .filter(d => d.ip !== 'unknown' && d.mac !== 'unknown');

        resolve(devices);
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Update network stats periodically
 */
async function updateLatestStats() {
  try {
    const speed = await runSpeedTest();
    const latency = await getLatency();
    latestStats = {
      ...speed,
      ping: latency.latency,
      timestamp: new Date()
    };
    console.log(`✅ Stats updated: ${latestStats.downloadSpeed.toFixed(2)} Mbps down`);
  } catch (err) {
    console.error('❌ Error updating latest stats:', err);
  }
}

setInterval(updateLatestStats, 10000); // every 10 seconds

// ======================= HTTP API ROUTES =======================

app.get('/health', (req, res) => res.send('OK'));

app.get('/api/network/stats', (req, res) => {
  res.json(latestStats);
});

app.get('/api/network/speedtest', async (req, res) => {
  try {
    const result = await runSpeedTest();
    latestStats = { ...latestStats, ...result };
    res.json(result);
  } catch (err) {
    console.error('❌ Speedtest failed:', err);
    res.status(500).json({ error: 'Speedtest failed' });
  }
});

app.get('/api/network/scan', async (req, res) => {
  try {
    const devices = await scanNetworkDevices();
    res.json({ devices });
  } catch (err) {
    console.error('❌ Device scan failed:', err);
    res.status(500).json({ error: 'Failed to scan devices' });
  }
});

app.post('/api/network/suspicious-device', (req, res) => {
  const { deviceInfo, threatScore } = req.body;
  if (!deviceInfo || !deviceInfo.mac) {
    return res.status(400).json({ error: 'Missing device info' });
  }

  console.log(`⚠️ Suspicious Device Detected:`, deviceInfo, 'Threat Score:', threatScore);

  // Broadcast to all WebSocket clients
  broadcastToClients({
    type: 'suspicious_device',
    deviceInfo,
    threatScore,
    timestamp: new Date()
  });

  res.json({ success: true });
});

// ======================= WEBSOCKET SERVER =======================

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🔗 WebSocket client connected');

  // Send initial stats
  ws.send(JSON.stringify({ type: 'initial_stats', data: latestStats }));

  ws.on('message', async (msg) => {
    const message = msg.toString();

    if (message === 'speedtest') {
      try {
        const result = await runSpeedTest();
        ws.send(JSON.stringify({ type: 'speedtest', data: result }));
      } catch {
        ws.send(JSON.stringify({ type: 'error', error: 'Speedtest failed' }));
      }
    }

    if (message === 'scandevices') {
      try {
        const devices = await scanNetworkDevices();
        ws.send(JSON.stringify({ type: 'device_scan', devices }));
      } catch {
        ws.send(JSON.stringify({ type: 'error', error: 'Device scan failed' }));
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('❌ WebSocket client disconnected');
  });
});

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToClients(data) {
  const msg = JSON.stringify(data);
  clients.forEach((c) => {
    if (c.readyState === 1) c.send(msg);
  });
}

// Broadcast latency to clients every 5 seconds
setInterval(async () => {
  const latency = await getLatency();
  broadcastToClients({ type: 'latency', data: latency });
}, 5000);

// ======================= START SERVER =======================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Raspberry Pi server running on port ${PORT}`);
});
