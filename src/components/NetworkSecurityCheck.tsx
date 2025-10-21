import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, ShieldAlert, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecurityItem {
  id: string;
  name: string;
  status: "secure" | "warning" | "critical";
  details: string;
  recommendation: string;
}

export const NetworkSecurityCheck = () => {
  const [securityItems, setSecurityItems] = useState<SecurityItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [securityScore, setSecurityScore] = useState(0);
  const { toast } = useToast();

  const BACKEND_URL = "http://192.168.4.1:3000/network";

  // Recalculate security score
  useEffect(() => {
    if (securityItems.length > 0) {
      const totalItems = securityItems.length;
      const secureItems = securityItems.filter(i => i.status === "secure").length;
      const warningItems = securityItems.filter(i => i.status === "warning").length;
      const score = Math.round(((secureItems + warningItems * 0.5) / totalItems) * 100);
      setSecurityScore(score);
    }
  }, [securityItems]);

  const runSecurityScan = async () => {
    setIsScanning(true);
    setSecurityItems([]);
    try {
      const res = await fetch(`${BACKEND_URL}/scan`);
      if (!res.ok) throw new Error(`Scan failed with status ${res.status}`);

      const data = await res.json();

      // Convert backend devices/alerts to SecurityItem array
      const items: SecurityItem[] = (data.devices || []).map((dev: any, idx: number) => ({
        id: dev.mac || idx.toString(),
        name: `Device ${dev.ip}`,
        status: data.latest?.alerts?.some((a: any) => a.message.includes(dev.ip)) ? "warning" : "secure",
        details: `IP: ${dev.ip}, MAC: ${dev.mac}`,
        recommendation: "Monitor this device for suspicious activity",
      }));

      setSecurityItems(items);
      setLastScan(new Date());

      toast({
        title: "Security scan completed",
        description: `Network security score: ${securityScore}/100`,
      });
    } catch (err: any) {
      console.error("Error running security scan:", err);
      toast({
        title: "Scan failed",
        description: err.message || "Unable to reach backend",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getScoreColor = () => {
    if (securityScore >= 80) return "text-status-safe";
    if (securityScore >= 50) return "text-status-warning";
    return "text-status-danger";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "secure": return <Check className="h-5 w-5 text-status-safe" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-status-warning" />;
      case "critical": return <ShieldAlert className="h-5 w-5 text-status-danger" />;
      default: return null;
    }
  };

  // Auto-run scan once on mount
  useEffect(() => {
    if (securityItems.length === 0) runSecurityScan();
  }, []);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl font-bold">Network Security</CardTitle>
          <p className="text-sm text-muted-foreground">
            {lastScan ? `Last scan: ${lastScan.toLocaleString()}` : "Scan your network for vulnerabilities"}
          </p>
        </div>
        <Button onClick={runSecurityScan} variant="outline" size="sm" disabled={isScanning}>
          <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
          {isScanning ? "Scanning..." : "Run Scan"}
        </Button>
      </CardHeader>

      <CardContent>
        {securityScore > 0 && (
          <div className="mb-4">
            <div className="flex justify-between">
              <span>Security Score</span>
              <span className={`font-bold ${getScoreColor()}`}>{securityScore}/100</span>
            </div>
            <Progress
              value={securityScore}
              max={100}
              className={`h-2 ${
                securityScore >= 80 ? "bg-status-safe/30" :
                securityScore >= 50 ? "bg-status-warning/30" :
                "bg-status-danger/30"
              }`}
            />
          </div>
        )}

        <div className="space-y-4">
          {isScanning ? (
            <p>Scanning your network...</p>
          ) : securityItems.length > 0 ? (
            securityItems.map(item => (
              <div key={item.id} className="border rounded-lg p-4 flex items-start gap-3">
                {getStatusIcon(item.status)}
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.details}</p>
                  {item.status !== "secure" && <p className="text-sm font-medium mt-1">Recommendation: {item.recommendation}</p>}
                </div>
              </div>
            ))
          ) : (
            <p>No security data available. Run a scan to check your network.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
