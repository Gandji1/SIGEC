import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTenantStore } from './stores/tenantStore';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import AdaptiveDashboard from './pages/AdaptiveDashboard';
import DashboardCompletePage from './pages/DashboardCompletePage';
import PurchasesPage from './pages/PurchasesPage';
import TransfersPage from './pages/TransfersPage';
import SalesPage from './pages/SalesPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import TenantManagementPage from './pages/TenantManagementPage';
import TenantConfigurationPage from './pages/TenantConfigurationPage';
import PaymentConfigurationPage from './pages/PaymentConfigurationPage';
import ExpenseTrackingPage from './pages/ExpenseTrackingPage';
import UsersManagementPage from './pages/UsersManagementPage';
import CollaboratorsPage from './pages/CollaboratorsPage';
import SettingsPage from './pages/SettingsPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import ExpensesPage from './pages/ExpensesPage';
import AccountingPage from './pages/AccountingPage';
import ManagerDashboard from './pages/ManagerDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import DebugPage from './pages/DebugPage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { token } = useTenantStore();
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/debug" element={<DebugPage />} />

        {/* Private Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AdaptiveDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <PrivateRoute>
              <PurchasesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/transfers"
          element={
            <PrivateRoute>
              <TransfersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <PrivateRoute>
              <SalesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <PrivateRoute>
              <POSPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <ProductsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <InventoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <ReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chart-of-accounts"
          element={
            <PrivateRoute>
              <ChartOfAccountsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenant-management"
          element={
            <PrivateRoute>
              <TenantManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenant-configuration"
          element={
            <PrivateRoute>
              <TenantConfigurationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment-configuration"
          element={
            <PrivateRoute>
              <PaymentConfigurationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/expense-tracking"
          element={
            <PrivateRoute>
              <ExpenseTrackingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/users-management"
          element={
            <PrivateRoute>
              <UsersManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UsersManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/collaborators"
          element={
            <PrivateRoute>
              <CollaboratorsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <PrivateRoute>
              <SuppliersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <PrivateRoute>
              <CustomersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <PrivateRoute>
              <ExpensesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/accounting"
          element={
            <PrivateRoute>
              <AccountingPage />
            </PrivateRoute>
          }
        />

        {/* Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

