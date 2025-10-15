// ==================== Imports ====================
import axios from "axios";

// ==================== Interfaces ====================
export interface Device {
  _id?: string;
  name: string;
  type: "laptop" | "smartphone" | "tv" | "other";
  ip: string;
  mac: string;
  status: "online" | "offline";
  lastSeen: string;
  bandwidth: number;
  owner?: string;
  isGuest?: boolean;
}

export interface NetworkStats {
  _id?: string;
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  stability: number;
  devices: number;
  activeOptimizations: number;
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
export const fetchDevices = async (): Promise<Device[]> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/devices`);
    return data;
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

// ==================== Network ====================
export const fetchNetworkStats = async (limit = 10): Promise<NetworkStats[]> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/network/stats`, {
      params: { limit },
    });
    return data;
  } catch (error) {
    handleError(error, "Error fetching network stats");
  }
};

export const scanNetwork = async () => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/network/scan`);
    return data;
  } catch (error) {
    handleError(error, "Error scanning network");
  }
};

// ✅ Run Speed Test (calls backend /api/network/speedtest)
export const runSpeedTestAPI = async (): Promise<SpeedTestResult> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/network/speedtest`);

    // ✅ Calculate connection strength based on thresholds
    let strength = "Poor";
    if (data.downloadSpeed >= 20 && data.uploadSpeed >= 10 && data.ping <= 30) {
      strength = "Excellent";
    } else if (data.downloadSpeed >= 10 && data.uploadSpeed >= 5 && data.ping <= 70) {
      strength = "Good";
    } else if (data.downloadSpeed >= 3 && data.uploadSpeed >= 2 && data.ping <= 120) {
      strength = "Fair";
    }

    return {
      download: data.downloadSpeed,
      upload: data.uploadSpeed,
      ping: data.ping,
      connectionStrength: strength,
    };
  } catch (error) {
    handleError(error, "Error running speed test");
  }
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
