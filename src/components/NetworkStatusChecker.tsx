import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Zap, Activity, Loader2 } from "lucide-react";
import { fetchNetworkStats, runSpeedTestAPI } from "@/services/networkService";

interface NetworkData {
  time: string;
  download: number;
  upload: number;
  ping: number;
}

export const NetworkStatusChecker = () => {
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const [currentStats, setCurrentStats] = useState({
    download: 0,
    upload: 0,
    ping: 0,
    connectionStrength: 0,
  });
  const [networkHistory, setNetworkHistory] = useState<NetworkData[]>([]);
  const { toast } = useToast();

  // ✅ Fetch stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await fetchNetworkStats(1); // latest single record
        if (stats && stats.length > 0) {
          const latest = stats[0];
          setCurrentStats({
            download: latest.downloadSpeed,
            upload: latest.uploadSpeed,
            ping: latest.ping,
            connectionStrength: latest.stability,
          });

          const now = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          setNetworkHistory((prev) => [
            ...prev.slice(-9),
            {
              time: now,
              download: latest.downloadSpeed,
              upload: latest.uploadSpeed,
              ping: latest.ping,
            },
          ]);
        }
      } catch (error) {
        console.error("❌ Error fetching network stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Run speed test through backend
  const runSpeedTest = async () => {
    setIsTestingSpeed(true);
    try {
      const result = await runSpeedTestAPI();
      setCurrentStats({
        download: result.download,
        upload: result.upload,
        ping: result.ping,
        connectionStrength: getConnectionStrengthValue(result.connectionStrength),
      });

      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setNetworkHistory((prev) => [
        ...prev.slice(-9),
        {
          time: now,
          download: result.download,
          upload: result.upload,
          ping: result.ping,
        },
      ]);

      toast({
        title: "✅ Speed Test Completed",
        description: `Download: ${result.download} Mbps | Upload: ${result.upload} Mbps | Ping: ${result.ping} ms`,
      });
    } catch (error) {
      console.error("❌ Speed test failed:", error);
      toast({
        title: "Speed Test Failed",
        description: "Unable to run the test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingSpeed(false);
    }
  };

  const getConnectionStrengthValue = (label: string) => {
    switch (label) {
      case "Excellent":
        return 100;
      case "Good":
        return 75;
      case "Fair":
        return 50;
      default:
        return 25;
    }
  };

  const getConnectionQuality = (strength: number) => {
    if (strength >= 80) return { label: "Excellent", color: "text-green-600" };
    if (strength >= 60) return { label: "Good", color: "text-blue-600" };
    if (strength >= 40) return { label: "Fair", color: "text-yellow-600" };
    return { label: "Poor", color: "text-red-600" };
  };

  const quality = getConnectionQuality(currentStats.connectionStrength);

  return (
    <div className="space-y-6">
      {/* Network Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-green-500" />
            Network Status Checker
          </CardTitle>
          <CardDescription>Live data from your backend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Download Speed</div>
              <div className="text-2xl font-bold text-blue-700">
                {currentStats.download.toFixed(1)} Mbps
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Upload Speed</div>
              <div className="text-2xl font-bold text-green-700">
                {currentStats.upload.toFixed(1)} Mbps
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600">Ping</div>
              <div className="text-2xl font-bold text-purple-700">
                {currentStats.ping.toFixed(0)} ms
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Connection Strength</div>
              <div className={`text-lg font-semibold ${quality.color}`}>
                {quality.label} ({currentStats.connectionStrength.toFixed(0)}%)
              </div>
              <Progress
                value={currentStats.connectionStrength}
                className="mt-2"
              />
            </div>
          </div>

          <Button
            onClick={runSpeedTest}
            disabled={isTestingSpeed}
            className="w-full md:w-auto"
          >
            {isTestingSpeed ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Testing Connection...
              </>
            ) : (
              <>
                <Zap className="mr-2" size={16} />
                Run Speed Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Network History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Network Performance History</CardTitle>
          <CardDescription>Data fetched from your backend every 5s</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={networkHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="download"
                  stroke="#3b82f6"
                  name="Download (Mbps)"
                />
                <Line
                  type="monotone"
                  dataKey="upload"
                  stroke="#10b981"
                  name="Upload (Mbps)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
