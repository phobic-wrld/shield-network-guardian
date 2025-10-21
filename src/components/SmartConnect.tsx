import { useEffect, useState, useRef } from "react";
import axios from "axios";
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
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  timestamp: string;
}

// ✅ Pi backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://192.168.100.11:3000";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://192.168.100.11:3000/network-stats";

export const SmartConnect = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState<NetworkStat[]>([]);
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);

  // ---------------------- Fetch initial stats ----------------------
  const fetchStats = async () => {
    try {
      const res = await axios.get<NetworkStat>(`${BACKEND_URL}/api/network/stats`);
      setStats([res.data]);
    } catch (err) {
      console.error("❌ Failed to fetch stats:", err);
      toast({
        title: "Error Fetching Stats",
        description: "Unable to reach Raspberry Pi backend.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStats();

    // ---------------------- WebSocket ----------------------
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => console.log("✅ WebSocket connected");
    ws.onclose = () => {
      console.log("❌ WebSocket disconnected, retrying in 5s");
      setTimeout(() => {
        fetchStats();
        socketRef.current = new WebSocket(WS_URL);
      }, 5000);
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "stats_update" || msg.type === "speedtest") {
          setStats([msg.data, ...stats.slice(0, 49)]);
        }
      } catch (err) {
        console.error("❌ WebSocket parse error:", err);
      }
    };

    return () => socketRef.current?.close();
  }, []);

  const handleQuickScan = async () => {
    setIsScanning(true);
    try {
      // Trigger backend speedtest
      const res = await axios.get<NetworkStat>(`${BACKEND_URL}/api/network/speedtest`);
      setStats([res.data, ...stats.slice(0, 49)]);
      toast({
        title: "Speedtest Complete",
        description: `Download: ${res.data.downloadSpeed} Mbps, Upload: ${res.data.uploadSpeed} Mbps`,
      });
    } catch (err) {
      console.error("❌ Failed to run speedtest:", err);
      toast({
        title: "Speedtest Failed",
        description: "Unable to run speedtest on Raspberry Pi.",
        variant: "destructive",
      });
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
          Monitor your network in real-time
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            Network Statistics
          </CardTitle>
          <CardDescription>
            Live download, upload, and ping stats
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {latestStat ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {latestStat.downloadSpeed} Mbps
                </div>
                <div className="text-xs text-green-600">Download</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {latestStat.uploadSpeed} Mbps
                </div>
                <div className="text-xs text-blue-600">Upload</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">
                  {latestStat.ping} ms
                </div>
                <div className="text-xs text-yellow-600">Ping</div>
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
                <span>Running speedtest...</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <Badge variant={isScanning ? "secondary" : "default"}>
              {isScanning ? "Scanning..." : "Idle"}
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
                  Quick Speedtest
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
