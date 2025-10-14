import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Clock, Wifi, WifiOff, User, Timer } from "lucide-react";
import QRCode from "react-qr-code"; // ✅ Modern, Vite-friendly QRCode

interface GuestDevice {
  id: string;
  name: string;
  macAddress: string;
  connectedAt: string;
  expiresAt: string;
  isActive: boolean;
}

const EXPIRY_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "240", label: "4 hours" },
  { value: "480", label: "8 hours" },
  { value: "1440", label: "24 hours" },
];

export const SmartGuestAccessEnhanced: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [guestNetworkEnabled, setGuestNetworkEnabled] = useState(true);
  const [guestSSID, setGuestSSID] = useState("Shield_Guest");
  const [guestPassword, setGuestPassword] = useState("");
  const [expiryDuration, setExpiryDuration] = useState("60");
  const [guestDevices, setGuestDevices] = useState<GuestDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = "http://192.168.100.108:5000";

  // ------------------- Fetch initial data -------------------
  const fetchGuestDevices = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/guests`);
      const data = await res.json();
      setGuestDevices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestPassword = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/guests/password`);
      const data = await res.json();
      setGuestPassword(data.password || "");
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------- WebSocket Setup -------------------
  useEffect(() => {
    fetchGuestDevices();
    fetchGuestPassword();

    const ws = new WebSocket(`${BACKEND_URL.replace("http", "ws")}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "guest_connected":
        case "guest_disconnected":
          fetchGuestDevices();
          break;
        case "password_updated":
          setGuestPassword(data.password);
          break;
      }
    };

    return () => ws.close();
  }, []);

  // ------------------- Real-time countdown -------------------
  useEffect(() => {
    const interval = setInterval(() => setGuestDevices((prev) => [...prev]), 1000);
    return () => clearInterval(interval);
  }, []);

  // ------------------- Actions -------------------
  const generateNewPassword = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/guests/password`, { method: "POST" });
      const data = await res.json();
      setGuestPassword(data.password);
    } catch (err) {
      console.error(err);
    }
  };

  const disconnectDevice = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/guests/disconnect/${id}`, { method: "POST" });
      setGuestDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isActive: false } : d))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const resetGuestNetwork = () => {
    generateNewPassword();
    setGuestDevices((prev) => prev.map((d) => ({ ...d, isActive: false })));
  };

  // ------------------- Helpers -------------------
  const activeDeviceCount = guestDevices.filter((d) => d.isActive).length;

  const totalSessionTime = guestDevices.reduce((total, d) => {
    const connected = new Date(d.connectedAt).getTime();
    const expired = d.isActive ? Date.now() : new Date(d.expiresAt).getTime();
    return total + (expired - connected);
  }, 0);

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

  if (loading) return <div className="h-96 flex justify-center items-center">Loading...</div>;

  // ------------------- Render -------------------
  return (
    <Card className="w-full space-y-6">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <User className="text-blue-500" /> Smart Guest Access
          </CardTitle>
          <CardDescription>Manage temporary access with real-time monitoring</CardDescription>
        </div>
        <Switch checked={guestNetworkEnabled} onCheckedChange={setGuestNetworkEnabled} />
      </CardHeader>

      <CardContent>
        {guestNetworkEnabled ? (
          <>
            <Tabs defaultValue="guest-config" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="guest-config">Guest Config</TabsTrigger>
                <TabsTrigger value="active-guests">Active Guests</TabsTrigger>
                <TabsTrigger value="qr-share">QR Share</TabsTrigger>
              </TabsList>

              {/* Guest Config */}
              <TabsContent value="guest-config" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guest-ssid">Guest Network Name</Label>
                    <Input id="guest-ssid" value={guestSSID} onChange={(e) => setGuestSSID(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry-duration">Access Duration</Label>
                    <Select value={expiryDuration} onValueChange={setExpiryDuration}>
                      <SelectTrigger id="expiry-duration"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPIRY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="guest-password">Guest Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="guest-password"
                        type={showPassword ? "text" : "password"}
                        value={guestPassword}
                        onChange={(e) => setGuestPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <Button variant="outline" onClick={generateNewPassword}>Generate</Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Active Guests" value={activeDeviceCount} icon={<User size={16} />} color="blue" />
                  <StatCard label="Access Sessions" value={guestDevices.length} color="yellow" />
                  <StatCard label="Total Guest Time" value={formatTotalTime(totalSessionTime)} icon={<Clock size={16} />} color="purple" />
                </div>
              </TabsContent>

              {/* Active Guests */}
              <TabsContent value="active-guests">
                <ScrollArea className="h-64 rounded-md border divide-y">
                  {guestDevices.length > 0 ? guestDevices.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 hover:bg-muted">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-2 w-2 rounded-full ${d.isActive ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                        <div>
                          <p className="font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.macAddress}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock size={12} className="mr-1" />{new Date(d.connectedAt).toLocaleTimeString()}
                            </div>
                            {d.isActive && (
                              <div className="flex items-center text-xs text-green-600">
                                <Timer size={12} className="mr-1" />{getRemainingTime(d.expiresAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {d.isActive && (
                        <Button size="sm" variant="destructive" className="h-7" onClick={() => disconnectDevice(d.id)}>
                          <WifiOff size={14} className="mr-1" /> Disconnect
                        </Button>
                      )}
                    </div>
                  )) : <p className="p-4 text-center text-muted-foreground">No guest devices connected</p>}
                </ScrollArea>
              </TabsContent>

              {/* QR Share */}
              <TabsContent value="qr-share">
                <div className="flex flex-col items-center space-y-4">
                  <QRCode value={`WIFI:T:WPA;S:${guestSSID};P:${guestPassword};;`} size={150} />
                  <div className="bg-muted rounded-lg p-4 space-y-2 w-full max-w-sm">
                    <div className="flex justify-between"><span>Network Name:</span><span className="font-mono">{guestSSID}</span></div>
                    <div className="flex justify-between"><span>Password:</span><span className="font-mono">{guestPassword}</span></div>
                    <div className="flex justify-between"><span>Duration:</span><span>{EXPIRY_OPTIONS.find(opt => opt.value === expiryDuration)?.label}</span></div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <DisabledNetworkSection onEnable={() => setGuestNetworkEnabled(true)} />
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={resetGuestNetwork}>Reset Guest Network</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Apply Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ------------------- Helpers -------------------
const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon?: JSX.Element; color: string }) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400",
    yellow: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className={`${colorMap[color]} rounded-lg p-3`}>
      <div className="text-xs">{label}</div>
      <div className="text-xl font-semibold flex items-center gap-1">{icon}{value}</div>
    </div>
  );
};

const DisabledNetworkSection = ({ onEnable }: { onEnable: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <WifiOff size={48} className="text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium mb-2">Guest Network is Disabled</h3>
    <p className="text-muted-foreground text-center mb-6">
      Enable the guest network to provide temporary access to visitors without sharing your main WiFi password.
    </p>
    <Button onClick={onEnable}><Wifi className="mr-2" /> Enable Guest Access</Button>
  </div>
);
