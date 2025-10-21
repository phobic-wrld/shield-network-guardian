// src/components/PulseBoost.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Wifi, AlertTriangle } from "lucide-react";

const PulseBoost = () => {
  const [alerts, setAlerts] = useState([]);
  const [scanTime, setScanTime] = useState("");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://192.168.4.1:3000/network/alerts");
        const data = await res.json();
        setAlerts(data.alerts || []);
        setScanTime(new Date().toLocaleString());
      } catch (err) {
        console.error("Error fetching alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 20000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck className="text-green-600" /> Network Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <p className="flex items-center gap-2 text-gray-700">
          <Wifi className="w-4 h-4 text-blue-500" />
          Status: <span className="font-medium">Online</span>
        </p>
        <p className="flex items-center gap-2 text-gray-700">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          Alerts:{" "}
          <span className="font-medium text-red-600">
            {criticalCount} Critical, {warningCount} Warnings
          </span>
        </p>
        <p className="text-gray-500 text-xs">Last scan: {scanTime}</p>
      </CardContent>
    </Card>
  );
};

export default PulseBoost;
