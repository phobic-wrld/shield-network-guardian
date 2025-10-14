
/**
 * Device Monitor Script for Raspberry Pi
 * Monitors network for new and suspicious devices
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fetch = require('node-fetch');

// Configuration
const KNOWN_DEVICES_FILE = path.join(__dirname, 'known_devices.json');
const SERVER_URL = 'http://localhost:3000';
const SCAN_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Initialize known devices store
let knownDevices = {};
try {
  if (fs.existsSync(KNOWN_DEVICES_FILE)) {
    knownDevices = JSON.parse(fs.readFileSync(KNOWN_DEVICES_FILE, 'utf8'));
  }
} catch (error) {
  console.error('Error loading known devices:', error);
}

/**
 * Scan the network for devices using arp
 */
async function scanNetworkDevices() {
  return new Promise((resolve, reject) => {
    exec('arp -a', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing network scan: ${error}`);
        return reject(error);
      }
      
      try {
        const lines = stdout.split('\n');
        const devices = lines
          .filter(line => line.trim().length > 0)
          .map(line => {
            // Parse arp output format which varies by OS
            const ipMatch = line.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
            const macMatch = line.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
            const hostnameMatch = line.match(/\(([^)]+)\)/);
            
            return {
              ip: ipMatch ? ipMatch[0] : 'unknown',
              mac: macMatch ? macMatch[0].toLowerCase() : 'unknown',
              hostname: hostnameMatch ? hostnameMatch[1] : '',
              lastSeen: new Date().toISOString(),
              connectionTime: new Date().toISOString()
            };
          })
          .filter(device => device.ip !== 'unknown' && device.mac !== 'unknown');
        
        return resolve(devices);
      } catch (e) {
        console.error('Error parsing device scan results:', e);
        reject(e);
      }
    });
  });
}

/**
 * Get network traffic for a specific device
 */
async function getDeviceTraffic(ip) {
  // This is a simplified mock implementation
  // In a real scenario, you would use a network traffic monitoring tool
  return Math.random() * 500; // Random traffic volume in MB
}

/**
 * Calculate threat score for a device
 */
function calculateThreatScore(device) {
  let score = 0;
  
  // New unknown device
  if (!knownDevices[device.mac]) {
    score += 50;
  }
  
  // No hostname
  if (!device.hostname || device.hostname.trim() === '') {
    score += 15;
  }
  
  // High traffic (simplified)
  if (device.trafficVolume > 200) {
    score += 20;
  }
  
  return Math.min(100, score);
}

/**
 * Report suspicious device to the server
 */
async function reportSuspiciousDevice(device, threatScore) {
  try {
    const response = await fetch(`${SERVER_URL}/suspicious-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceInfo: device,
        threatScore
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    console.log(`Reported suspicious device: ${device.mac} with threat score: ${threatScore}`);
    return true;
  } catch (error) {
    console.error('Error reporting suspicious device:', error);
    return false;
  }
}

/**
 * Main monitoring function
 */
async function monitorNetwork() {
  try {
    console.log('Scanning network for devices...');
    const devices = await scanNetworkDevices();
    console.log(`Found ${devices.length} devices on the network`);
    
    for (const device of devices) {
      // Get traffic data for the device
      device.trafficVolume = await getDeviceTraffic(device.ip);
      
      // Calculate threat score
      const threatScore = calculateThreatScore(device);
      
      // If this is a new device or high threat score, report it
      if (!knownDevices[device.mac] || threatScore >= 30) {
        await reportSuspiciousDevice(device, threatScore);
      }
      
      // Update known devices
      if (!knownDevices[device.mac]) {
        knownDevices[device.mac] = {
          mac: device.mac,
          ip: device.ip,
          hostname: device.hostname,
          firstSeen: new Date().toISOString(),
        };
      }
      
      // Update last seen time
      knownDevices[device.mac].lastSeen = new Date().toISOString();
      knownDevices[device.mac].ip = device.ip; // IP might change
    }
    
    // Save updated known devices
    fs.writeFileSync(KNOWN_DEVICES_FILE, JSON.stringify(knownDevices, null, 2));
    
  } catch (error) {
    console.error('Error in network monitoring:', error);
  }
  
  // Schedule next scan
  setTimeout(monitorNetwork, SCAN_INTERVAL);
}

// Start monitoring
console.log('Starting network device monitoring...');
monitorNetwork();
