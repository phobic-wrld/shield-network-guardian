import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Zap,
  RefreshCw,
  WifiOff,
  Wifi,
  Signal,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { OptimizationSuggestion } from "@/components/OptimizationSuggestion";

interface NetworkStats {
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  stability: number;
  activeOptimizations: number;
  devices: number;
}

interface PlanRecommendation {
  name: string;
  speed: number; // Mbps
  maxDevices: number;
  description: string;
}

export const PulseBoost = () => {
  const [stats, setStats] = useState<NetworkStats>({
    downloadSpeed: 0,
    uploadSpeed: 0,
    ping: 0,
    stability: 100,
    activeOptimizations: 0,
    devices: 0,
  });
  const [networkData, setNetworkData] = useState<
    { time: string; download: number; upload: number }[]
  >([]);
  const [planFit, setPlanFit] = useState<string>("Checking...");
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  // 📡 --- CONNECT TO WEBSOCKET ---
  const connectWebSocket = () => {
    const ws = new WebSocket("ws://192.168.100.11:3000/network-stats");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to network WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "device_scan") {
          setStats((prev) => ({ ...prev, devices: data.devices.length }));
        } else {
          setStats((prev) => ({
            ...prev,
            downloadSpeed: data.downloadSpeed || prev.downloadSpeed,
            uploadSpeed: data.uploadSpeed || prev.uploadSpeed,
            ping: data.ping || prev.ping,
          }));

          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;

          setNetworkData((prev) => [
            ...prev.slice(-6),
            {
              time: timeString,
              download: data.downloadSpeed || 0,
              upload: data.uploadSpeed || 0,
            },
          ]);
        }
      } catch (err) {
        console.error("Error parsing WebSocket data:", err);
      }
    };

    ws.onclose = () => {
      console.warn("⚠️ WebSocket disconnected, retrying in 3s...");
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };
  };

  useEffect(() => {
    connectWebSocket();
    return () => wsRef.current?.close();
  }, []);

  // 🔁 --- REFRESH NETWORK ---
  const handleRefresh = () => {
    wsRef.current?.send("speedtest");
    wsRef.current?.send("scandevices");
    toast({
      title: "Network scan requested",
      description: "Fetching latest stats and devices",
    });
  };

  // 🧠 --- PLAN FIT ANALYSIS ---
  useEffect(() => {
    const speed = stats.downloadSpeed;
    const devices = stats.devices;

    let fitMessage = "Analyzing...";
    let planRecs: PlanRecommendation[] = [];

    if (speed === 0) {
      fitMessage = "No active connection detected";
    } else if (speed < 10 && devices > 4) {
      fitMessage = "⚠️ Your plan might be too low for your usage";
      planRecs = [
        { name: "Basic Upgrade", speed: 15, maxDevices: 6, description: "Good for light streaming and browsing." },
        { name: "Standard Upgrade", speed: 25, maxDevices: 10, description: "Ideal for families and gaming." },
      ];
    } else if (speed >= 10 && devices <= 4) {
      fitMessage = "✅ Your plan fits your usage well";
    } else if (speed >= 20 && devices > 10) {
      fitMessage = "⚠️ High device load detected, consider upgrading for better performance";
      planRecs = [
        { name: "Pro Plan", speed: 40, maxDevices: 15, description: "Handles many devices without lag." },
        { name: "Ultra Plan", speed: 60, maxDevices: 25, description: "Perfect for heavy streaming & gaming." },
      ];
    } else {
      fitMessage = "ℹ️ Moderate usage detected";
    }

    setPlanFit(fitMessage);
    setRecommendations(planRecs);
  }, [stats.downloadSpeed, stats.devices]);

  return (
    <div className="space-y-6">
      {/* --- Network Speed Chart --- */}
      <Card>
        <CardHeader>
          <CardTitle>📡 Network Performance</CardTitle>
          <CardDescription>Live bandwidth usage and device activity</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={networkData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="download" stroke="#3b82f6" name="Download (Mbps)" />
              <Line type="monotone" dataKey="upload" stroke="#22c55e" name="Upload (Mbps)" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Devices Connected: <strong>{stats.devices}</strong>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Plan Fit / Lag Detection Section --- */}
      <Card>
        <CardHeader>
          <CardTitle>🧠 Smart Network Advisor</CardTitle>
          <CardDescription>Plan analysis and optimization tips</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-base font-medium">{planFit}</p>
          {recommendations.length > 0 && (
            <div className="space-y-2">
              {recommendations.map((plan, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-muted transition"
                >
                  <div className="font-semibold">{plan.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.speed} Mbps • Up to {plan.maxDevices} devices
                  </div>
                  <div className="text-xs mt-1">{plan.description}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Optimization Tips --- */}
      <OptimizationSuggestion
        speed={stats.downloadSpeed}
        devices={stats.devices}
        ping={stats.ping}
        stability={stats.stability}
      />
    </div>
  );
};
