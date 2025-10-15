import { useEffect, useState } from "react";
import { runSpeedTestAPI, SpeedTestResult } from "@/services/networkService";

export default function NetworkStatusChecker() {
  const [speedData, setSpeedData] = useState<SpeedTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    try {
      setLoading(true);
      const result = await runSpeedTestAPI();
      setSpeedData(result);
    } catch (error) {
      console.error("❌ Failed to run speed test:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
    const interval = setInterval(runTest, 60000); // auto refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
        Network Speed Test
      </h2>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Testing...</p>
      ) : speedData ? (
        <div className="space-y-2 text-gray-800 dark:text-gray-100">
          <p>📥 <strong>Download:</strong> {speedData.download.toFixed(2)} Mbps</p>
          <p>📤 <strong>Upload:</strong> {speedData.upload.toFixed(2)} Mbps</p>
          <p>📶 <strong>Ping:</strong> {speedData.ping.toFixed(2)} ms</p>
          <p>🌐 <strong>Connection:</strong> {speedData.connectionStrength}</p>
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-300">No data yet</p>
      )}

      <button
        onClick={runTest}
        disabled={loading}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
      >
        {loading ? "Running..." : "Run Speed Test"}
      </button>
    </div>
  );
}
