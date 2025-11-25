import { useTenantStore } from '../stores/tenantStore';
import DashboardCompletePage from './DashboardCompletePage';
import ManagerDashboard from './ManagerDashboard';
import AccountantDashboard from './AccountantDashboard';

/**
 * Dashboard intelligent qui affiche le bon dashboard selon le rôle
 */
export default function AdaptiveDashboard() {
  const { user } = useTenantStore();

  // Determine which dashboard to show based on role
  switch (user?.role) {
    case 'manager':
      return <ManagerDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'owner':
    case 'super_admin':
    default:
      return <DashboardCompletePage />;
  }
}
