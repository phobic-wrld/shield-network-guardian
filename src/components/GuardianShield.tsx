import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert, Clock, Shield, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { backendApi } from "@/services/apiService";

interface SecurityData {
  securityScore: number;
  threatsToday: number;
  threatsBlocked: number;
  lastScan: string;
  status: string;
  recentEvents: {
    type: string;
    title: string;
    description: string;
    time: string;
  }[];
}

export const GuardianShield = () => {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = async () => {
    const { data, error } = await backendApi.get<SecurityData>("/security/status");
    if (error) console.error("Failed to fetch security data:", error);
    else setData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <p className="text-center text-muted-foreground">Loading security status...</p>;
  }

  const { securityScore, threatsToday, threatsBlocked, lastScan, status, recentEvents } = data!;
  
  const getStatusColor = (score: number) => {
    if (score >= 80) return "status-safe";
    if (score >= 60) return "status-warning";
    return "status-danger";
  };
  
  const statusColor = getStatusColor(securityScore);

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="w-full lg:w-2/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Guardian Shield Status</CardTitle>
                <CardDescription>Your network security at a glance</CardDescription>
              </div>
              <div className={cn("status-indicator", `text-${statusColor}`)}>
                <span className={cn("dot", `bg-${statusColor}`)}></span>
                <span className="font-medium">{status}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Security Score</span>
                  <span className={`font-bold text-${statusColor}`}>{securityScore}%</span>
                </div>
                <Progress value={securityScore} className={`h-2 bg-gray-200`} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard icon={<ShieldCheck />} label="Threats Today" value={threatsToday} color="status-safe" />
                <MetricCard icon={<Shield />} label="Threats Blocked" value={threatsBlocked} color="status-safe" />
                <MetricCard icon={<Clock />} label="Last Scan" value={lastScan} color="shield-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card className="w-full lg:w-1/3">
          <CardHeader>
            <CardTitle>Security Features</CardTitle>
            <CardDescription>Active protection systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Feature icon={<ShieldCheck size={20} />} title="Firewall Protection" desc="Active and monitoring all connections" color="status-safe" />
            <Feature icon={<Lock size={20} />} title="Intrusion Prevention" desc="Blocking suspicious activities" color="status-safe" />
            <Feature icon={<AlertTriangle size={20} />} title="Vulnerability Scanner" desc="Last scan completed successfully" color="status-warning" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.map((event, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 border-l-4 rounded ${
                  event.type === "warning"
                    ? "border-status-warning bg-status-warning/10"
                    : "border-status-safe bg-status-safe/10"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {event.type === "warning" ? (
                    <ShieldAlert className="text-status-warning" />
                  ) : (
                    <ShieldCheck className="text-status-safe" />
                  )}
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{event.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Small reusable UI pieces
const MetricCard = ({ icon, label, value, color }: any) => (
  <div className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-muted/40">
    <div className={`h-12 w-12 rounded-full bg-${color}/20 flex items-center justify-center text-${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const Feature = ({ icon, title, desc, color }: any) => (
  <div className="flex items-start space-x-4">
    <div className={`h-10 w-10 rounded-full bg-${color}/20 flex items-center justify-center text-${color} shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  </div>
);
