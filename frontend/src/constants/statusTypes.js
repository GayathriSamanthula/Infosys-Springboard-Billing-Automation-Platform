export const SUBSCRIPTION_STATUS = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
};

export const INVOICE_STATUS = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
  REFUNDED: 'REFUNDED',
};

export const PAYMENT_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
};

export const PAYMENT_METHODS = [
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'UPI / GPay', value: 'UPI' },
  { label: 'Net Banking', value: 'Net Banking' },
  { label: 'Direct Debit', value: 'Direct Debit' },
];

export const BILLING_INTERVALS = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Yearly (Annual)', value: 'YEARLY' },
];
