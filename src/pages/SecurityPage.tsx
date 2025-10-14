
import { DashboardLayout } from "@/components/DashboardLayout";
import { NetworkSecurityCheck } from "@/components/NetworkSecurityCheck";
import { SecurityAlerts } from "@/components/SecurityAlerts";

const SecurityPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security</h1>
          <p className="text-muted-foreground">
            Monitor and protect your network security
          </p>
        </div>
        
        <div className="grid gap-6">
          <NetworkSecurityCheck />
          <SecurityAlerts />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SecurityPage;
