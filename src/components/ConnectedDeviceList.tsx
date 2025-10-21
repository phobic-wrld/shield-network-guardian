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
  pending?: boolean;
}

const HOTSPOT_IP = "192.168.4.1";
const API_BASE = `http://${HOTSPOT_IP}:3000/api/devices`;
const WS_URL = `ws://${HOTSPOT_IP}:3000/network-stats`;

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
      pending: false,
    }));
  },
  block: (mac: string) =>
    fetch(`${API_BASE}/block`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mac }) }).then(res => res.json()),
  unblock: (mac: string) =>
    fetch(`${API_BASE}/unblock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mac }) }).then(res => res.json()),
  authorize: (mac: string, timeLimit?: number) =>
    fetch(`${API_BASE}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mac, action: "approve", timeLimit }) }).then(res => res.json()),
  deny: (mac: string) =>
    fetch(`${API_BASE}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mac, action: "block" }) }).then(res => res.json()),
  getPendingRequests: () => fetch(`${API_BASE}/pending/requests`).then(res => res.json()),
};

export const ConnectedDeviceList = () => {
  const [alertDevice, setAlertDevice] = useState<Device | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [knownMACs, setKnownMACs] = useState<Set<string>>(new Set());
  const [pendingRequests, setPendingRequests] = useState<Device[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, isError } = useQuery({
    queryKey: ["devices"],
    queryFn: api.fetchDevices,
    refetchInterval: 15000,
  });

  const blockMutation = useMutation({
    mutationFn: (mac: string) => api.block(mac),
    onSuccess: (_, mac) => {
      toast({ title: "🚫 Device Blocked", description: `MAC: ${mac}` });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: () => toast({ title: "❌ Error", description: "Failed to block device" }),
  });

  const unblockMutation = useMutation({
    mutationFn: (mac: string) => api.unblock(mac),
    onSuccess: (_, mac) => {
      toast({ title: "✅ Device Unblocked", description: `MAC: ${mac}` });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: () => toast({ title: "❌ Error", description: "Failed to unblock device" }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ mac, timeLimit }: { mac: string; timeLimit?: number }) => api.authorize(mac, timeLimit),
    onSuccess: (_, { mac }) => {
      toast({ title: "🟢 Device Approved", description: `MAC: ${mac}` });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setKnownMACs(prev => new Set(prev).add(mac.toLowerCase())); // add to known devices
    },
    onError: () => toast({ title: "❌ Error", description: "Failed to approve device" }),
  });

  const denyMutation = useMutation({
    mutationFn: (mac: string) => api.deny(mac),
    onSuccess: (_, mac) => {
      toast({ title: "🚫 Device Denied", description: `MAC: ${mac}` });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setKnownMACs(prev => {
        const copy = new Set(prev);
        copy.delete(mac.toLowerCase());
        return copy;
      });
    },
    onError: () => toast({ title: "❌ Error", description: "Failed to deny device" }),
  });

  // ---------------------- Detect new devices ----------------------
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

  // ---------------------- Fetch pending requests ----------------------
  useEffect(() => {
    const fetchPending = async () => {
      const pending = await api.getPendingRequests();
      setPendingRequests(pending);
    };
    fetchPending();
  }, [devices]);

  // ---------------------- WebSocket real-time updates ----------------------
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
              queryClient.invalidateQueries({ queryKey: ["devices"] });
              setKnownMACs(prev => {
                const copy = new Set(prev);
                copy.delete(msg.data.mac.toLowerCase());
                return copy;
              });
              break;

            case "device_unblocked":
              toast({ title: "✅ Device Unblocked", description: msg.data.mac });
              queryClient.invalidateQueries({ queryKey: ["devices"] });
              setKnownMACs(prev => new Set(prev).add(msg.data.mac.toLowerCase()));
              break;

            case "new_device_attempt":
              // Only show popup if device is not known
              if (!knownMACs.has(msg.data.mac.toLowerCase())) {
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
              }
              break;

            case "device_scan":
              queryClient.invalidateQueries({ queryKey: ["devices"] });
              break;
          }
        } catch (err) {
          console.error("❌ WebSocket parse error:", err);
        }
      };
    };

    connectWebSocket();
    return () => socketRef.current?.close();
  }, [queryClient, toast, knownMACs]);

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
          onApprove={(mac) => {
            approveMutation.mutate({ mac });
            setShowAlert(false);
          }}
          onDeny={(mac) => {
            denyMutation.mutate(mac);
            setShowAlert(false);
          }}
          onGuest={(mac) => {
            const guestTime = 30;
            approveMutation.mutate({ mac, timeLimit: guestTime });
            setShowAlert(false);
          }}
        />
      )}
    </>
  );
};
