import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Clock, Wifi, WifiOff, User, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Helper Functions ---
const formatTotalTime = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const getRemainingTime = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// --- Duration Options ---
const durationOptions = [
  { value: "30", label: "30 mins" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "240", label: "4 hours" },
  { value: "480", label: "8 hours" },
  { value: "1440", label: "24 hours" },
];

interface GuestDevice {
  id: string;
  name: string;
  macAddress: string;
  connectedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export const SmartGuestAccess = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [guestNetworkEnabled, setGuestNetworkEnabled] = useState(true);
  const [guestSSID, setGuestSSID] = useState("Shield_Guest");
  const [guestPassword, setGuestPassword] = useState("");
  const [expiryDuration, setExpiryDuration] = useState("60");
  const [guestDevices, setGuestDevices] = useState<GuestDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // --- Fetch guest devices ---
  const fetchGuestDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/guests`);
      const data = await res.json();
      setGuestDevices(data);
    } catch (err) {
      console.error("Failed to fetch guest devices:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch current password ---
  const fetchCurrentPassword = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/guests/password`);
      const data = await res.json();
      setGuestPassword(data.password);
    } catch (err) {
      console.error("Failed to fetch guest password:", err);
    }
  };

  // --- Generate new password ---
  const generateNewPassword = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/guests/password`, { method: "POST" });
      const data = await res.json();
      setGuestPassword(data.password);
      toast({ title: "Password Updated", description: "Guest password has been regenerated." });
    } catch (err) {
      console.error("Failed to generate password:", err);
    }
  };

  // --- Disconnect device ---
  const disconnectDevice = async (deviceId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/guests/disconnect/${deviceId}`, { method: "POST" });
      setGuestDevices((prev) =>
        prev.map((device) => (device.id === deviceId ? { ...device, isActive: false } : device))
      );
      toast({ title: "Device Disconnected", description: "Guest device has been disconnected." });
    } catch (err) {
      console.error("Failed to disconnect device:", err);
    }
  };

  // --- Reset guest network ---
  const resetGuestNetwork = async () => {
    await generateNewPassword();
    setGuestDevices([]);
  };

  // --- Apply changes (SSID, password, duration) ---
  const applyChanges = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/guests/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ssid: guestSSID,
          password: guestPassword,
          duration: expiryDuration,
        }),
      });
      toast({ title: "Settings Applied", description: "Guest network configuration updated." });
    } catch (err) {
      console.error("Failed to apply changes:", err);
      toast({ title: "Error", description: "Failed to update guest network.", variant: "destructive" });
    }
  };

  // --- WebSocket for real-time updates ---
  useEffect(() => {
    const connectWS = () => {
      const ws = new WebSocket(`${BACKEND_URL.replace("http", "ws")}/ws`);
      wsRef.current = ws;

      ws.onopen = () => console.log("✅ Connected to guest WebSocket");

      ws.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === "guest_connected" || data.type === "guest_disconnected") {
          fetchGuestDevices();
        }
        if (data.type === "password_updated") {
          setGuestPassword(data.password);
        }
      };

      ws.onclose = () => {
        console.warn("⚠️ Guest WebSocket disconnected, reconnecting...");
        setTimeout(connectWS, 3000);
      };
    };

    connectWS();
    fetchGuestDevices();
    fetchCurrentPassword();

    return () => wsRef.current?.close();
  }, []);

  // --- Live countdown for active devices ---
  useEffect(() => {
    const interval = setInterval(() => setGuestDevices((prev) => [...prev]), 60000); // triggers re-render every minute
    return () => clearInterval(interval);
  }, []);

  const activeDeviceCount = guestDevices.filter((d) => d.isActive).length;
  const totalSessionTime = guestDevices.reduce((total, device) => {
    const connected = new Date(device.connectedAt).getTime();
    const expired = device.isActive ? Date.now() : new Date(device.expiresAt).getTime();
    return total + (expired - connected);
  }, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-8 w-8 animate-spin border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="text-blue-500" /> Smart Guest Access
            </CardTitle>
            <CardDescription>Manage temporary guest WiFi access</CardDescription>
          </div>
          <Switch checked={guestNetworkEnabled} onCheckedChange={setGuestNetworkEnabled} />
        </div>
      </CardHeader>

      <CardContent>
        {guestNetworkEnabled ? (
          <div className="space-y-6">
            {/* SSID & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest-ssid">Guest Network Name</Label>
                <Input id="guest-ssid" value={guestSSID} onChange={(e) => setGuestSSID(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-duration">Access Duration</Label>
                <Select value={expiryDuration} onValueChange={setExpiryDuration}>
                  <SelectTrigger id="expiry-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="guest-password">Guest Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="guest-password"
                    type={showPassword ? "text" : "password"}
                    value={guestPassword}
                    readOnly
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generateNewPassword}>
                  Generate
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                <div className="text-xs text-blue-600 dark:text-blue-400">Active Guests</div>
                <div className="text-xl font-semibold flex items-center gap-1">
                  <User size={16} />
                  {activeDeviceCount}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                <div className="text-xs text-purple-600 dark:text-purple-400">Total Guest Time</div>
                <div className="text-xl font-semibold flex items-center gap-1">
                  <Clock size={16} />
                  {formatTotalTime(totalSessionTime)}
                </div>
              </div>
            </div>

            {/* Connected Devices */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Connected Guests</h3>
                <Badge variant="outline" className="font-normal">{activeDeviceCount} active</Badge>
              </div>

              <ScrollArea className="h-64 rounded-md border">
                <div className="divide-y">
                  {guestDevices.length > 0 ? (
                    guestDevices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 hover:bg-muted"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 h-2 w-2 rounded-full ${
                              device.isActive ? "bg-green-500 animate-pulse" : "bg-gray-300"
                            }`}
                          />
                          <div>
                            <p className="font-medium">{device.name}</p>
                            <p className="text-xs text-muted-foreground">{device.macAddress}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <Clock size={12} className="mr-1" />
                                {new Date(device.connectedAt).toLocaleTimeString()}
                              </div>
                              {device.isActive && (
                                <div className="flex items-center text-green-600 dark:text-green-400">
                                  <Timer size={12} className="mr-1" />
                                  {getRemainingTime(device.expiresAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {device.isActive && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7"
                            onClick={() => disconnectDevice(device.id)}
                            aria-label={`Disconnect ${device.name}`}
                          >
                            <WifiOff size={14} className="mr-1" /> Disconnect
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-muted-foreground">No guest devices connected</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetGuestNetwork}>Reset Guest Network</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={applyChanges}>Apply Changes</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <WifiOff size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Guest Network is Disabled</h3>
            <p className="text-muted-foreground text-center mb-6">
              Enable the guest network to allow temporary visitor access.
            </p>
            <Button onClick={() => setGuestNetworkEnabled(true)}>
              <Wifi className="mr-2" /> Enable Guest Access
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
