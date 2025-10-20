// src/components/ConnectedDeviceList.tsx
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

const API_BASE =
  import.meta.env.VITE_API_URL || "http://192.168.4.1:3000/api/devices";
const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://192.168.4.1:3000/network-stats";

/** 📡 Fetch connected devices */
const fetchDevices = async (): Promise<Device[]> => {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch devices");

  const data: Device[] = await res.json();
  return data.map((d) => ({
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

/** 🧱 API calls */
const api = {
  block: async (mac: string) => {
    const res = await fetch(`${API_BASE}/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac }),
    });
    if (!res.ok) throw new Error("Failed to block device");
    return res.json();
  },

  unblock: async (mac: string) => {
    const res = await fetch(`${API_BASE}/unblock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac }),
    });
    if (!res.ok) throw new Error("Failed to unblock device");
    return res.json();
  },

  authorize: async (mac: string) => {
    const res = await fetch(`${API_BASE}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac, action: "approve" }),
    });
    if (!res.ok) throw new Error("Failed to approve device");
    return res.json();
  },

  deny: async (mac: string) => {
    const res = await fetch(`${API_BASE}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac, action: "block" }),
    });
    if (!res.ok) throw new Error("Failed to deny device");
    return res.json();
  },
};

export const ConnectedDeviceList = () => {
  const [alertDevice, setAlertDevice] = useState<Device | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [knownMACs, setKnownMACs] = useState<Set<string>>(new Set());
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /** 🧠 Query for all devices */
  const {
    data: devices = [],
    isLoading,
    isError,
  } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 15000,
  });

  /** 🚫 Block + ✅ Unblock + 🔓 Approve + ❌ Deny Mutations */
  const blockMutation = useMutation({
    mutationFn: api.block,
    onSuccess: (_, mac) => {
      toast({ title: "🚫 Device Blocked", description: `MAC: ${mac}` });
      queryClient.invalidateQueries(["devices"]);
    },
    onError: () =>
      toast({ title: "❌ Error", description: "Failed to block device" }),
  });

  const unblockMutation = useMutation({
    mutationFn: api.unblock,
    onSuccess: (_, mac) => {
      toast({ title: "✅ Device Unblocked", description: `MAC: ${mac}` });
      queryClient.invalidateQueries(["devices"]);
    },
    onError: () =>
      toast({ title: "❌ Error", description: "Failed to unblock device" }),
  });

  const approveMutation = useMutation({
    mutationFn: api.authorize,
    onSuccess: (_, mac) => {
      toast({ title: "🟢 Device Approved", description: `MAC: ${mac}` });
      queryClient.invalidateQueries(["devices"]);
    },
    onError: () =>
      toast({ title: "❌ Error", description: "Failed to approve device" }),
  });

  const denyMutation = useMutation({
    mutationFn: api.deny,
    onSuccess: (_, mac) => {
      toast({ title: "🚫 Device Denied", description: `MAC: ${mac}` });
      queryClient.invalidateQueries(["devices"]);
    },
    onError: () =>
      toast({ title: "❌ Error", description: "Failed to deny device" }),
  });

  /** 🧭 Detect new devices between scans */
  useEffect(() => {
    if (!devices.length) return;

    const currentMACs = new Set(
      devices.map((d) => d.mac.toLowerCase()).filter(Boolean)
    );
    const newDevices = devices.filter(
      (d) => !knownMACs.has(d.mac.toLowerCase())
    );

    if (newDevices.length > 0) {
      newDevices.forEach((d) => {
        toast({
          title: "📡 New Device Detected",
          description: `${d.name || d.mac} joined the network`,
          duration: 7000,
        });
      });

      if (!alertDevice && newDevices[0]) {
        setAlertDevice(newDevices[0]);
        setShowAlert(true);
      }
    }

    setKnownMACs(currentMACs);
  }, [devices]);

  /** 🌐 WebSocket Listener for Realtime Events */
  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => console.log("✅ WebSocket connected");
      socket.onclose = () => {
        console.warn("⚠️ WebSocket disconnected — retrying in 5s...");
        setTimeout(connectWebSocket, 5000);
      };

      socket.onmessage = (event) => {
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
                title: "⚠️ New Device Requesting Access",
                description: `${msg.data.mac} (${msg.data.ip})`,
                duration: 10000,
              });
              setAlertDevice({
                mac: msg.data.mac,
                ip: msg.data.ip,
                name: msg.data.name || "Unknown Device",
                vendor: msg.data.vendor || "Unknown",
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
    };

    connectWebSocket();
    return () => socketRef.current?.close();
  }, [queryClient, toast]);

  if (isLoading) return <p>🔄 Loading connected devices...</p>;
  if (isError) return <p>❌ Failed to load device list. Check backend.</p>;

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
          onApprove={(mac) => {
            approveMutation.mutate(mac);
            setShowAlert(false);
          }}
          onDeny={(mac) => {
            denyMutation.mutate(mac);
            setShowAlert(false);
          }}
        />
      )}
    </>
  );
};
