
import { DashboardLayout } from "@/components/DashboardLayout";
import { LiveDeviceTracker } from "@/components/LiveDeviceTracker";
import { NetworkStatusChecker } from "@/components/NetworkStatusChecker";
import { InteractiveGuestAccess } from "@/components/InteractiveGuestAccess";
import { PasswordStrengthTool } from "@/components/PasswordStrengthTool";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Wifi, Users, Lock } from "lucide-react";

const InteractivePage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Interactive Features</h1>
          <p className="text-muted-foreground">
            Real-time network monitoring and management tools
          </p>
        </div>

        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Wifi size={16} />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Activity size={16} />
              <span className="hidden sm:inline">Network</span>
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex items-center gap-2">
              <Users size={16} />
              <span className="hidden sm:inline">Guests</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock size={16} />
              <span className="hidden sm:inline">Password</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <LiveDeviceTracker />
          </TabsContent>

          <TabsContent value="network">
            <NetworkStatusChecker />
          </TabsContent>

          <TabsContent value="guests">
            <InteractiveGuestAccess />
          </TabsContent>

          <TabsContent value="password">
            <PasswordStrengthTool />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InteractivePage;
