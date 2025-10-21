
import { useState } from "react";
import  DashboardLayout  from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

const SettingsPage = () => {
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const { settings, loading, updateSettings } = useProfile();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSettingChange = async (key: string, value: boolean) => {
    setIsUpdating(true);
    const success = await updateSettings({ [key]: value });
    if (success) {
      toast({
        title: "Setting Updated",
        description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} has been ${value ? 'enabled' : 'disabled'}`,
      });
    }
    setIsUpdating(false);
  };

  const handleSaveSettings = async () => {
    setIsUpdating(true);
    const piIpInput = document.getElementById('pi-ip') as HTMLInputElement;
    const scanIntervalInput = document.getElementById('scan-interval') as HTMLInputElement;
    
    const updates = {
      pi_ip_address: piIpInput?.value || null,
      scan_interval: parseInt(scanIntervalInput?.value || '30'),
    };

    const success = await updateSettings(updates);
    if (success) {
      toast({
        title: "Settings Saved",
        description: "Your configuration has been saved successfully.",
      });
    }
    setIsUpdating(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Configure your network preferences and account settings
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card className={isPremium ? "premium-card" : "basic-card"}>
            <CardHeader>
              <CardTitle className="text-foreground">Network Settings</CardTitle>
              <CardDescription>
                Configure your network monitoring preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="real-time" className="text-foreground">Real-time Monitoring</Label>
                <Switch 
                  id="real-time" 
                  checked={settings?.real_time_monitoring || false}
                  onCheckedChange={(checked) => handleSettingChange('real_time_monitoring', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-foreground">Push Notifications</Label>
                <Switch 
                  id="notifications" 
                  checked={settings?.push_notifications || false}
                  onCheckedChange={(checked) => handleSettingChange('push_notifications', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scan" className="text-foreground">Auto Device Scanning</Label>
                <Switch 
                  id="auto-scan" 
                  checked={settings?.auto_device_scanning || false}
                  onCheckedChange={(checked) => handleSettingChange('auto_device_scanning', checked)}
                  disabled={isUpdating}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Raspberry Pi Configuration</CardTitle>
              <CardDescription>
                Configure your Raspberry Pi connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pi-ip" className="text-foreground">Default Raspberry Pi IP</Label>
                <Input 
                  id="pi-ip" 
                  placeholder="192.168.1.100" 
                  defaultValue={settings?.pi_ip_address || ""}
                  className="text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scan-interval" className="text-foreground">Scan Interval (seconds)</Label>
                <Input 
                  id="scan-interval" 
                  type="number" 
                  placeholder="30" 
                  defaultValue={settings?.scan_interval?.toString() || "30"}
                  className="text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          <Card className={isPremium ? "premium-card" : "basic-card"}>
            <CardHeader>
              <CardTitle className="text-foreground">Security Settings</CardTitle>
              <CardDescription>
                Configure security monitoring and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="intrusion-detection" className="text-foreground">Intrusion Detection</Label>
                <Switch 
                  id="intrusion-detection" 
                  checked={settings?.intrusion_detection || false}
                  onCheckedChange={(checked) => handleSettingChange('intrusion_detection', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="device-alerts" className="text-foreground">New Device Alerts</Label>
                <Switch 
                  id="device-alerts" 
                  checked={settings?.device_alerts || false}
                  onCheckedChange={(checked) => handleSettingChange('device_alerts', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="security-alerts" className="text-foreground">Security Alerts</Label>
                <Switch 
                  id="security-alerts" 
                  checked={settings?.security_alerts || false}
                  onCheckedChange={(checked) => handleSettingChange('security_alerts', checked)}
                  disabled={isUpdating}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              className={isPremium ? "premium-button" : "basic-button"}
              onClick={handleSaveSettings}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
