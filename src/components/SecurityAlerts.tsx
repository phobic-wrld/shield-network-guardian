import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function SecurityAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    try {
      const res = await fetch("http://192.168.4.1:3000/api/network/alerts");
      if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.status}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Unable to fetch security alerts");
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="text-yellow-500" />
          Security Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500">{error}</p>}

        {alerts.length > 0 ? (
          <ul className="space-y-2">
            {alerts.map((alert, idx) => (
              <li
                key={idx}
                className={`p-2 rounded-lg ${
                  alert.type === "critical"
                    ? "bg-red-100 text-red-700"
                    : alert.type === "warning"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                ⚠️ {alert.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No current security alerts.</p>
        )}
      </CardContent>
    </Card>
  );
}
