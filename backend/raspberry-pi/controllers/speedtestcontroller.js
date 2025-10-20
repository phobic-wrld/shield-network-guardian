// controllers/speedtestController.js
import { exec } from "child_process";

export const runSpeedTest = (req, res) => {
  exec("speedtest --format=json", (error, stdout, stderr) => {
    if (error) {
      console.error("⚠️ Speedtest error:", error);
      return res.status(500).json({ message: "Failed to run speed test" });
    }

    try {
      const result = JSON.parse(stdout);
      const speedData = {
        timestamp: new Date().toISOString(),
        ping: result.ping.latency, // ms
        download: (result.download.bandwidth * 8) / 1e6, // Bytes/s → Mbps
        upload: (result.upload.bandwidth * 8) / 1e6,
        isp: result.isp,
        server: result.server.name,
      };
      res.json(speedData);
    } catch (parseError) {
      console.error("⚠️ Parse error:", parseError);
      res.status(500).json({ message: "Failed to parse speed test result" });
    }
  });
};
