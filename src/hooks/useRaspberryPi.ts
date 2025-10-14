import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useNetworkStats } from "@/hooks/useNetworkStats";

interface RaspberryPiStatus {
  connected: boolean;
  ipAddress: string | null;
  latency: number | null;
}

interface NetworkData {
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
}

declare global {
  interface Window {
    raspberryPiWebSocket: WebSocket | null;
  }
}

// Load URLs from .env
const RASPBERRY_HEALTH_URL = import.meta.env.VITE_API_URL + '/health';
const RASPBERRY_WS_URL = import.meta.env.VITE_WS_URL;

export const useRaspberryPi = () => {
  const [status, setStatus] = useState<RaspberryPiStatus>({
    connected: false,
    ipAddress: null,
    latency: null
  });
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const { updateStats } = useNetworkStats();

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectToDevice = async () => {
    try {
      // ✅ Check if Raspberry Pi is online
      const response = await fetch(RASPBERRY_HEALTH_URL);
      if (!response.ok) throw new Error('Device not reachable');

      // ✅ Establish WebSocket connection
      const ws = new WebSocket(RASPBERRY_WS_URL);
      wsRef.current = ws;
      window.raspberryPiWebSocket = ws;

      ws.onopen = () => {
        setStatus({
          connected: true,
          ipAddress: import.meta.env.VITE_API_URL,
          latency: 0
        });

        toast({
          title: "✅ Connected to Raspberry Pi",
          description: `Connected to ${import.meta.env.VITE_API_URL}`
        });

        // Immediately request device scan on connection
        ws.send('scandevices');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Update latency display
          if (data.latency) {
            setStatus(prev => ({
              ...prev,
              latency: data.latency
            }));
          }

          // Speed test results
          if (data.downloadSpeed && data.uploadSpeed && data.ping) {
            updateStats();

            toast({
              title: "🚀 Speed Test Complete",
              description: `Download: ${data.downloadSpeed.toFixed(1)} Mbps, Upload: ${data.uploadSpeed.toFixed(1)} Mbps`
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "❌ Connection Error",
          description: "Error communicating with Raspberry Pi",
          variant: "destructive"
        });
      };

      ws.onclose = () => {
        setStatus({
          connected: false,
          ipAddress: null,
          latency: null
        });

        toast({
          title: "🔌 Disconnected",
          description: "Connection to Raspberry Pi closed"
        });

        window.raspberryPiWebSocket = null;
      };
    } catch (error) {
      toast({
        title: "❌ Connection Failed",
        description: "Could not connect to Raspberry Pi. Check IP and try again.",
        variant: "destructive"
      });
    }
  };

  const disconnectDevice = () => {
    if (wsRef.current) wsRef.current.close();
    setStatus({
      connected: false,
      ipAddress: null,
      latency: null
    });
    window.raspberryPiWebSocket = null;

    toast({
      title: "🔌 Disconnected",
      description: "Successfully disconnected from Raspberry Pi"
    });
  };

  const requestSpeedTest = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('speedtest');
      toast({
        title: "⚡ Speed Test Started",
        description: "Running speed test on Raspberry Pi..."
      });
      return true;
    }
    return false;
  };

  const scanDevices = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('scandevices');
      toast({
        title: "📡 Scanning Devices",
        description: "Scanning your network for devices..."
      });
      return true;
    }
    return false;
  };

  return {
    status,
    connectToDevice,
    disconnectDevice,
    requestSpeedTest,
    scanDevices
  };
};
