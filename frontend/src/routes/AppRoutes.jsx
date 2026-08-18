import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute, { VeloraAdminProtectedRoute, VeloraCustomerProtectedRoute, CustomerProtectedRoute } from './ProtectedRoute';

import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import CustomersPage from '../pages/customers/CustomersPage';
import PlansPage from '../pages/plans/PlansPage';
import SubscriptionsPage from '../pages/subscriptions/SubscriptionsPage';
import ChangePlanPage from '../pages/subscriptions/ChangePlanPage';
import BillingCyclesPage from '../pages/billing-cycles/BillingCyclesPage';
import InvoicesPage from '../pages/invoices/InvoicesPage';
import InvoiceDetailsPage from '../pages/invoices/InvoiceDetailsPage';
import PaymentsPage from '../pages/payments/PaymentsPage';
import ProcessPaymentPage from '../pages/payments/ProcessPaymentPage';
import RefundsPage from '../pages/refunds/RefundsPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import AuditLogsPage from '../pages/audit/AuditLogsPage';
import TaxReportsPage from '../pages/tax/TaxReportsPage';

// Customer Portal & Velora Imports
import LandingPage from '../pages/landing/LandingPage';
import CustomerLayout from '../components/layout/CustomerLayout';
import CustomerDashboardPage from '../pages/customer-portal/CustomerDashboardPage';
import NexoraCustomerPage from '../pages/customer-portal/NexoraCustomerPage';
import CustomerLoginPage from '../pages/customer-portal/CustomerLoginPage';
import CustomerRegisterPage from '../pages/customer-portal/CustomerRegisterPage';
import CustomerPlansPage from '../pages/customer-portal/CustomerPlansPage';
import CustomerSubscriptionsPage from '../pages/customer-portal/CustomerSubscriptionsPage';
import CustomerInvoicesPage from '../pages/customer-portal/CustomerInvoicesPage';
import CustomerPaymentsPage from '../pages/customer-portal/CustomerPaymentsPage';
import CustomerProfilePage from '../pages/customer-portal/CustomerProfilePage';
import CustomerSettingsPage from '../pages/customer-portal/CustomerSettingsPage';
import AdminRegisterPage from '../pages/auth/AdminRegisterPage';
import VeloraLandingPage from '../pages/velora/VeloraLandingPage';
import VeloraAdminPage from '../pages/velora/VeloraAdminPage';
import VeloraCustomerPage from '../pages/velora/VeloraCustomerPage';
import VeloraCustomerLoginPage from '../pages/velora/VeloraCustomerLoginPage';
import VeloraCustomerRegisterPage from '../pages/velora/VeloraCustomerRegisterPage';
import VeloraAdminLoginPage from '../pages/velora/VeloraAdminLoginPage';
import VeloraAdminRegisterPage from '../pages/velora/VeloraAdminRegisterPage';
import VeloraAdminIntegrationPage from '../pages/velora/VeloraAdminIntegrationPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Unified Gateway Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/velora" element={<VeloraLandingPage />} />
      <Route path="/velora/customer/login" element={<VeloraCustomerLoginPage />} />
      <Route path="/velora/customer/register" element={<VeloraCustomerRegisterPage />} />
      <Route path="/velora/admin/login" element={<VeloraAdminLoginPage />} />
      <Route path="/velora/admin/register" element={<VeloraAdminRegisterPage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<AdminRegisterPage />} />
      </Route>

      {/* Velora Protected Routes */}
      <Route element={<VeloraAdminProtectedRoute />}>
        <Route path="/velora/admin" element={<VeloraAdminPage />} />
      </Route>
      <Route element={<VeloraCustomerProtectedRoute />}>
        <Route path="/velora/customer" element={<VeloraCustomerPage />} />
      </Route>

      {/* Customer Portal Auth Routes */}
      <Route path="/customer/login" element={<CustomerLoginPage />} />
      <Route path="/customer/register" element={<CustomerRegisterPage />} />

      {/* Nexora Customer Portal Protected Routes */}
      <Route element={<CustomerProtectedRoute />}>
        <Route
          path="/customer"
          element={
            <CustomerLayout>
              <CustomerDashboardPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/customer/dashboard"
          element={
            <CustomerLayout>
              <CustomerDashboardPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/customer/plans"
          element={
            <CustomerLayout>
              <CustomerPlansPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/customer/subscriptions"
          element={
            <CustomerLayout>
              <CustomerSubscriptionsPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/customer/invoices"
          element={
            <CustomerLayout>
              <CustomerInvoicesPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/customer/payments"
          element={
            <CustomerLayout>
              <CustomerPaymentsPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/customer/profile"
          element={
            <CustomerLayout>
              <CustomerProfilePage />
            </CustomerLayout>
          }
        />
        <Route
          path="/customer/settings"
          element={
            <CustomerLayout>
              <CustomerSettingsPage />
            </CustomerLayout>
          }
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/subscriptions/change-plan/:id" element={<ChangePlanPage />} />
          <Route path="/billing-cycles" element={<BillingCyclesPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/payments/process" element={<ProcessPaymentPage />} />
          <Route path="/refunds" element={<RefundsPage />} />
          <Route path="/tax-reports" element={<TaxReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/velora-integration" element={<VeloraAdminIntegrationPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
