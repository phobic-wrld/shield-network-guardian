import PulseBoost from "@/components/PulseBoost";
import NetworkSecurityCheck from "@/components/NetworkSecurityCheck";
import DashboardLayout from "@/components/DashboardLayout";
import SecurityAlerts from "@/components/SecurityAlerts";

const PulsePage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PulseBoost />
        <SecurityAlerts />
        <NetworkSecurityCheck />
      </div>
    </DashboardLayout>
  );
};

export default PulsePage;
