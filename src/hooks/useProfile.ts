import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getProfile,
  updateProfileAPI,
  getUserSettings,
  updateUserSettings,
} from "@/services/profileService";

// ----- Types -----
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

// ----- Hook -----
export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch profile and settings
  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Explicitly type the results
      const [profileRes, settingsRes]: [{ profile: Profile }, { settings: UserSettings }] =
        await Promise.all([getProfile(), getUserSettings()]);

      setProfile(profileRes.profile ?? null);
      setSettings(settingsRes.settings ?? null);

    } catch (error) {
      console.error("Error fetching profile or settings:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfileData = async (updates: Partial<Profile>): Promise<boolean> => {
    try {
      const updatedProfile = await updateProfileAPI(updates);
      setProfile(updatedProfile);
      toast.success("Profile updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      return false;
    }
  };

  // Update settings
  const updateSettingsData = async (updates: Partial<UserSettings>): Promise<boolean> => {
    try {
      const updatedSettings = await updateUserSettings(updates);
      setSettings(updatedSettings);
      toast.success("Settings updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
      return false;
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    settings,
    loading,
    updateProfile: updateProfileData,
    updateSettings: updateSettingsData,
    refetch: fetchProfile,
  };
};
