import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function NetworkSecurityCheck() {
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSecurityScan = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://192.168.4.1:3000/api/network/scan");
      if (!res.ok) throw new Error(`Scan failed with status ${res.status}`);

      const data = await res.json();
      setScanResults(data.devices || []);
    } catch (err: any) {
      console.error("Error running scan:", err);
      setError("Failed to run security scan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck className="text-blue-500" />
          Network Security Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runSecurityScan} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" /> Scanning...
            </>
          ) : (
            "Run Security Scan"
          )}
        </Button>

        {error && <p className="text-red-500 mt-3">{error}</p>}

        {!loading && scanResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {scanResults.map((device, index) => (
              <div
                key={index}
                className="flex justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-lg"
              >
                <span>{device.name || "Unknown Device"}</span>
                <span className="text-sm text-gray-500">
                  {device.ip || "N/A"}
                </span>
              </div>
            ))}
          </div>
        )}

        {!loading && scanResults.length === 0 && !error && (
          <p className="text-gray-500 mt-3">
            No recent scan results available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
