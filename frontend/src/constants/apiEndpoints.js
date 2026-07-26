export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',

  // Customers
  CUSTOMERS: '/customers/',
  CUSTOMER_BY_ID: (id) => `/customers/${id}`,

  // Plans
  PLANS: '/plans/',
  PLAN_BY_ID: (id) => `/plans/${id}`,
  ARCHIVE_PLAN: (id) => `/plans/${id}/archive`,

  // Subscriptions
  SUBSCRIPTIONS: '/subscriptions/',
  SUBSCRIPTION_BY_ID: (id) => `/subscriptions/${id}`,
  PAUSE_SUBSCRIPTION: (id) => `/subscriptions/${id}/pause`,
  RESUME_SUBSCRIPTION: (id) => `/subscriptions/${id}/resume`,
  CANCEL_SUBSCRIPTION: (id) => `/subscriptions/${id}/cancel`,

  // Proration (Module 2 Engine)
  PRORATION_CALCULATE: '/proration/calculate',

  // Invoices (Module 2)
  INVOICES: '/invoices/',
  INVOICE_BY_ID: (id) => `/invoices/${id}`,
  GENERATE_INVOICE: '/invoices/generate-itemized',

  // Payments (Module 2)
  PAYMENTS: '/payments/',
  PAYMENT_BY_ID: (id) => `/payments/${id}`,
  PROCESS_PAYMENT: '/payments/process',

  // Refunds (Module 2)
  REFUNDS: '/refunds/history',
  PROCESS_REFUND: '/refunds/process',

  // Notifications & Audit Logs
  NOTIFICATIONS: '/notifications/',
  AUDIT_LOGS: '/audit-logs/',
};
