
// Threat scoring system for device detection

interface DeviceData {
  ip: string;
  mac: string;
  hostname?: string;
  lastSeen?: string;
  connectionTime?: string;
  trafficVolume?: number;
  knownDevices?: Record<string, KnownDevice>;
}

interface KnownDevice {
  name: string;
  mac: string;
  owner: string;
  isGuest: boolean;
  lastSeen: string;
}

/**
 * Calculate threat score for a device based on various factors
 * Score ranges from 0-100, where higher score means higher threat level
 */
export const calculateThreatScore = (device: DeviceData): number => {
  let score = 0;
  
  // New unknown device (not in known devices list)
  if (device.knownDevices && !Object.values(device.knownDevices).some(d => d.mac === device.mac)) {
    score += 50; // High baseline score for unknown devices
  }
  
  // Suspicious connection time (late night)
  if (device.connectionTime) {
    const hour = new Date(device.connectionTime).getHours();
    if (hour >= 0 && hour <= 5) {
      score += 10; // Late night connection
    }
  }
  
  // Suspicious traffic volume
  if (device.trafficVolume && device.trafficVolume > 1000) { // More than 1GB
    score += Math.min(20, device.trafficVolume / 100); // Up to 20 points for high traffic
  }
  
  // No hostname provided
  if (!device.hostname || device.hostname.trim() === '') {
    score += 15;
  }
  
  return Math.min(100, Math.max(0, score)); // Ensure score is between 0-100
};

/**
 * Get threat level description based on the score
 */
export const getThreatLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
};

/**
 * Generate an appropriate alert description based on device and threat level
 */
export const generateAlertDescription = (device: DeviceData, score: number): string => {
  const threatLevel = getThreatLevel(score);
  
  if (threatLevel === 'high') {
    return `Unknown device detected on your network: ${device.hostname || 'Unnamed Device'} (${device.mac})`;
  }
  
  if (threatLevel === 'medium') {
    return `Suspicious activity from device: ${device.hostname || 'Unnamed Device'} (${device.ip})`;
  }
  
  return `New device connected to your network: ${device.hostname || 'Unnamed Device'} (${device.ip})`;
};

/**
 * Check if a device should trigger an alert based on its threat score
 */
export const shouldAlertUser = (score: number): boolean => {
  return score >= 30; // Alert for medium and high threats
};
