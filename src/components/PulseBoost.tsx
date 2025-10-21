import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Zap, RefreshCw, Wifi, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NetworkStats {
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  stability: number;
  devices: number;
}

interface NetworkHistory {
  time: string;
  download: number;
  upload: number;
}

export const PulseBoost = () => {
  const [stats, setStats] = useState<NetworkStats>({
    downloadSpeed: 0,
    uploadSpeed: 0,
    ping: 0,
    stability: 100,
    devices: 0,
  });
  const [networkData, setNetworkData] = useState<NetworkHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const BACKEND_URL = "http://192.168.4.1:3000/network";

  const fetchPerformance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/performance`);
      if (!res.ok) throw new Error("Failed to fetch performance");
      const data = await res.json();

      setStats({
        downloadSpeed: data.latest.download,
        uploadSpeed: data.latest.upload,
        ping: data.latest.ping,
        stability: data.latest.stability,
        devices: data.latest.devices,
      });

      setNetworkData(
        data.history.map((item: any) => ({
          time: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          download: item.download,
          upload: item.upload,
        }))
      );
    } catch (err: any) {
      console.error("Error fetching performance:", err);
      toast({
        title: "Fetch error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-2xl">Network Performance</CardTitle>
        <Button onClick={fetchPerformance} variant="outline" size="sm">
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Activity className="animate-spin h-6 w-6 text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Download</span>
              <span>{stats.downloadSpeed.toFixed(2)} Mbps</span>
            </div>
            <Progress value={stats.downloadSpeed} max={500} />
            <div className="flex justify-between">
              <span>Upload</span>
              <span>{stats.uploadSpeed.toFixed(2)} Mbps</span>
            </div>
            <Progress value={stats.uploadSpeed} max={500} />
            <div className="flex justify-between">
              <span>Ping</span>
              <span>{stats.ping.toFixed(0)} ms</span>
            </div>
            <Progress value={stats.stability} max={100} />
            <div className="flex justify-between">
              <span>Connected Devices</span>
              <span>{stats.devices}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
