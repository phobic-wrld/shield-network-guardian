import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, ShieldAlert, Info } from "lucide-react";

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
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const BACKEND_URL = "http://192.168.4.1:3000/network";

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/alerts`);
      if (!res.ok) throw new Error("Failed to fetch network alerts");
      const data = await res.json();
      setEvents(data.alerts || []);
    } catch (err: any) {
      console.error("Error fetching network alerts:", err);
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
    fetchAlerts();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "new_device":
        return <Info className="text-blue-500" />;
      case "suspicious_activity":
        return <AlertTriangle className="text-amber-500" />;
      case "network_change":
        return <ShieldAlert className="text-purple-500" />;
      default:
        return <Info className="text-gray-500" />;
    }
  };

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));

  const filteredEvents = events.filter(e => e.resolved === showResolved);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl font-bold">Security Alerts</CardTitle>
        </div>
        <Button onClick={() => setShowResolved(!showResolved)} variant="outline" size="sm">
          {showResolved ? "Show Active Alerts" : "Show Resolved"}
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p>Loading alerts...</p>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <div key={event.id} className="border rounded-lg p-4 flex items-start gap-3">
              {getEventIcon(event.eventType)}
              <div className="flex-1">
                <p className="font-medium">{event.description}</p>
                <p className="text-sm text-muted-foreground">{formatDate(event.timestamp)}</p>
              </div>
              {getSeverityBadge(event.severity)}
            </div>
          ))
        ) : (
          <p>No {showResolved ? "resolved" : "active"} alerts</p>
        )}
      </CardContent>
    </Card>
  );
};
