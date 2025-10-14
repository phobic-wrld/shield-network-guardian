import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, HardDrive, HardDriveDownload } from "lucide-react";

// Define types for your backend responses
interface DeviceStatus {
  connected: boolean;
  ipAddress: string;
  latency?: number | null;
}

export const RaspberryPiConnect = () => {
  const [ipAddress, setIpAddress] = useState<string>("");
  const [status, setStatus] = useState<DeviceStatus>({
    connected: false,
    ipAddress: "",
    latency: null,
  });
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ Use .env variable for API base
  const API_BASE = import.meta.env.VITE_API_URL;

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await axios.post<DeviceStatus>(
        `${API_BASE}/connect-device`,
        { ipAddress }
      );
      setStatus({
        connected: true,
        ipAddress: response.data.ipAddress,
        latency: response.data.latency,
      });
    } catch (error) {
      console.error("Connection failed:", error);
      alert("Failed to connect to device. Check IP or network.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/disconnect-device`);
      setStatus({
        connected: false,
        ipAddress: "",
        latency: null,
      });
    } catch (error) {
      console.error("Disconnect failed:", error);
      alert("Failed to disconnect device.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Optional periodic status check
    const interval = setInterval(async () => {
      try {
        const res = await axios.get<DeviceStatus>(`${API_BASE}/device-status`);
        setStatus(res.data);
      } catch (err) {
        console.error("Status check failed:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [API_BASE]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          Raspberry Pi Connection
          {status.connected ? (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-xs text-green-700 dark:text-green-200 rounded-md">
              <HardDriveDownload className="inline-block" size={14} />
              Detected
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-xs text-muted-foreground rounded-md">
              <HardDrive className="inline-block" size={14} />
              Offline
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Connect to your Raspberry Pi device for real-time network monitoring
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!status.connected ? (
          <div className="space-y-4">
            <Input
              placeholder="Enter Raspberry Pi IP address"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
            <Button
              onClick={handleConnect}
              className="w-full"
              disabled={!ipAddress || loading}
            >
              <Wifi className="mr-2 h-4 w-4" />
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">
                  Connected
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {status.ipAddress}
                </p>
                <p className="text-xs text-green-500 dark:text-green-500">
                  Latency: {status.latency !== null ? `${status.latency?.toFixed(1)}ms` : "N/A"}
                </p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="w-full"
              disabled={loading}
            >
              <WifiOff className="mr-2 h-4 w-4" />
              {loading ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
