import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { useWebSocket } from "./useWebSocket"; // ✅ We'll link this to your existing ws connection

interface NetworkStats {
  mondayUsage: number;
  tuesdayUsage: number;
  wednesdayUsage: number;
  thursdayUsage: number;
  fridayUsage: number;
  saturdayUsage: number;
  sundayUsage: number;
}

export const useStatsSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { socket } = useWebSocket(); // 🔗 using your existing WebSocket connection
  const [stats, setStats] = useState<NetworkStats>({
    mondayUsage: 15,
    tuesdayUsage: 22,
    wednesdayUsage: 18,
    thursdayUsage: 25,
    fridayUsage: 20,
    saturdayUsage: 10,
    sundayUsage: 5,
  });

  useEffect(() => {
    if (!socket) return;

    console.log("📡 Connected to WebSocket for network stats...");

    const handleStatsUpdate = (data: any) => {
      console.log("📊 Received network stats update:", data);
      queryClient.invalidateQueries({ queryKey: ["networkStats"] });

      setStats((prev) => ({
        ...prev,
        mondayUsage: Math.max(prev.mondayUsage, data.download_speed / 4),
        tuesdayUsage: Math.max(prev.tuesdayUsage, data.download_speed / 4),
      }));

      // 🔔 Detailed alerts
      if (data.stability < 80) {
        toast({
          title: "⚠️ Network Stability Alert",
          description: `Network stability dropped to ${data.stability.toFixed(1)}%`,
          variant: "destructive",
        });
      } else if (data.download_speed < 50) {
        toast({
          title: "📉 Network Speed Alert",
          description: `Download speed is ${data.download_speed.toFixed(1)} Mbps`,
          variant: "destructive",
        });
      } else if (data.ping > 100) {
        toast({
          title: "⏱️ High Latency Alert",
          description: `Ping is ${data.ping.toFixed(0)}ms`,
          variant: "destructive",
        });
      }
    };

    // Listen for updates from backend (event name depends on your wsServer)
    socket.on("networkStatsUpdate", handleStatsUpdate);

    // Cleanup
    return () => {
      socket.off("networkStatsUpdate", handleStatsUpdate);
      console.log("❌ Unsubscribed from WebSocket stats updates");
    };
  }, [socket, queryClient, toast]);

  return { stats };
};
