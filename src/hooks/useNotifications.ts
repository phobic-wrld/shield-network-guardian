import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "@/services/notificationService"; 
import { ws } from "@/services/websocketService"; // your backend WebSocket instance

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  actionPath?: string;
  actionRequired?: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  // 🧩 Fetch initial notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      if (Array.isArray(res.notifications)) {
        setNotifications(
          res.notifications.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  // 🧠 Listen for WebSocket real-time updates from your backend
  useEffect(() => {
    if (!ws) return;

    const handleNewNotification = (msg: any) => {
      if (msg.type === "NEW_NOTIFICATION") {
        const newNotif: Notification = {
          ...msg.data,
          id: msg.data.id || Date.now().toString(),
          timestamp: new Date(msg.data.timestamp || Date.now()),
          read: false,
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    };

    ws.on("message", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handleNewNotification(data);
      } catch (err) {
        console.error("Invalid WebSocket notification message:", err);
      }
    });

    return () => {
      ws.off?.("message", handleNewNotification);
    };
  }, []);

  // 🔢 Derived data
  const unreadCount = notifications.filter(n => !n.read).length;

  // 🔄 Mark a single notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  // ✅ Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 🖱️ Handle user clicking a notification
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  // ❌ Remove a specific notification
  const removeNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  };

  // ➕ Add a new one manually (UI-triggered)
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
    removeNotification,
    addNotification
  };
};
