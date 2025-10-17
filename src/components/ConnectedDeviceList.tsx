import { useState, useEffect } from "react";
import { DeviceManagement } from "@/components/DeviceManagement";
import { NewDeviceAlert } from "@/components/NewDeviceAlert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ----- Device interface -----
export interface Device {
  ip: string;
  mac: string;
  name: string;
  vendor?: string;
  status: "online" | "offline" | "unknown";
  lastSeen: string;
}

// ✅ Raspberry Pi backend base URL
const API_BASE = "http://192.168.100.10:3000/api/devices";

/**
 * 📡 Fetch connected devices from backend
 */
const fetchDevices = async (): Promise<Device[]> => {
  const response = await fetch(API_BASE, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) throw new Error("Failed to fetch devices");

  const data = await response.json();

  // ✅ Handle both array and object responses
  const devices = Array.isArray(data.devices) ? data.devices : data;

  return devices.map((d: any) => ({
    ip: d.ip,
    mac: d.mac,
    name: d.name || "Unknown Device",
    vendor: d.vendor || "Unknown",
    status: d.status || "unknown",
    lastSeen: d.lastSeen || new Date().toISOString(),
  }));
};

/**
 * 🚫 Block device by MAC
 */
const blockDevice = async (mac: string) => {
  const response = await fetch(`${API_BASE}/block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mac }),
  });

  if (!response.ok) throw new Error("Failed to block device");
  return response.json();
};

/**
 * ✅ Unblock device by MAC
 */
const unblockDevice = async (mac: string) => {
  const response = await fetch(`${API_BASE}/unblock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mac }),
  });

  if (!response.ok) throw new Error("Failed to unblock device");
  return response.json();
};

export const ConnectedDeviceList = () => {
  const [alertDevice, setAlertDevice] = useState<Device | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [knownMACs, setKnownMACs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 📡 Fetch devices using React Query
  const {
    data: devices = [],
    isLoading,
    isError,
  } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 15000, // refresh every 15 seconds
    staleTime: 5000,
  });

  // 🚫 Block Mutation
  const blockMutation = useMutation({
    mutationFn: blockDevice,
    onSuccess: (_, mac) => {
      toast({
        title: "🚫 Device Blocked",
        description: `MAC: ${mac}`,
      });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: () =>
      toast({
        title: "❌ Failed to block device",
        description: "Try again later.",
        variant: "destructive",
      }),
  });

  // ✅ Unblock Mutation
  const unblockMutation = useMutation({
    mutationFn: unblockDevice,
    onSuccess: (_, mac) => {
      toast({
        title: "✅ Device Unblocked",
        description: `MAC: ${mac}`,
      });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: () =>
      toast({
        title: "❌ Failed to unblock device",
        description: "Try again later.",
        variant: "destructive",
      }),
  });

  // 🛰️ Detect new devices joining the network
  useEffect(() => {
    if (!devices.length) return;

    const currentMACs = new Set(devices.map((d) => d.mac.toLowerCase()));
    const newDevices = devices.filter((d) => !knownMACs.has(d.mac.toLowerCase()));

    if (newDevices.length > 0) {
      newDevices.forEach((device) => {
        toast({
          title: "📡 New Device Detected",
          description: `${device.name || device.mac} joined the network.`,
          duration: 8000,
        });
      });

      // Show alert popup for the first new device
      if (!alertDevice && newDevices[0]) {
        setAlertDevice(newDevices[0]);
        setShowAlert(true);
      }
    }

    setKnownMACs(currentMACs);
  }, [devices]);

  // 🧭 Loading or error states
  if (isLoading) return <p className="text-gray-500 p-4">Loading devices...</p>;
  if (isError)
    return (
      <p className="text-red-500 p-4">
        Failed to load device data. Check your Raspberry Pi or API connection.
      </p>
    );

  return (
    <>
      <DeviceManagement
        devices={devices}
        isLoading={isLoading}
        onBlock={(mac) => blockMutation.mutate(mac)}
        onUnblock={(mac) => unblockMutation.mutate(mac)}
      />

      {alertDevice && (
        <NewDeviceAlert
          device={alertDevice}
          open={showAlert}
          onOpenChange={setShowAlert}
        />
      )}
    </>
  );
};
