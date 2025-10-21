import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import axios from "axios";

interface SecurityEvent {
  id: string;
  eventType: "new_device" | "network_change";
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: string;
  resolved: boolean;
}

export const SecurityAlerts = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const devicesRes = await axios.get("/api/network/scan");
      const statsRes = await axios.get("/api/network/stats");

      const deviceAlerts: SecurityEvent[] = devicesRes.data.map((device: any, idx: number) => ({
        id: `device-${idx}`,
        eventType: "new_device",
        severity: "low",
        description: `New device detected: ${device.ip} (${device.mac})`,
        timestamp: new Date().toISOString(),
        resolved: false,
      }));

      const networkAlerts: SecurityEvent[] = [];
      if (statsRes.data.stats && statsRes.data.stats.length > 0) {
        const latest = statsRes.data.stats[0];
        if (latest.ping > 100) {
          networkAlerts.push({
            id: "network-1",
            eventType: "network_change",
            severity: "medium",
            description: `High ping detected: ${latest.ping} ms`,
            timestamp: new Date().toISOString(),
            resolved: false,
          });
        }
      }

      setEvents([...deviceAlerts, ...networkAlerts]);
    } catch (err) {
      console.error("Error fetching network alerts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredEvents = events.filter((e) => e.resolved === showResolved);

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
      case "network_change": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default: return <ShieldAlert className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl font-bold">Security Alerts</CardTitle>
          <CardDescription>
            {isLoading ? "Loading alerts..." : filteredEvents.length ? `${filteredEvents.length} ${showResolved ? "resolved" : "active"} alerts` : "No alerts found"}
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowResolved(!showResolved)}>
          {showResolved ? "Show Active Alerts" : "Show Resolved"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className={`border rounded-lg p-4 ${event.resolved ? "bg-gray-50" : ""}`}>
                <div className="flex items-start gap-3">
                  {getEventIcon(event.eventType)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{event.description}</p>
                      {getSeverityBadge(event.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</p>
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
