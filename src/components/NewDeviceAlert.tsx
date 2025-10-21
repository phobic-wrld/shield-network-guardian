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
import { Tablet, Shield, Ban, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface Device {
  mac: string;
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
  const [timeLimit, setTimeLimit] = useState(""); // Guest duration in minutes
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const API_BASE = import.meta.env.VITE_API_URL + "/api/devices";

  // Reset form when device changes
  useEffect(() => {
    if (device) {
      setDeviceName(device.name || "");
      setOwner("Me");
      setIsGuest(false);
      setTimeLimit("");
    }
  }, [device]);

  const hasValidMAC = !!device?.mac;

  /** ✅ Authorize device permanently */
  const handleAuthorize = async () => {
    if (!device || !hasValidMAC) return;

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/resolve`, {
        mac: device.mac,
        action: "approve",
      });

      toast({
        title: "✅ Device Authorized",
        description: `${deviceName || device.name || "Device"} added to trusted list.`,
      });

      queryClient.invalidateQueries(["devices"]);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Authorization Failed",
        description: "Unable to authorize this device. Check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** ⏱️ Authorize as guest */
  const handleGuest = async () => {
    if (!device || !hasValidMAC) return;
    if (!timeLimit || Number(timeLimit) <= 0)
      return toast({
        title: "⏱️ Time limit required",
        description: "Please set a valid duration for guest access.",
        variant: "destructive",
      });

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/resolve`, {
        mac: device.mac,
        action: "approve",
        timeLimit: Number(timeLimit),
      });

      toast({
        title: "🟢 Guest Authorized",
        description: `${deviceName || device.name || "Device"} can access for ${timeLimit} minutes.`,
      });

      queryClient.invalidateQueries(["devices"]);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Guest Authorization Failed",
        description: "Unable to authorize guest device. Check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** 🚫 Deny / Block device */
  const handleDeny = async () => {
    if (!device || !hasValidMAC) return;

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/resolve`, {
        mac: device.mac,
        action: "block",
      });

      toast({
        title: "🚫 Device Blocked",
        description: `${deviceName || device.name || "Device"} has been disconnected and blocked.`,
      });

      queryClient.invalidateQueries(["devices"]);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Block Failed",
        description: "Unable to block this device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <AlertDialogTitle>New Device Attempting to Connect</AlertDialogTitle>
          <AlertDialogDescription>
            A new device is trying to connect to your Wi-Fi. Authorize it permanently, allow guest access, or block it.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Device Info */}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Device Information</Label>
            <div className="px-4 py-3 rounded-md bg-muted text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-muted-foreground">MAC Address:</div>
                <div>{device.mac || "N/A"}</div>
                <div className="text-muted-foreground">IP Address:</div>
                <div>{device.ip || "N/A"}</div>
                <div className="text-muted-foreground">Vendor:</div>
                <div>{device.vendor || "Unknown"}</div>
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
              placeholder="Enter device name"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Owner</Label>
            <Input
              id="owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Owner name"
              disabled={loading}
            />
          </div>

          {/* Guest device checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="guest-device"
              checked={isGuest}
              onChange={(e) => setIsGuest(e.target.checked)}
              className="form-checkbox h-4 w-4"
              disabled={loading}
            />
            <Label htmlFor="guest-device" className="cursor-pointer">
              Mark as guest device
            </Label>
          </div>

          {isGuest && (
            <div className="space-y-2">
              <Label htmlFor="time-limit">Time Limit (minutes)</Label>
              <Input
                id="time-limit"
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="e.g., 30"
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel disabled={loading}>Dismiss</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDeny}
            className="bg-destructive text-white hover:bg-destructive/90 flex items-center gap-2"
            disabled={!hasValidMAC || loading}
          >
            <Ban className="h-4 w-4" /> {loading ? "Blocking..." : "Block"}
          </AlertDialogAction>

          {isGuest && (
            <AlertDialogAction
              onClick={handleGuest}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              disabled={!hasValidMAC || loading}
            >
              <Clock className="h-4 w-4" /> {loading ? "Processing..." : "Guest"}
            </AlertDialogAction>
          )}

          <AlertDialogAction
            onClick={handleAuthorize}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            disabled={!hasValidMAC || loading}
          >
            <Shield className="h-4 w-4" /> {loading ? "Authorizing..." : "Authorize"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
