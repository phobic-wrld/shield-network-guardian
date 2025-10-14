import { useState, useEffect } from "react";
import { logSignInEvent } from "@/services/authService";
import { api } from "@/services/apiClient"; // <-- A helper to make fetch calls
import { useWebSocket } from "@/hooks/useWebSocket";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const { socket } = useWebSocket(); // optional: connect auth updates via WebSocket

  const fetchUserProfile = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        clearAuthState();
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (token: string, user: User) => {
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
    setIsNewUser(true);

    logSignInEvent(user.id);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      clearAuthState();
    }
  };

  const clearAuthState = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsNewUser(false);
  };

  useEffect(() => {
    fetchUserProfile();

    // Optional: listen for "session_expired" or "user_updated" events from WebSocket
    if (socket) {
      socket.on("session_expired", clearAuthState);
      socket.on("user_updated", (updatedUser: User) => setUser(updatedUser));
    }

    return () => {
      if (socket) {
        socket.off("session_expired");
        socket.off("user_updated");
      }
    };
  }, [token, socket]);

  return {
    user,
    token,
    isLoading,
    isNewUser,
    handleLogin,
    handleLogout,
    setIsNewUser,
    clearAuthState,
  };
};
