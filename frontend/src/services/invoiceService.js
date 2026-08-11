import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const invoiceService = {
  getAll: async () => {
    try {
      const response = await api.get(ENDPOINTS.INVOICES);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('GET /invoices failed or offline', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await api.get(ENDPOINTS.INVOICE_BY_ID(id));
    return response.data;
  },

  getByCustomer: async (customerId) => {
    try {
      const response = await api.get(ENDPOINTS.INVOICES_BY_CUSTOMER(customerId));
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  getLineItems: async (id) => {
    const response = await api.get(`${ENDPOINTS.INVOICE_BY_ID(id)}/line-items`);
    return Array.isArray(response.data) ? response.data : [];
  },

  generateItemizedInvoice: async (subscriptionId, options = {}) => {
    const response = await api.post(ENDPOINTS.GENERATE_INVOICE, null, {
      params: {
        subscription_id: Number(subscriptionId),
        proration_credit: options.proration_credit || 0.0,
        proration_debit: options.proration_debit || 0.0,
        tax_rate: options.tax_rate || 0.18,
        remarks: options.remarks || 'Billing Cycle Itemized Invoice',
        previous_plan_name: options.previous_plan_name || undefined,
        previous_plan_price: options.previous_plan_price || 0.0,
        remaining_days: options.remaining_days || 10,
        total_cycle_days: options.total_cycle_days || 30,
      },
    });
    return response.data;
  },

  downloadHtmlUrl: (id, platform = 'NEXORA') => {
    return `/api/invoices/${id}/download?platform=${platform}`;
  },

  downloadPdfUrl: (id, platform = 'NEXORA') => {
    return `/api/invoices/${id}/pdf?platform=${platform}`;
  },

  previewPdfUrl: (id, platform = 'NEXORA') => {
    return `/api/invoices/${id}/preview?platform=${platform}`;
  },
};
