import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketOptions {
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number; // milliseconds between reconnect attempts
}

export const useWebSocket = (url: string, options: WebSocketOptions = {}) => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (socketRef.current) socketRef.current.close();

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ Connected to WebSocket:", url);
      setIsConnected(true);
      options.onOpen?.();

      // Heartbeat ping every 30s
      heartbeatRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        options.onMessage?.(data);
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket connection closed:", url);
      setIsConnected(false);
      options.onClose?.();

      // Attempt to reconnect after delay
      if (options.reconnectInterval !== 0) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("🔄 Reconnecting to WebSocket...");
          connect();
        }, options.reconnectInterval || 5000);
      }
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      socket.close();
    };
  }, [url, options]);

  useEffect(() => {
    connect();
    return () => {
      console.log("🧹 Cleaning up WebSocket connection...");
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [connect]);

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ WebSocket is not open, message not sent:", data);
    }
  }, []);

  return { sendMessage, isConnected };
};
