import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

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

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
