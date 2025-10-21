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
import axios from "axios";

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
  speed: number;
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

  // Fetch performance data
  const fetchPerformance = async () => {
    try {
      const { data } = await axios.get("/api/network/performance");
      const latest = data.stats[data.stats.length - 1];

      setStats((prev) => ({
        ...prev,
        downloadSpeed: latest?.download || 0,
        uploadSpeed: latest?.upload || 0,
        ping: latest?.ping || 0,
        devices: data.devicesCount || prev.devices,
      }));

      // Prepare chart data (last 6 entries)
      const chartData = data.stats.slice(-6).map((s: any) => ({
        time: new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        download: s.download,
        upload: s.upload,
      }));
      setNetworkData(chartData);
    } catch (err) {
      console.error("Error fetching performance:", err);
      toast({
        title: "Error",
        description: "Failed to fetch network performance",
        variant: "destructive",
      });
    }
  };

  // Fetch connected devices count
  const fetchDevices = async () => {
    try {
      const { data } = await axios.get("/api/network/scan");
      setStats((prev) => ({ ...prev, devices: data.length }));
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  };

  useEffect(() => {
    fetchPerformance();
    fetchDevices();
  }, []);

  // Refresh network stats
  const handleRefresh = () => {
    fetchPerformance();
    fetchDevices();
    toast({ title: "Network refreshed", description: "Updated stats and devices" });
  };

  // Analyze plan fit
  useEffect(() => {
    const { downloadSpeed, devices } = stats;
    let fitMessage = "Analyzing...";
    let planRecs: PlanRecommendation[] = [];

    if (downloadSpeed === 0) {
      fitMessage = "No active connection detected";
    } else if (downloadSpeed < 10 && devices > 4) {
      fitMessage = "⚠️ Your plan might be too low for your usage";
      planRecs = [
        { name: "Basic Upgrade", speed: 15, maxDevices: 6, description: "Good for light streaming and browsing." },
        { name: "Standard Upgrade", speed: 25, maxDevices: 10, description: "Ideal for families and gaming." },
      ];
    } else if (downloadSpeed >= 10 && devices <= 4) {
      fitMessage = "✅ Your plan fits your usage well";
    } else if (downloadSpeed >= 20 && devices > 10) {
      fitMessage = "⚠️ High device load detected, consider upgrading";
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
      {/* Network Speed Chart */}
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

      {/* Plan Fit / Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>🧠 Smart Network Advisor</CardTitle>
          <CardDescription>Plan analysis and optimization tips</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-base font-medium">{planFit}</p>
          {recommendations.length > 0 && (
            <div className="space-y-2">
              {recommendations.map((plan, idx) => (
                <div key={idx} className="border rounded-lg p-3 hover:bg-muted transition">
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

      {/* Optimization Tips */}
      <OptimizationSuggestion
        speed={stats.downloadSpeed}
        devices={stats.devices}
        ping={stats.ping}
        stability={stats.stability}
      />
    </div>
  );
};
