
import { ConnectedDeviceList } from "@/components/ConnectedDeviceList";
import { DashboardLayout } from "@/components/DashboardLayout";

const DevicesPage = () => {
  return (
    <DashboardLayout>
      <ConnectedDeviceList />
    </DashboardLayout>
  );
};

export default DevicesPage;
