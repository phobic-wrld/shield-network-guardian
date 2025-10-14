import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { useSpeedTest } from "@/hooks/useSpeedTest";

const WS_URL = "ws://localhost:8080"; // change later to your backend WebSocket endpoint

export const SpeedTestSummary: React.FC = () => {
  const { data, isConnected } = useSpeedTest(WS_URL);

  if (!data) {
    return (
      <Card className="mb-4 shadow-sm">
        <CardContent className="py-6 text-center text-muted-foreground">
          <Zap className="mx-auto mb-2 text-blue-500" size={28} />
          <p className="font-medium">No speed test data yet...</p>
          <p className="text-xs mt-1">
            {isConnected ? "Waiting for updates..." : "Disconnected"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { download, upload, ping, lastUpdate } = data;
  const formattedTime = new Date(lastUpdate).toLocaleTimeString();

  // Conditional ping color
  const pingColor =
    ping < 50 ? "text-green-500" : ping < 100 ? "text-yellow-500" : "text-red-500";

  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="py-4">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="text-blue-500" size={20} />
          <span className="font-semibold text-sm sm:text-base">
            Latest Speed Test
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {formattedTime}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-bold text-lg">{download.toFixed(1)} Mbps</div>
            <div className="text-xs text-muted-foreground">Download</div>
          </div>
          <div>
            <div className="font-bold text-lg">{upload.toFixed(1)} Mbps</div>
            <div className="text-xs text-muted-foreground">Upload</div>
          </div>
          <div>
            <div className={`font-bold text-lg ${pingColor}`}>{ping.toFixed(0)} ms</div>
            <div className="text-xs text-muted-foreground">Ping</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
