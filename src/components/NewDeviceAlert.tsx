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
import { Tablet, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface Device {
  mac: string; // always string
  ip: string;
  name?: string;
  vendor?: string;
  status?: "online" | "offline" | "unknown";
  blocked?: boolean;
}

interface Props {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewDeviceAlert = ({ device, open, onOpenChange }: Props) => {
  const [deviceName, setDeviceName] = useState("");
  const [owner, setOwner] = useState("Me");
  const [isGuest, setIsGuest] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const API_BASE = import.meta.env.VITE_API_URL + "/api/devices";

  useEffect(() => {
    if (!device) return;
    setDeviceName(device.name || "");
    setOwner("Me");
    setIsGuest(false);
  }, [device]);

  const hasValidMAC = !!device?.mac;

  const handleSave = async () => {
    if (!device || !hasValidMAC) return;
    try {
      await axios.post(`${API_BASE}/alert`, {
        mac: device.mac,
        ip: device.ip,
        name: deviceName || device.name || "Unknown Device",
        owner,
        isGuest,
      });

      toast({
        title: "Device Saved",
        description: `${deviceName || device.name} added to network.`,
      });

      onOpenChange(false);
      queryClient.invalidateQueries(["devices"]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Save Failed",
        description: "Unable to save device information.",
        variant: "destructive",
      });
    }
  };

  const handleBlock = async () => {
    if (!device || !hasValidMAC) return;
    try {
      await axios.post(`${API_BASE}/block`, { mac: device.mac });

      toast({
        title: "Device Blocked",
        description: `${deviceName || device.name} blocked successfully.`,
      });

      onOpenChange(false);
      queryClient.invalidateQueries(["devices"]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Block Failed",
        description: "Unable to block this device.",
        variant: "destructive",
      });
    }
  };

  if (!device) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Tablet className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle>New Device Detected</AlertDialogTitle>
          <AlertDialogDescription>
            A new device connected to your network. Save or block it immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Device Information</Label>
            <div className="px-4 py-3 rounded-md bg-muted text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-muted-foreground">MAC Address:</div>
                <div>{device.mac || "N/A"}</div>
                <div className="text-muted-foreground">IP Address:</div>
                <div>{device.ip}</div>
                <div className="text-muted-foreground">Vendor:</div>
                <div>{device.vendor || "Unknown"}</div>
              </div>
            </div>
          </div>

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

        <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel>Dismiss</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            className="bg-destructive hover:bg-destructive/90"
            disabled={!hasValidMAC}
          >
            Block Device
          </AlertDialogAction>
          <AlertDialogAction
            onClick={handleSave}
            className="bg-primary flex items-center gap-2"
            disabled={!hasValidMAC}
          >
            <Shield className="h-4 w-4" /> Save Device
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
