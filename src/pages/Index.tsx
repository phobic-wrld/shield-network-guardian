
import { DashboardLayout } from "@/components/DashboardLayout";
import { RealtimeActivityFeed } from "@/components/RealtimeActivityFeed";
import { DownloadsManager } from "@/components/DownloadsManager";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { PlanDashboard } from "@/components/PlanDashboard";
import { useSubscription } from "@/contexts/SubscriptionContext";

const Index = () => {
  const { isPremium, planType } = useSubscription();
  
  // Simulate device count and usage data based on plan type
  const getDeviceCount = () => {
    switch (planType) {
      case 'home': return 12;
      case 'school': return 250;
      case 'work': return 89;
      default: return 12;
    }
  };
  
  const deviceCount = getDeviceCount();
  const usage = "high" as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PlanDashboard />
        
        {!isPremium && (
          <UpgradePrompt 
            deviceCount={deviceCount}
            usage={usage}
            currentPlan={planType}
          />
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <RealtimeActivityFeed />
          </div>
          
          <div className="xl:col-span-1">
            <DownloadsManager />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
