import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Tablet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Device {
  id: string;
  mac: string;
  ip: string;
  hostname?: string;
}

export const NewDeviceAlert = () => {
  const [device, setDevice] = useState<Device | null>(null);
  const [open, setOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [owner, setOwner] = useState("Me");
  const [isGuest, setIsGuest] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Use your backend environment variables
  const API_BASE = import.meta.env.VITE_API_URL; // e.g. http://192.168.100.108:3000
  const WS_ALERTS_URL = import.meta.env.VITE_ALERTS_WS_URL; // e.g. ws://192.168.100.108:3000/alerts

  // ✅ Mutation for saving device info
  const saveDevice = useMutation({
    mutationFn: (data: {
      id: string;
      name: string;
      owner: string;
      isGuest: boolean;
    }) => axios.put(`${API_BASE}/devices/${data.id}`, data).then((res) => res.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["securityEvents"] });
      toast({
        title: "Device Saved",
        description: "The new device has been added to your network list.",
      });
      setOpen(false);
    },

    onError: () => {
      toast({
        title: "Save Failed",
        description: "Unable to save device information.",
        variant: "destructive",
      });
    },
  });

  // ✅ Mutation for blocking the device
  const blockDevice = useMutation({
    mutationFn: (id: string) =>
      axios.post(`${API_BASE}/devices/${id}/block`).then((res) => res.data),

    onSuccess: () => {
      toast({
        title: "Device Blocked",
        description: "The device has been blocked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setOpen(false);
    },

    onError: () => {
      toast({
        title: "Block Failed",
        description: "Failed to block this device.",
        variant: "destructive",
      });
    },
  });

  // ✅ Handle Save and Block
  const handleSave = () => {
    if (!device) return;
    saveDevice.mutate({
      id: device.id,
      name: deviceName || `Device-${device.mac.slice(-5)}`,
      owner,
      isGuest,
    });
  };

  const handleBlock = () => {
    if (device) blockDevice.mutate(device.id);
  };

  // ✅ Listen for new device alerts via WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_ALERTS_URL);

    ws.onmessage = (event) => {
      try {
        const newDevice: Device = JSON.parse(event.data);
        setDevice(newDevice);
        setDeviceName(newDevice.hostname || "");
        setOwner("Me");
        setIsGuest(false);
        setOpen(true);
      } catch (error) {
        console.error("Invalid WebSocket data:", event.data);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => ws.close();
  }, [WS_ALERTS_URL]);

  if (!device) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Tablet className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle>New Device Detected</AlertDialogTitle>
          <AlertDialogDescription>
            A new or unknown device just connected to your network.
            You can save or block it immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Device Info */}
          <div className="space-y-2">
            <Label>Device Information</Label>
            <div className="px-4 py-3 rounded-md bg-muted text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-muted-foreground">MAC Address:</div>
                <div>{device.mac}</div>
                <div className="text-muted-foreground">IP Address:</div>
                <div>{device.ip}</div>
                {device.hostname && (
                  <>
                    <div className="text-muted-foreground">Hostname:</div>
                    <div>{device.hostname}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-2">
            <Label htmlFor="device-name">Device Name</Label>
            <Input
              id="device-name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Enter a name for this device"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Owner</Label>
            <Input
              id="owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g., Grace’s Phone"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="guest-device"
              checked={isGuest}
              onChange={(e) => setIsGuest(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <Label htmlFor="guest-device" className="cursor-pointer">
              Mark as guest device
            </Label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Dismiss</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            className="bg-destructive hover:bg-destructive/90"
          >
            Block Device
          </AlertDialogAction>
          <AlertDialogAction
            onClick={handleSave}
            className="bg-primary flex items-center gap-2"
          >
            <Shield className="h-4 w-4" /> Save Device
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
