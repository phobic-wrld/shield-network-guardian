import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, AlertCircle, Cpu, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NetworkHealthItem {
  name: string;
  status: "good" | "warning" | "critical";
  message: string;
}

const STATUS_CONFIG = {
  good: { color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", icon: <CheckCircle size={16} className="text-green-500" /> },
  warning: { color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30", icon: <AlertCircle size={16} className="text-yellow-500" /> },
  critical: { color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", icon: <AlertCircle size={16} className="text-red-500" /> },
};

export const NetworkHealth = () => {
  const [items, setItems] = useState<NetworkHealthItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL;      // e.g., http://192.168.100.108:3000
  const WS_URL = import.meta.env.VITE_WS_URL;         // e.g., ws://192.168.100.108:3000/network-stats

  useEffect(() => {
    // 1️⃣ Initial fetch (optional)
    const fetchInitialData = async () => {
      try {
        const res = await fetch(`${API_BASE}/network/health`);
        if (!res.ok) throw new Error("Failed to fetch network health");
        const data: NetworkHealthItem[] = await res.json();
        setItems(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchInitialData();

    // 2️⃣ WebSocket for real-time updates
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      try {
        const data: NetworkHealthItem[] = JSON.parse(event.data);
        setItems(data);
      } catch (err) {
        console.error("Failed to parse WS data:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError("WebSocket connection failed");
    };

    return () => ws.close();
  }, [API_BASE, WS_URL]);

  if (error) return (
    <Card>
      <CardHeader>
        <CardTitle>Network Health</CardTitle>
        <CardDescription className="text-red-500">Error: {error}</CardDescription>
      </CardHeader>
    </Card>
  );

  const criticalCount = items.filter(item => item.status === "critical").length;
  const warningCount = items.filter(item => item.status === "warning").length;

  let overallStatus: "good" | "warning" | "critical" = "good";
  if (criticalCount > 0) overallStatus = "critical";
  else if (warningCount > 0) overallStatus = "warning";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className={cn("text-primary", STATUS_CONFIG[overallStatus].color)} />
            Network Health
          </CardTitle>
          <div className="flex items-center space-x-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              overallStatus === "good" ? "bg-green-500" :
              overallStatus === "warning" ? "bg-yellow-500" : "bg-red-500"
            )}></div>
            <span className={cn("text-sm font-medium", STATUS_CONFIG[overallStatus].color)}>
              {overallStatus === "good" ? "Healthy" :
               overallStatus === "warning" ? "Warning" : "Issues Detected"}
            </span>
          </div>
        </div>
        <CardDescription>Overall status of your network system</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-md",
                STATUS_CONFIG[item.status].bg
              )}
            >
              <div className="flex items-center gap-2">
                {item.status === "good" ? (
                  <Cpu size={16} className={STATUS_CONFIG.good.color} />
                ) : (
                  <Wifi size={16} className={STATUS_CONFIG[item.status].color} />
                )}
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn("text-xs", STATUS_CONFIG[item.status].color)}>
                  {item.message}
                </span>
                {STATUS_CONFIG[item.status].icon}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
