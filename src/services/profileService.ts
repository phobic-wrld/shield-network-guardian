// src/services/profileService.ts

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  username: string | null;
}

export interface UserSettings {
  id: string;
  real_time_monitoring: boolean;
  push_notifications: boolean;
  auto_device_scanning: boolean;
  intrusion_detection: boolean;
  device_alerts: boolean;
  security_alerts: boolean;
  pi_ip_address: string | null;
  scan_interval: number;
}

// Base URL of your backend API
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// --- Profile API ---
export async function getProfile(): Promise<{ profile: Profile }> {
  const res = await fetch(`${API_BASE}/profile`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch profile");
  const data = await res.json();
  return { profile: data };
}

export async function updateProfileAPI(updates: Partial<Profile>): Promise<Profile> {
  const res = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

// --- User Settings API ---
export async function getUserSettings(): Promise<{ settings: UserSettings }> {
  const res = await fetch(`${API_BASE}/settings`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch user settings");
  const data = await res.json();
  return { settings: data };
}

export async function updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update user settings");
  return res.json();
}
