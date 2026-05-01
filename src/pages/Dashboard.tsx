import { useAuth } from "@/lib/auth-context";
import UserDashboard from "@/components/dashboard/UserDashboard";
import HaulerDashboard from "@/components/dashboard/HaulerDashboard";
import AppLayout from "@/components/layout/AppLayout";

const Dashboard = () => {
  const { userRole } = useAuth();

  return (
    <AppLayout>
      {userRole === "hauler" ? <HaulerDashboard /> : <UserDashboard />}
    </AppLayout>
  );
};

export default Dashboard;
