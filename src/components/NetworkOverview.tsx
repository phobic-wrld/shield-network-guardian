import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface NetworkStat {
  timestamp: string;
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  stability: number;
}

export const NetworkOverview = () => {
  const [networkHistory, setNetworkHistory] = useState<NetworkStat[]>([]);
  const [latestStats, setLatestStats] = useState<NetworkStat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const isMobile = useIsMobile();
  const API_BASE = import.meta.env.VITE_API_URL; // http://192.168.100.108:3000
  const WS_URL = import.meta.env.VITE_WS_URL;    // ws://192.168.100.108:3000/network-stats

  // 🟢 Fetch initial data
  const fetchInitialData = async () => {
    try {
      const res = await fetch(`${API_BASE}/network/stats`);
      if (!res.ok) throw new Error("Failed to fetch initial network stats");
      const data = await res.json();
      setNetworkHistory(data);
      if (data.length) setLatestStats(data[data.length - 1]);
    } catch (err: any) {
      console.error("❌ Initial fetch error:", err);
      setError(err.message);
    }
  };

  // 🔁 Handle WebSocket Connection + Reconnection
  const connectWebSocket = () => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const newStat: NetworkStat = JSON.parse(event.data);
        setNetworkHistory((prev) => {
          const updated = [...prev, newStat];
          return updated.length > 50 ? updated.slice(-50) : updated;
        });
        setLatestStats(newStat);
      } catch (err) {
        console.error("❌ WebSocket message parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setError("WebSocket connection failed");
    };

    ws.onclose = () => {
      console.warn("⚠️ WebSocket closed. Reconnecting in 5s...");
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(() => {
          connectWebSocket();
          reconnectTimer.current = null;
        }, 5000);
      }
    };
  };

  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [API_BASE, WS_URL]);

  const data = networkHistory.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    download: item.downloadSpeed,
    upload: item.uploadSpeed,
  }));

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Overview</CardTitle>
          <CardDescription className="text-red-500">
            Error: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 Metric Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl lg:text-2xl font-bold">
            Network Overview
          </CardTitle>
          <CardDescription>Real-time insights into your network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <MetricCard
              title="Download Speed"
              value={
                latestStats
                  ? `${latestStats.downloadSpeed.toFixed(1)} Mbps`
                  : "N/A"
              }
              trend={
                latestStats
                  ? latestStats.downloadSpeed -
                    (networkHistory.length > 1
                      ? networkHistory[networkHistory.length - 2].downloadSpeed
                      : 0)
                  : 0
              }
            />
            <MetricCard
              title="Upload Speed"
              value={
                latestStats
                  ? `${latestStats.uploadSpeed.toFixed(1)} Mbps`
                  : "N/A"
              }
              trend={
                latestStats
                  ? latestStats.uploadSpeed -
                    (networkHistory.length > 1
                      ? networkHistory[networkHistory.length - 2].uploadSpeed
                      : 0)
                  : 0
              }
            />
            <MetricCard
              title="Ping"
              value={
                latestStats ? `${latestStats.ping.toFixed(0)} ms` : "N/A"
              }
              trend={
                latestStats
                  ? latestStats.ping -
                    (networkHistory.length > 1
                      ? networkHistory[networkHistory.length - 2].ping
                      : 0)
                  : 0
              }
            />
            <MetricCard
              title="Stability"
              value={
                latestStats ? `${latestStats.stability.toFixed(1)}%` : "N/A"
              }
              trend={
                latestStats
                  ? latestStats.stability -
                    (networkHistory.length > 1
                      ? networkHistory[networkHistory.length - 2].stability
                      : 0)
                  : 0
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 📈 Network Speed Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl font-semibold">
            Network Speed History
          </CardTitle>
          <CardDescription>
            Download and upload speeds over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  angle={isMobile ? -45 : 0}
                  height={60}
                />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="download"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Download (Mbps)"
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Upload (Mbps)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
