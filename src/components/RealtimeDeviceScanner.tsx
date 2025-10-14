import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  Search,
  Smartphone,
  Laptop,
  Tv,
  Monitor,
} from "lucide-react";
import { useNetworkScanner } from "@/hooks/useNetworkScanner";

interface Device {
  hostname: string;
  ip: string;
  mac: string;
  vendor?: string;
  type: "smartphone" | "laptop" | "tv" | "unknown";
  isNew?: boolean;
}

// Choose icon per device type
const getDeviceIcon = (type: string) => {
  switch (type) {
    case "smartphone":
      return <Smartphone size={16} />;
    case "laptop":
      return <Laptop size={16} />;
    case "tv":
      return <Tv size={16} />;
    default:
      return <Monitor size={16} />;
  }
};

export const RealtimeDeviceScanner = () => {
  const { isScanning, scannedDevices, scanProgress, startManualScan } =
    useNetworkScanner();
  const [realtimeDevices, setRealtimeDevices] = useState<Device[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  // ✅ Use environment variable for WebSocket URL
  const BACKEND_WS_URL = import.meta.env.VITE_WS_DEVICES_URL; 
  // Example in .env:
  // VITE_WS_DEVICES_URL=ws://192.168.100.108:4000/devices

  useEffect(() => {
    const socket = new WebSocket(BACKEND_WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ Connected to WebSocket server (Device Scanner)");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "device_update":
            if (data.device) {
              setRealtimeDevices((prev) => {
                const exists = prev.find((d) => d.mac === data.device.mac);
                if (exists) {
                  return prev.map((d) =>
                    d.mac === data.device.mac
                      ? { ...d, ...data.device, isNew: false }
                      : d
                  );
                }
                return [{ ...data.device, isNew: true }, ...prev];
              });
            }
            break;

          case "scan_progress":
            console.log("🔄 Scan progress:", data.progress);
            break;

          default:
            console.warn("⚠️ Unknown message type from backend:", data.type);
        }
      } catch (err) {
        console.error("❌ Error parsing WebSocket message:", err);
      }
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket connection closed. Reconnecting...");
      setTimeout(() => {
        if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
          socketRef.current = new WebSocket(BACKEND_WS_URL);
        }
      }, 3000);
    };

    return () => {
      socket.close();
    };
  }, [BACKEND_WS_URL]);

  // Merge manual + realtime devices
  const devicesToShow = realtimeDevices.length > 0 ? realtimeDevices : scannedDevices;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="text-blue-500" />
              Real-time Network Scanner
            </CardTitle>
            <CardDescription>
              Continuously monitors your network for connected devices.
            </CardDescription>
          </div>

          <Button
            onClick={startManualScan}
            disabled={isScanning}
            variant="outline"
            size="sm"
          >
            <Search size={16} className="mr-2" />
            {isScanning ? "Scanning..." : "Scan Now"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isScanning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Scanning network...</span>
              <span>{scanProgress}%</span>
            </div>
            <Progress value={scanProgress} className="h-2" />
          </div>
        )}

        {/* Device stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Total Devices
            </div>
            <div className="text-xl font-semibold">{devicesToShow.length}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
            <div className="text-xs text-green-600 dark:text-green-400">
              New Devices
            </div>
            <div className="text-xl font-semibold">
              {devicesToShow.filter((d) => d.isNew).length}
            </div>
          </div>
        </div>

        {/* Device list */}
        <div className="space-y-2">
          <h3 className="font-medium">Detected Devices</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {devicesToShow.length > 0 ? (
              devicesToShow.map((device, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {device.hostname || "Unknown Device"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {device.ip} • {device.mac}
                      </p>
                      {device.vendor && (
                        <p className="text-xs text-muted-foreground">
                          {device.vendor}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {device.isNew && (
                      <Badge variant="destructive" className="text-xs">
                        New
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {device.type}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No devices detected yet. Click "Scan Now" to start scanning.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
