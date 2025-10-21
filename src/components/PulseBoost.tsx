import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL = "http://192.168.4.1:3000"; // Raspberry Pi backend

interface NetworkStat {
  timestamp: string;
  download: number;
  upload: number;
  ping: number;
  devices: number;
  stability: number;
}

export const PulseBoost = () => {
  const [stats, setStats] = useState<NetworkStat>({
    timestamp: "",
    download: 0,
    upload: 0,
    ping: 0,
    devices: 0,
    stability: 100,
  });

  const [networkData, setNetworkData] = useState<
    { time: string; download: number; upload: number }[]
  >([]);

  const { toast } = useToast();

  const fetchPerformance = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/network/performance`);
      if (!res.ok) throw new Error("Failed to fetch performance");
      const data = await res.json();

      setStats(data.latest);

      const chartData = data.history.map((d: NetworkStat) => ({
        time: new Date(d.timestamp).toLocaleTimeString(),
        download: d.download,
        upload: d.upload,
      }));

      setNetworkData(chartData);
    } catch (err: any) {
      console.error("Error fetching performance:", err);
      toast({
        title: "Fetch Error",
        description: err.message || "Unable to get network performance",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPerformance();
    const interval = setInterval(fetchPerformance, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📡 Network Performance</CardTitle>
          <Button size="sm" variant="outline" onClick={fetchPerformance}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <CardDescription>Live bandwidth and device statistics</CardDescription>
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

        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <span>Devices Connected: {stats.devices}</span>
          <span>Ping: {stats.ping} ms</span>
        </div>
      </CardContent>
    </Card>
  );
};
