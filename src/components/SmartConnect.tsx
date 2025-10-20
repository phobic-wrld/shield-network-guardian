import { useEffect, useState } from "react";
import axios from "axios";
import io, { Socket } from "socket.io-client";
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
import { useToast } from "@/hooks/use-toast";
import { Activity, Zap } from "lucide-react";

interface NetworkStat {
  throughputMbps: number;
  latencyMs: number;
  packetLossPercent: number;
  timestamp?: string;
}

// ✅ Point directly to Raspberry Pi backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://192.168.100.11:3000";
const socket: Socket = io(BACKEND_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const SmartConnect = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "scanning" | "completed"
  >("idle");
  const [stats, setStats] = useState<NetworkStat[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();

    // 🧠 Listen for real-time updates from backend
    socket.off("stats:update");
    socket.on("stats:update", (newStat: NetworkStat) => {
      setStats((prev) => [newStat, ...prev.slice(0, 49)]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection failed:", err.message);
    });

    return () => {
      socket.off("stats:update");
      socket.disconnect();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get<{ stats: NetworkStat[] }>(
        `${BACKEND_URL}/api/network/stats`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setStats(res.data.stats);
    } catch (err) {
      console.error("❌ Failed to fetch stats:", err);
      toast({
        title: "Error Fetching Stats",
        description: "Unable to reach Raspberry Pi backend.",
        variant: "destructive",
      });
    }
  };

  const handleQuickScan = async () => {
    setIsScanning(true);
    setConnectionStatus("scanning");

    try {
      // Generate mock test data for quick simulation
      const mockData: NetworkStat = {
        throughputMbps: Math.floor(Math.random() * 100) + 20,
        latencyMs: Math.floor(Math.random() * 50) + 5,
        packetLossPercent: Math.floor(Math.random() * 5),
      };

      await axios.post(`${BACKEND_URL}/api/network/update`, mockData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      toast({
        title: "Network Updated",
        description: "New network statistics have been recorded successfully.",
      });

      setConnectionStatus("completed");
    } catch (err) {
      console.error("❌ Failed to post network update:", err);
      toast({
        title: "Update Failed",
        description: "Could not send new stats to Raspberry Pi.",
        variant: "destructive",
      });
      setConnectionStatus("idle");
    } finally {
      setIsScanning(false);
    }
  };

  const latestStat = stats[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Smart Connect</h1>
        <p className="text-muted-foreground">
          Connect and monitor your network devices in real-time
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            Network Statistics
          </CardTitle>
          <CardDescription>
            Live throughput, latency, and packet loss updates
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {latestStat ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {latestStat.throughputMbps} Mbps
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Throughput
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {latestStat.latencyMs} ms
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Latency</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {latestStat.packetLossPercent}%
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  Packet Loss
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No stats available yet.
            </p>
          )}

          {isScanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Updating...</span>
                <span>Gathering data...</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <Badge
              variant={
                connectionStatus === "completed"
                  ? "default"
                  : connectionStatus === "scanning"
                  ? "secondary"
                  : "outline"
              }
            >
              {connectionStatus === "completed"
                ? "Update Complete"
                : connectionStatus === "scanning"
                ? "Updating..."
                : "Idle"}
            </Badge>

            <Button onClick={handleQuickScan} disabled={isScanning}>
              {isScanning ? (
                <>
                  <Activity className="animate-spin mr-2" size={16} />
                  Updating...
                </>
              ) : (
                <>
                  <Zap className="mr-2" size={16} />
                  Quick Update
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
