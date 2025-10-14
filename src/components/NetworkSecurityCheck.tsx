import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, ShieldAlert, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecurityItem {
  id: number;
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

  // Run scan automatically once on mount
  useEffect(() => {
    if (securityItems.length === 0) runSecurityScan();
  }, []);

  // Recalculate security score when results change
  useEffect(() => {
    if (securityItems.length > 0) {
      const totalItems = securityItems.length;
      const secureItems = securityItems.filter(i => i.status === "secure").length;
      const warningItems = securityItems.filter(i => i.status === "warning").length;
      const score = Math.round(((secureItems + warningItems * 0.5) / totalItems) * 100);
      setSecurityScore(score);
    }
  }, [securityItems]);

  // ✅ Replace mock data with backend request
  const runSecurityScan = async () => {
    setIsScanning(true);
    setSecurityItems([]); // clear old results

    try {
      const response = await fetch("http://localhost:5000/api/security/scan");
      if (!response.ok) throw new Error("Failed to run security scan");

      const data = await response.json();
      setSecurityItems(data.items || []); // expect backend to return { items: [...] }
      setLastScan(new Date());

      toast({
        title: "Security scan completed",
        description: `Your network security score: ${securityScore}/100`,
      });
    } catch (err: any) {
      toast({
        title: "Scan failed",
        description: err.message || "Unable to reach backend",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Color by score
  const getScoreColor = () => {
    if (securityScore >= 80) return "text-status-safe";
    if (securityScore >= 50) return "text-status-warning";
    return "text-status-danger";
  };

  // Icons by status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "secure":
        return <Check className="h-5 w-5 text-status-safe" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-status-warning" />;
      case "critical":
        return <ShieldAlert className="h-5 w-5 text-status-danger" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Network Security</CardTitle>
            <CardDescription>
              {lastScan
                ? `Last scan: ${lastScan.toLocaleString()}`
                : "Scan your network for vulnerabilities"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={runSecurityScan}
            disabled={isScanning}
          >
            <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
            {isScanning ? "Scanning..." : "Run Scan"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {securityScore > 0 && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between items-center">
              <span>Security Score</span>
              <span className={`font-bold text-lg ${getScoreColor()}`}>
                {securityScore}/100
              </span>
            </div>
            <Progress
              value={securityScore}
              max={100}
              className={`h-2 ${
                securityScore >= 80
                  ? "bg-status-safe/30"
                  : securityScore >= 50
                  ? "bg-status-warning/30"
                  : "bg-status-danger/30"
              }`}
            />
          </div>
        )}

        <div className="space-y-4">
          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-16 w-16 rounded-full bg-shield-accent/20 flex items-center justify-center text-shield-accent animate-pulse mb-4">
                <Shield size={32} />
              </div>
              <p className="text-lg font-medium">Scanning your network...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          ) : securityItems.length > 0 ? (
            securityItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                  <div className="space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.details}</p>
                    {item.status !== "secure" && (
                      <p className="text-sm font-medium mt-1">
                        Recommendation: {item.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p>No security data available. Run a scan to check your network.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
