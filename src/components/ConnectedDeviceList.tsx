import { useState, useEffect } from "react";
import { DeviceManagement } from "@/components/DeviceManagement";
import { NewDeviceAlert } from "@/components/NewDeviceAlert";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// ----- Device interface -----
export interface Device {
  id: string;
  name: string;
  type: string;
  ip: string;
  mac: string;
  status: "online" | "offline" | "unknown";
  connected: string;
  download: number;
  upload: number;
  priority?: string;
}

// Backend endpoint
const API_URL = import.meta.env.VITE_API_URL + "/api/devices";
 // replace with production URL

// Fetch devices from backend
const fetchDevices = async (): Promise<Device[]> => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`, // if using JWT
    },
  });

  if (!response.ok) throw new Error("Failed to fetch devices");
  return response.json();
};

export const ConnectedDeviceList = () => {
  const [alertDevice, setAlertDevice] = useState<Device | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [knownMACs, setKnownMACs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch devices using React Query
  const { data: devices = [], isLoading, refetch } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 10000, // auto-refresh every 10s
  });

  // Detect new devices
  useEffect(() => {
    if (!devices.length) return;

    const currentMACs = new Set(devices.map(d => d.mac.toLowerCase()));

    const newDevices = devices.filter(d => !knownMACs.has(d.mac.toLowerCase()));

    if (newDevices.length > 0) {
      newDevices.forEach(device => {
        toast({
          title: "New Device Detected",
          description: `Unknown device: ${device.name || device.mac}`,
          duration: 10000,
        });

        if (!alertDevice) {
          setAlertDevice({ ...device });
          setShowAlert(true);
        }
      });
    }

    setKnownMACs(currentMACs);
  }, [devices, knownMACs, toast, alertDevice]);

  return (
    <>
      <DeviceManagement devices={devices} isLoading={isLoading} />
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
