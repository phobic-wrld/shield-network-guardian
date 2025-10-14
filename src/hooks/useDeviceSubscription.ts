import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket } from "@/websocket/wsClient"; // Your socket client

export const useDeviceSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.error("WebSocket not initialized");
      return;
    }

    // Device connected
    socket.on("device:connected", (device: any) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success("New device detected", {
        description: `${device.name} (${device.type}) has connected to your network`,
        duration: 5000,
      });
    });

    // Device disconnected
    socket.on("device:disconnected", (device: any) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.warning("Device disconnected", {
        description: `${device.name} is now offline`,
        duration: 5000,
      });
    });

    // Device reconnected
    socket.on("device:reconnected", (device: any) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success("Device reconnected", {
        description: `${device.name} is back online`,
        duration: 5000,
      });
    });

    // Cleanup on unmount
    return () => {
      socket.off("device:connected");
      socket.off("device:disconnected");
      socket.off("device:reconnected");
      console.log("Device subscription cleaned up");
    };
  }, [queryClient]);
};
