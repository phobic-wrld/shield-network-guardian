import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const BACKEND_URL = "http://192.168.4.1:3000/network/alerts"; // Replace with your Pi endpoint

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(BACKEND_URL);
      if (!res.ok) throw new Error("Failed to fetch network alerts");

      const data = await res.json();
      // Ensure alerts is an array
      if (!Array.isArray(data.alerts)) throw new Error("Invalid backend response");
      setEvents(data.alerts);
    } catch (err: any) {
      console.error("Error fetching network alerts:", err);
      toast({
        title: "Error fetching alerts",
        description: err.message || "Unable to reach backend",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateString));

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return <Badge variant="destructive">High</Badge>;
      case "medium": return <Badge variant="secondary">Medium</Badge>;
      case "low": return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "new_device": return <Info className="h-5 w-5 text-blue-500" />;
      case "suspicious_activity": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "network_change": return <ShieldAlert className="h-5 w-5 text-purple-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredEvents = events.filter(e => e.resolved === showResolved);

  return (
    <Card>
      <CardHeader className="pb-3 flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl font-bold">Security Alerts</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading alerts..."
              : filteredEvents.length
              ? `${filteredEvents.length} ${showResolved ? "resolved" : "active"} alerts`
              : "No alerts found"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowResolved(!showResolved)}>
          {showResolved ? "Show Active Alerts" : "Show Resolved"}
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-shield border-t-transparent" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <div key={event.id} className={`border rounded-lg p-4 ${event.resolved ? "bg-gray-50" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1">{getEventIcon(event.eventType)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{event.description}</p>
                        {getSeverityBadge(event.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDate(event.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <ShieldAlert className="mx-auto h-10 w-10 text-status-safe mb-3" />
            <p className="font-medium">No {showResolved ? "resolved" : "active"} security alerts</p>
            <p className="text-sm text-muted-foreground mt-1">Your network is currently secure</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
