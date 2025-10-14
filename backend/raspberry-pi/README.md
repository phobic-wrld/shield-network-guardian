
# Shield Network Raspberry Pi Server

This server collects real-time network statistics and exposes them via WebSocket for the Shield Network application. Optimized for low memory usage and reliable operation on Raspberry Pi devices.

## Prerequisites

1. **Raspberry Pi** with Raspberry Pi OS (Lite recommended for lower memory usage)
2. **Node.js** (v18 or higher) or **Bun** (faster alternative)
3. **PM2** (for production process management)
4. **speedtest-cli** utility
5. **Network access** on port 3000 (configurable)

## Installation & Setup

### 1. System Preparation

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y curl git
```

### 2. Install Runtime (Choose One)

#### Option A: Node.js (Traditional)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Option B: Bun (Recommended for better performance)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 3. Install Process Manager

```bash
# Install PM2 globally
npm install -g pm2
# or with bun
bun install -g pm2
```

### 4. Install Dependencies

```bash
# With npm
npm install

# With bun (faster)
bun install
```

### 5. Install Network Tools

```bash
sudo apt-get install -y speedtest-cli
```

## Running the Server

### Development Mode

```bash
# With npm
npm run dev

# With bun
bun dev
```

### Production Mode (Recommended)

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Or direct PM2 command
pm2 start server.js --name "shield-network-pi"

# Enable startup script
pm2 startup
pm2 save
```

### Environment Configuration

Create a `.env` file for custom configuration:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Network Configuration
SCAN_INTERVAL=300000  # Device scan interval (5 minutes)
PING_INTERVAL=5000    # Latency check interval (5 seconds)

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
```

## Network & Port Configuration

### Firewall Setup
```bash
# Allow Shield Network port
sudo ufw allow 3000/tcp

# Check status
sudo ufw status
```

### Port Access
- **Default Port**: 3000
- **Protocol**: HTTP/WebSocket
- **Access**: Local network only (recommended)
- **External Access**: Configure router port forwarding if needed

### Finding Raspberry Pi IP
```bash
# Get local IP address
hostname -I | awk '{print $1}'

# Or use
ip route get 1.1.1.1 | awk '{print $7}'
```

## Usage

1. **Start the server** on your Raspberry Pi using PM2
2. **Find your Pi's IP** using `hostname -I`
3. **Connect from Shield Network app** using the IP address
4. **Monitor real-time** network statistics and device activity

## Performance Optimization

### Memory Usage Monitoring
```bash
# Check current memory usage
free -h

# Monitor server resource usage
pm2 monit

# View process memory specifically
ps aux | grep node
```

### Low Memory Optimizations
- Use **Bun** instead of Node.js (50% less memory usage)
- Run **Raspberry Pi OS Lite** (no desktop environment)
- Set **NODE_OPTIONS="--max-old-space-size=512"** for Node.js
- Enable **swap** if using < 1GB RAM

## Error Handling & Logging

### Log Management
```bash
# View PM2 logs
pm2 logs shield-network-pi

# View error logs only
pm2 logs shield-network-pi --err

# Clear logs
pm2 flush
```

### Health Monitoring
```bash
# Check server status
pm2 status

# Restart if needed
pm2 restart shield-network-pi

# Monitor in real-time
pm2 monit
```

### Troubleshooting Common Issues

1. **Speed test fails**: Ensure `speedtest-cli` is installed and working
2. **Device scan empty**: Check network permissions and ARP table
3. **High memory usage**: Consider switching to Bun runtime
4. **Connection refused**: Verify firewall settings and port availability

## API Endpoints

- `GET /health`: Health check endpoint
- `POST /suspicious-device`: Report suspicious device activity  
- `WebSocket /network-stats`: Real-time network statistics

## WebSocket Messages

### Client to Server:
- `speedtest`: Triggers network speed test
- `scandevices`: Scans for network devices

### Server to Client:
- **Latency updates**: Every 5 seconds
- **Speed test results**: On demand
- **Device scans**: Every 5 minutes
- **Suspicious device alerts**: Real-time

## Integration with Supabase (Optional)

For centralized logging and monitoring, you can stream logs to Supabase:

```javascript
// Add to server.js for cloud logging
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'your-supabase-url',
  'your-supabase-key'
);

// Log events to Supabase
async function logToSupabase(event, data) {
  await supabase.from('pi_logs').insert({
    event_type: event,
    data: data,
    timestamp: new Date().toISOString(),
    device_id: process.env.PI_DEVICE_ID
  });
}
```

## Advanced Configuration

### PM2 Ecosystem File (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'shield-network-pi',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Automatic Updates
```bash
# Create update script
#!/bin/bash
cd /path/to/shield-network-pi
git pull origin main
bun install
pm2 restart shield-network-pi
```
