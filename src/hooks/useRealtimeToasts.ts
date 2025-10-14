import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/websocket/wsClient"; // your websocket client setup

export const useRealtimeToasts = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log("Initializing real-time notifications for user:", user.email);

    const socket = getSocket();

    if (!socket) {
      console.error("WebSocket not initialized");
      return;
    }

    // Welcome toast
    const welcomeTimeout = setTimeout(() => {
      toast.success("Shield Network Guardian Active", {
        description: `Welcome back, ${user.email?.split("@")[0] || "User"}! Monitoring your network...`,
        duration: 4000,
      });
    }, 1000);

    // Device events
    socket.on("device:connected", (device: any) => {
      toast.success("New device connected", {
        description: `${device.name} (${device.type}) has joined your network`,
        duration: 5000,
      });
    });

    socket.on("device:disconnected", (device: any) => {
      toast.warning("Device disconnected", {
        description: `${device.name} is now offline`,
        duration: 5000,
      });
    });

    // Security events
    socket.on("security:event", (event: any) => {
      const variant = event.severity === "high" ? "destructive" : "info";
      toast(event.severity === "high" ? "Security Alert!" : "Security Update", {
        description: event.description,
        duration: 6000,
      });
    });

    // Network periodic status
    socket.on("network:status", (status: any) => {
      toast.info("Network Status", {
        description: `Download: ${status.downloadSpeed.toFixed(1)} Mbps | Upload: ${status.uploadSpeed.toFixed(1)} Mbps | Ping: ${status.ping.toFixed(0)} ms`,
        duration: 4000,
      });
    });

    // Cleanup on unmount
    return () => {
      clearTimeout(welcomeTimeout);
      socket.off("device:connected");
      socket.off("device:disconnected");
      socket.off("security:event");
      socket.off("network:status");
      console.log("Real-time toasts cleaned up");
    };
  }, [user]);
};
