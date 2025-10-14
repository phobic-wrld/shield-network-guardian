import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { getDevices, createDevice } from '@/services/apiService';

interface ScannedDevice {
  _id?: string;
  name: string;
  ip: string;
  mac: string;
  vendor?: string;
  type: string;
  status?: string;
  lastSeen?: string;
}

export const useNetworkScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const { toast } = useToast();

  const performNetworkScan = useCallback(async () => {
    try {
      setIsScanning(true);
      setScannedDevices([]);
      setScanProgress(10);

      const res = await getDevices();
      setScanProgress(70);

      if (res?.devices) {
        setScannedDevices(res.devices);

        // Optionally store devices in backend
        // await Promise.all(res.devices.map(d => createDevice(d)));

        toast({
          title: 'Network scan complete',
          description: `${res.devices.length} devices detected on your network`,
        });
      }

      setScanProgress(100);
    } catch (err) {
      console.error('Network scan failed:', err);
      toast({
        title: 'Scan failed',
        description: 'Unable to connect to backend',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  useEffect(() => {
    performNetworkScan();
  }, [performNetworkScan]);

  const startManualScan = () => performNetworkScan();

  return { isScanning, scannedDevices, scanProgress, startManualScan };
};
