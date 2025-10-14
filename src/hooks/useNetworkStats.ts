import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchNetworkStats, runSpeedTestAPI } from '@/services/networkService';

interface NetworkStats {
  download: number;
  upload: number;
  ping: number;
  connectionStrength: string;
  timestamp: string;
}

export const useNetworkStats = () => {
  const [stats, setStats] = useState<NetworkStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const { toast } = useToast();

  // ✅ Fetch saved stats from backend (latest readings)
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNetworkStats();
      setStats(data || []);
    } catch (err) {
      console.error('❌ Error fetching network stats:', err);
      toast({
        title: 'Failed to load network stats',
        description: 'Please check your connection to the backend.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 🆕 Trigger live speed test
  const runSpeedTest = useCallback(async () => {
    try {
      setIsTestingSpeed(true);
      const result = await runSpeedTestAPI();

      setStats((prev) => [
        ...prev.slice(-19),
        {
          download: result.download,
          upload: result.upload,
          ping: result.ping,
          connectionStrength: result.connectionStrength,
          timestamp: new Date().toISOString(),
        },
      ]);

      toast({
        title: 'Speed test complete',
        description: `Download: ${result.download} Mbps | Upload: ${result.upload} Mbps | Ping: ${result.ping} ms`,
      });
    } catch (err) {
      console.error('❌ Error running speed test:', err);
      toast({
        title: 'Speed test failed',
        description: 'Please try again or check your backend.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingSpeed(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, isTestingSpeed, runSpeedTest };
};
