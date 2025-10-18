import { useState, useEffect } from "react";
import { DeviceManagement } from "./DeviceManagement";
import { NewDeviceAlert } from "./NewDeviceAlert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Device {
  mac: string; // keep as string
  ip: string;
  name: string;
  vendor: string;
  type?: string;
  status: "online" | "offline" | "unknown";
  blocked?: boolean;
  lastSeen: string;
}

const API_BASE = import.meta.env.VITE_API_URL + "/api/devices";

const fetchDevices = async (): Promise<Device[]> => {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch devices");
  const data: Device[] = await res.json();

  return data.map(d => ({
    mac: d.mac || "", // keep as string
    ip: d.ip || "unknown",
    name: d.name || d.mac || "Unknown Device",
    vendor: d.vendor || "Unknown",
    type: d.type || "Other",
    status: d.status || "unknown",
    blocked: d.blocked || false,
    lastSeen: d.lastSeen || new Date().toISOString(),
  }));
};

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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, isError } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 10000,
  });

  const blockMutation = useMutation({
    mutationFn: (mac: string) => blockDevice(mac),
    onSuccess: (_, mac) => {
      toast({ title: "Device Blocked", description: `MAC: ${mac}` });
      queryClient.invalidateQueries(["devices"]);
    },
    onError: () => toast({ title: "Error", description: "Failed to block device" }),
  });

  const unblockMutation = useMutation({
    mutationFn: (mac: string) => unblockDevice(mac),
    onSuccess: (_, mac) => {
      toast({ title: "Device Unblocked", description: `MAC: ${mac}` });
      queryClient.invalidateQueries(["devices"]);
    },
    onError: () => toast({ title: "Error", description: "Failed to unblock device" }),
  });

  useEffect(() => {
    if (!devices.length) return;

    const currentMACs = new Set(
      devices.map(d => d.mac.toLowerCase()).filter(mac => !!mac)
    );

    const newDevices = devices.filter(
      d => d.mac && !knownMACs.has(d.mac.toLowerCase())
    );

    if (newDevices.length > 0) {
      newDevices.forEach(d =>
        toast({
          title: "New Device Detected",
          description: `${d.name || d.mac || "Unknown Device"} joined the network`,
          duration: 8000,
        })
      );

      if (!alertDevice && newDevices[0]) {
        setAlertDevice(newDevices[0]);
        setShowAlert(true);
      }
    }

    setKnownMACs(currentMACs);
  }, [devices, knownMACs, toast, alertDevice]);

  if (isLoading) return <p>Loading devices...</p>;
  if (isError) return <p>Error loading devices.</p>;

  return (
    <>
      <DeviceManagement
        devices={devices}
        isLoading={isLoading}
        onBlock={(mac) => mac ? blockMutation.mutate(mac) : undefined}
        onUnblock={(mac) => mac ? unblockMutation.mutate(mac) : undefined}
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
