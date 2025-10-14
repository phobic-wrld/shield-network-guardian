import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Zap, RefreshCw, WifiOff, Wifi, Signal, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

export const PulseBoost = () => {
  const [stats, setStats] = useState<NetworkStats>({
    downloadSpeed: 0,
    uploadSpeed: 0,
    ping: 0,
    stability: 100,
    activeOptimizations: 0,
    devices: 0,
  });
  const [networkData, setNetworkData] = useState<{ time: string; download: number; upload: number }[]>([]);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    const ws = new WebSocket("ws://localhost:3000/network-stats");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to network WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle device scan
        if (data.type === "device_scan") {
          setStats((prev) => ({ ...prev, devices: data.devices.length }));
        } else {
          // Assume data has downloadSpeed, uploadSpeed, ping
          setStats((prev) => ({
            ...prev,
            downloadSpeed: data.downloadSpeed || prev.downloadSpeed,
            uploadSpeed: data.uploadSpeed || prev.uploadSpeed,
            ping: data.ping || prev.ping,
          }));

          // Update chart
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
          setNetworkData((prev) => [
            ...prev.slice(-6),
            { time: timeString, download: data.downloadSpeed || 0, upload: data.uploadSpeed || 0 },
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

  const handleRefresh = () => {
    wsRef.current?.send("speedtest");
    wsRef.current?.send("scandevices");
    toast({ title: "Network scan requested", description: "Fetching latest stats and devices" });
  };

  return (
    <div className="space-y-6">
      {/* Chart and cards code remains the same, using `stats` and `networkData` */}
      {/* ... paste your current JSX for LineChart and cards */}
    </div>
  );
};
