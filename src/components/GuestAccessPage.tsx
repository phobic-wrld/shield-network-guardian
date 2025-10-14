import { DashboardLayout } from "@/components/DashboardLayout";
import { SmartGuestAccessRealtime } from "@/components/SmartGuestAccessEnhanced"; // <- update this

const GuestAccessPage = () => {
  return (
    <DashboardLayout>
      <SmartGuestAccessRealtime />
    </DashboardLayout>
  );
};

export default GuestAccessPage;
