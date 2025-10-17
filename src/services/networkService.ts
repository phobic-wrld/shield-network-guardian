// ==================== Imports ====================
import axios from "axios";

// ==================== Interfaces ====================
export interface Device {
  _id?: string;
  name: string;
  vendor?: string;
  type?: "laptop" | "smartphone" | "tv" | "other";
  ip: string;
  mac: string;
  status: "online" | "offline";
  lastSeen: string;
  bandwidth?: number;
  owner?: string;
  isGuest?: boolean;
}

export interface NetworkStats {
  _id?: string;
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  stability?: number;
  devices?: number;
  activeOptimizations?: number;
  timestamp: string;
}

export interface SpeedTestResult {
  download: number;
  upload: number;
  ping: number;
  connectionStrength: string;
}

export interface SecurityEvent {
  _id?: string;
  deviceId: string | null;
  eventType: "new_device" | "suspicious_activity" | "network_change" | "other";
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: string;
  resolved: boolean;
}

// ==================== Config ====================
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handleError = (error: any, message: string) => {
  const backendMessage = error.response?.data?.message || error.message;
  console.error(`❌ ${message}:`, backendMessage);
  throw new Error(`${message}: ${backendMessage}`);
};

// ==================== Devices ====================

// 🖥️ Fetch all connected devices (with name/vendor support)
export const fetchDevices = async (): Promise<Device[]> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/devices`);
    // map lastSeen and normalize fields
    return data.map((device: any) => ({
      ...device,
      lastSeen: device.lastSeen || new Date().toISOString(),
      vendor: device.vendor || "Unknown",
      name: device.name || "Unknown Device",
    }));
  } catch (error) {
    handleError(error, "Error fetching devices");
  }
};

export const addDevice = async (device: Omit<Device, "_id">) => {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/devices`, device);
    return data;
  } catch (error) {
    handleError(error, "Error adding device");
  }
};

export const updateDevice = async (id: string, updates: Partial<Device>) => {
  try {
    const { data } = await axios.put(`${API_BASE_URL}/devices/${id}`, updates);
    return data;
  } catch (error) {
    handleError(error, "Error updating device");
  }
};

export const removeDevice = async (id: string) => {
  try {
    await axios.delete(`${API_BASE_URL}/devices/${id}`);
    return true;
  } catch (error) {
    handleError(error, "Error removing device");
  }
};

// 🚫 Block a device from the network (forces re-auth)
export const blockDevice = async (mac: string) => {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/devices/block`, { mac });
    return data;
  } catch (error) {
    handleError(error, "Error blocking device");
  }
};

// ==================== Network ====================
export const fetchNetworkStats = async (): Promise<NetworkStats> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/network/speedtest`);
    return data;
  } catch (error) {
    handleError(error, "Error fetching network stats");
  }
};

export const runSpeedTestAPI = async (): Promise<SpeedTestResult> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/network/speedtest`);

    return {
      download: data.downloadSpeed,
      upload: data.uploadSpeed,
      ping: data.ping,
      connectionStrength: calculateConnectionStrength(
        data.downloadSpeed,
        data.uploadSpeed,
        data.ping
      ),
    };
  } catch (error) {
    handleError(error, "Error running speed test");
  }
};

// ✅ Dynamic connection strength calculation
export const calculateConnectionStrength = (
  download: number,
  upload: number,
  ping: number
): string => {
  if (download >= 20 && upload >= 10 && ping <= 30) return "Excellent";
  if (download >= 10 && upload >= 5 && ping <= 70) return "Good";
  if (download >= 3 && upload >= 2 && ping <= 120) return "Fair";
  return "Poor";
};

// ==================== Security ====================
export const fetchSecurityEvents = async (
  resolved = false,
  limit = 10
): Promise<SecurityEvent[]> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/security/events`, {
      params: { resolved, limit },
    });
    return data;
  } catch (error) {
    handleError(error, "Error fetching security events");
  }
};

export const addSecurityEvent = async (event: Omit<SecurityEvent, "_id">) => {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/security/events`, event);
    return data;
  } catch (error) {
    handleError(error, "Error adding security event");
  }
};

export const resolveSecurityEvent = async (id: string) => {
  try {
    const { data } = await axios.put(
      `${API_BASE_URL}/security/events/${id}/resolve`
    );
    return data;
  } catch (error) {
    handleError(error, "Error resolving security event");
  }
};
