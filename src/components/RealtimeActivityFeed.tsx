import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Shield, Wifi, Download, Upload, X, Trash2 } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: "security" | "network" | "download" | "upload";
  message: string;
  status: "success" | "warning" | "info";
}

export const RealtimeActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const { isPremium } = useSubscription();
  const socketRef = useRef<WebSocket | null>(null);

  // ✅ Use env variable for WebSocket
  const BACKEND_WS_URL = import.meta.env.VITE_WS_URL; // e.g., ws://192.168.100.108:3000/network-stats

  const clearAllNotifications = () => {
    setActivities([]);
  };

  const removeNotification = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = new WebSocket(BACKEND_WS_URL);

    socketRef.current.onopen = () => {
      console.log("✅ Connected to WebSocket backend");
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const newActivity: ActivityEvent = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          type: data.type || "network",
          message: data.message || "Unknown event",
          status: data.status || "info",
        };

        setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // Keep last 20 items
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socketRef.current.onclose = () => {
      console.log("⚠️ WebSocket disconnected, retrying in 5s...");
      setTimeout(() => {
        socketRef.current = null;
      }, 5000);
    };

    return () => {
      socketRef.current?.close();
    };
  }, [BACKEND_WS_URL]);

  const getIcon = (type: string) => {
    switch (type) {
      case "security": return <Shield size={16} className="text-red-500" />;
      case "network": return <Wifi size={16} className="text-blue-500" />;
      case "download": return <Download size={16} className="text-green-500" />;
      case "upload": return <Upload size={16} className="text-purple-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "warning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "info": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card className={`h-full ${isPremium ? "premium-card premium-glow" : "basic-card basic-shadow"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="text-primary" />
          Real-time Activity
          <Badge variant="outline" className="ml-auto animate-pulse">
            Live
          </Badge>
          {activities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="ml-2 h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="notification-item group animate-fade-in">
                <div className="flex items-start gap-3">
                  {getIcon(activity.type)}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(activity.status)} variant="secondary">
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {activity.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNotification(activity.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
