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

let clients = new Set();
let latestStats = {
  downloadSpeed: 0,
  uploadSpeed: 0,
  ping: 0,
  timestamp: new Date()
};

// -------------------- Utility Functions --------------------

// Run speed test
async function runSpeedTest() {
  return new Promise((resolve, reject) => {
    exec('speedtest-cli --json', (err, stdout) => {
      if (err) return reject(err);
      try {
        const result = JSON.parse(stdout);
        resolve({
          downloadSpeed: result.download / 1e6, // Mbps
          uploadSpeed: result.upload / 1e6,     // Mbps
          ping: result.ping,
          timestamp: new Date()
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Get latency
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

// Scan network devices
async function scanNetworkDevices() {
  return new Promise((resolve, reject) => {
    exec('arp -a', (err, stdout) => {
      if (err) return reject(err);
      try {
        const devices = stdout.split('\n')
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

// Update latest stats periodically
async function updateLatestStats() {
  try {
    const speed = await runSpeedTest();
    const latency = await getLatency();
    latestStats = { ...speed, ping: latency.latency, timestamp: new Date() };
  } catch (err) {
    console.error('Error updating latest stats:', err);
  }
}
setInterval(updateLatestStats, 10000); // every 10s

// -------------------- HTTP API --------------------

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Latest network stats
app.get('/latest-stats', (req, res) => res.json(latestStats));

// Scan devices manually
app.get('/scan-devices', async (req, res) => {
  try {
    const devices = await scanNetworkDevices();
    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: 'Failed to scan devices' });
  }
});

// Report suspicious device
app.post('/suspicious-device', (req, res) => {
  const { deviceInfo, threatScore } = req.body;
  if (!deviceInfo || !deviceInfo.mac) {
    return res.status(400).json({ error: 'Missing device info' });
  }
  console.log(`Suspicious: ${JSON.stringify(deviceInfo)}, Score: ${threatScore}`);

  // Broadcast to WebSocket clients
  clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'suspicious_device', deviceInfo, threatScore, timestamp: new Date() }));
    }
  });
  res.json({ success: true });
});

// -------------------- WebSocket --------------------

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected');

  // Send initial stats
  ws.send(JSON.stringify(latestStats));

  ws.on('message', async (msg) => {
    const message = msg.toString();
    if (message === 'speedtest') {
      try { ws.send(JSON.stringify(await runSpeedTest())); }
      catch (err) { ws.send(JSON.stringify({ error: 'Speedtest failed' })); }
    }
    if (message === 'scandevices') {
      try { ws.send(JSON.stringify({ type: 'device_scan', devices: await scanNetworkDevices() })); }
      catch (err) { ws.send(JSON.stringify({ error: 'Device scan failed' })); }
    }
  });

  ws.on('close', () => { clients.delete(ws); console.log('Client disconnected'); });
});

// Broadcast latency every 5s
setInterval(async () => {
  const latency = await getLatency();
  clients.forEach(c => { if (c.readyState === 1) c.send(JSON.stringify(latency)); });
}, 5000);

// -------------------- Start Server --------------------

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Raspberry Pi server running on port ${PORT}`));
