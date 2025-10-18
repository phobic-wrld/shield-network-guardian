import { useState, useEffect, useRef } from "react";
import { DeviceManagement } from "./DeviceManagement";
import { NewDeviceAlert } from "./NewDeviceAlert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Device {
  mac: string;
  ip: string;
  name: string;
  vendor: string;
  type?: string;
  status: "online" | "offline" | "unknown";
  blocked?: boolean;
  lastSeen: string;
}

const API_BASE = import.meta.env.VITE_API_URL + "/api/devices";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://192.168.100.10:3000/network-stats";

/** Fetch devices from backend */
const fetchDevices = async (): Promise<Device[]> => {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch devices");
  const data: Device[] = await res.json();

  return data.map(d => ({
    mac: d.mac || "",
    ip: d.ip || "unknown",
    name: d.name || d.mac || "Unknown Device",
    vendor: d.vendor || "Unknown",
    type: d.type || "Other",
    status: d.status || "unknown",
    blocked: d.blocked || false,
    lastSeen: d.lastSeen || new Date().toISOString(),
  }));
};

/** API Calls */
const blockDevice = async (mac: string) => {
  const res = await fetch(`${API_BASE}/block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mac }),
  });
  if (!res.ok) throw new Error("Failed to block device");
  return res.json();
};

const unblockDevice = async (mac: string) => {
  const res = await fetch(`${API_BASE}/unblock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mac }),
  });
  if (!res.ok) throw new Error("Failed to unblock device");
  return res.json();
};

export const ConnectedDeviceList = () => {
  const [alertDevice, setAlertDevice] = useState<Device | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [knownMACs, setKnownMACs] = useState<Set<string>>(new Set());
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, isError } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 15000,
  });

  /** Mutations */
  const blockMutation = useMutation({
    mutationFn: (mac: string) => blockDevice(mac),
    onSuccess: (_, mac) => {
      toast({ title: "🚫 Device Blocked", description: `MAC: ${mac}` });
      queryClient.invalidateQueries(["devices"]);
    },
    onError: () =>
      toast({ title: "❌ Error", description: "Failed to block device" }),
  });

  const unblockMutation = useMutation({
    mutationFn: (mac: string) => unblockDevice(mac),
    onSuccess: (_, mac) => {
      toast({ title: "✅ Device Unblocked", description: `MAC: ${mac}` });
      queryClient.invalidateQueries(["devices"]);
    },
    onError: () =>
      toast({ title: "❌ Error", description: "Failed to unblock device" }),
  });

  /** Detect new devices */
  useEffect(() => {
    if (!devices.length) return;

    const currentMACs = new Set(devices.map(d => d.mac.toLowerCase()).filter(Boolean));
    const newDevices = devices.filter(d => !knownMACs.has(d.mac.toLowerCase()));

    if (newDevices.length > 0) {
      newDevices.forEach(d => {
        toast({
          title: "📡 New Device Detected",
          description: `${d.name || d.mac} joined the network`,
          duration: 8000,
        });
      });

      if (!alertDevice && newDevices[0]) {
        setAlertDevice(newDevices[0]);
        setShowAlert(true);
      }
    }

    setKnownMACs(currentMACs);
  }, [devices]);

  /** WebSocket listener */
  useEffect(() => {
    socketRef.current = new WebSocket(WS_URL);

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socketRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "device_blocked":
            toast({ title: "🚫 Device Blocked", description: msg.data.mac });
            queryClient.invalidateQueries(["devices"]);
            break;

          case "device_unblocked":
            toast({ title: "✅ Device Unblocked", description: msg.data.mac });
            queryClient.invalidateQueries(["devices"]);
            break;

          case "new_device_attempt":
            toast({
              title: "⚠️ New Device Attempting Connection",
              description: `${msg.data.mac} @ ${msg.data.ip}`,
              duration: 10000,
            });
            setAlertDevice({
              mac: msg.data.mac,
              ip: msg.data.ip,
              name: msg.data.name || "Unknown",
              vendor: "Unknown",
              status: "unknown",
              lastSeen: new Date().toISOString(),
            });
            setShowAlert(true);
            break;

          case "device_scan":
            queryClient.invalidateQueries(["devices"]);
            break;
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socketRef.current.onclose = () => {
      console.log("⚠️ WebSocket disconnected — reconnecting...");
      setTimeout(() => {
        socketRef.current = new WebSocket(WS_URL);
      }, 5000);
    };

    return () => {
      socketRef.current?.close();
    };
  }, [queryClient, toast]);

  if (isLoading) return <p>Loading devices...</p>;
  if (isError) return <p>Error loading devices.</p>;

  return (
    <>
      <DeviceManagement
        devices={devices}
        isLoading={isLoading}
        onBlock={(mac) => mac && blockMutation.mutate(mac)}
        onUnblock={(mac) => mac && unblockMutation.mutate(mac)}
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
