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

const API_BASE = import.meta.env.VITE_API_URL || "http://192.168.100.11:3000/api/devices";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://192.168.100.11:3000/network-stats";

// ---------------------- API FUNCTIONS ----------------------
const api = {
  fetchDevices: async (): Promise<Device[]> => {
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
  },
  block: (mac: string) =>
    fetch(`${API_BASE}/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac }),
    }).then(res => res.json()),
  unblock: (mac: string) =>
    fetch(`${API_BASE}/unblock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac }),
    }).then(res => res.json()),
  authorize: (mac: string) =>
    fetch(`${API_BASE}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac, action: "approve" }),
    }).then(res => res.json()),
  deny: (mac: string) =>
    fetch(`${API_BASE}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac, action: "block" }),
    }).then(res => res.json()),
};

// ---------------------- React Component ----------------------
export const ConnectedDeviceList = () => {
  const [alertDevice, setAlertDevice] = useState<Device | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [knownMACs, setKnownMACs] = useState<Set<string>>(new Set());
  const socketRef = useRef<WebSocket | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // React Query: Fetch all devices
  const { data: devices = [], isLoading, isError } = useQuery({
    queryKey: ["devices"],
    queryFn: api.fetchDevices,
    refetchInterval: 15000, // refresh every 15 seconds
  });

  // ---------------------- Mutations ----------------------
  const createMutation = (fn: (mac: string) => Promise<any>, successTitle: string) =>
    useMutation(fn, {
      onSuccess: (_, mac) => {
        toast({ title: successTitle, description: `MAC: ${mac}` });
        queryClient.invalidateQueries(["devices"]);
      },
      onError: () => toast({ title: "❌ Error", description: "Operation failed" }),
    });

  const blockMutation = createMutation(api.block, "🚫 Device Blocked");
  const unblockMutation = createMutation(api.unblock, "✅ Device Unblocked");
  const approveMutation = createMutation(api.authorize, "🟢 Device Approved");
  const denyMutation = createMutation(api.deny, "🚫 Device Denied");

  // ---------------------- Detect New Devices ----------------------
  useEffect(() => {
    if (!devices.length) return;

    const currentMACs = new Set(devices.map(d => d.mac.toLowerCase()));
    const newDevices = devices.filter(d => !knownMACs.has(d.mac.toLowerCase()));

    if (newDevices.length > 0) {
      newDevices.forEach(d =>
        toast({
          title: "📡 New Device Detected",
          description: `${d.name || d.mac} joined the network`,
          duration: 7000,
        })
      );

      if (!alertDevice && newDevices[0]) {
        setAlertDevice(newDevices[0]);
        setShowAlert(true);
      }
    }

    setKnownMACs(currentMACs);
  }, [devices]);

  // ---------------------- WebSocket Real-Time Updates ----------------------
  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => console.log("✅ WebSocket connected");
      socket.onclose = () => setTimeout(connectWebSocket, 5000);

      socket.onmessage = event => {
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
          console.error("❌ WebSocket parse error:", err);
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
        onBlock={mac => mac && blockMutation.mutate(mac)}
        onUnblock={mac => mac && unblockMutation.mutate(mac)}
      />

      {alertDevice && (
        <NewDeviceAlert
          device={alertDevice}
          open={showAlert}
          onOpenChange={setShowAlert}
          onApprove={mac => {
            approveMutation.mutate(mac);
            setShowAlert(false);
          }}
          onDeny={mac => {
            denyMutation.mutate(mac);
            setShowAlert(false);
          }}
        />
      )}
    </>
  );
};
