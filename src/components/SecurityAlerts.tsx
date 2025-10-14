import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";

interface SecurityEvent {
  id: string;
  deviceId: string | null;
  eventType: "new_device" | "suspicious_activity" | "network_change" | "other";
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: string;
  resolved: boolean;
}

export const SecurityAlerts = () => {
  const [showResolved, setShowResolved] = useState(false);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);

  // ✅ Use environment variable for WebSocket URL
  const BACKEND_WS_URL = import.meta.env.VITE_WS_ALERTS_URL;
  // Example in .env: VITE_WS_ALERTS_URL=ws://192.168.100.108:5000/alerts

  useEffect(() => {
    socketRef.current = new WebSocket(BACKEND_WS_URL);

    socketRef.current.onopen = () => {
      console.log("✅ Connected to WebSocket for security alerts");
      socketRef.current?.send(JSON.stringify({ type: "get_alerts" }));
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "alert_list" && data.alerts) {
          setEvents(data.alerts);
          setIsLoading(false);
        }

        if (data.type === "new_alert" && data.alert) {
          setEvents((prev) => [data.alert, ...prev]);
          toast({
            title: "⚠️ New Security Alert",
            description: data.alert.description,
          });
        }

        if (data.type === "alert_resolved" && data.id) {
          setEvents((prev) =>
            prev.map((e) => (e.id === data.id ? { ...e, resolved: true } : e))
          );
        }
      } catch (err) {
        console.error("❌ Error parsing WebSocket alert:", err);
      }
    };

    socketRef.current.onclose = () => {
      console.warn("⚠️ WebSocket disconnected, retrying...");
      setTimeout(() => {
        socketRef.current = null;
      }, 3000);
    };

    return () => socketRef.current?.close();
  }, [BACKEND_WS_URL]);

  const handleResolve = (id: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "resolve_alert", id }));
      toast({
        title: "Alert resolved",
        description: "Marked as resolved successfully.",
      });
    } else {
      toast({
        title: "Connection Error",
        description: "WebSocket not connected.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 hover:bg-amber-200"
          >
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Low
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "new_device":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "suspicious_activity":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "network_change":
        return <ShieldAlert className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredEvents = events.filter((event) => event.resolved === showResolved);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Security Alerts</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading alerts..."
                : filteredEvents.length
                ? `${filteredEvents.length} ${
                    showResolved ? "resolved" : "active"
                  } alerts`
                : "No alerts found"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? "Show Active Alerts" : "Show Resolved"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-shield border-t-transparent" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`border rounded-lg p-4 ${
                  event.resolved ? "bg-gray-50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getEventIcon(event.eventType)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{event.description}</p>
                        {getSeverityBadge(event.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </p>
                    </div>
                  </div>

                  {!event.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleResolve(event.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Resolve</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <ShieldAlert className="mx-auto h-10 w-10 text-status-safe mb-3" />
            <p className="font-medium">
              No {showResolved ? "resolved" : "active"} security alerts
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your network is currently secure
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
