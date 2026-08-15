import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import VisibilityIcon from '@mui/icons-material/Visibility';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ProcessRefundModal from './ProcessRefundModal';
import { refundService } from '../../services/refundService';
import { useNotification } from '../../hooks/useNotification';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const formatTranslatedReason = (reason, t) => {
  if (!reason) return '';
  const r = String(reason);

  if (r.includes('cancellation and prorated refund')) {
    return t('admin.refunds.reasons.cancellation_prorated', { defaultValue: r });
  }
  if (r.includes('unused service days')) {
    return t('admin.refunds.reasons.unused_days', { defaultValue: r });
  }
  if (r.includes('Refund Credit')) {
    return t('admin.refunds.reasons.credit_default', { defaultValue: r });
  }

  return r;
};

const RefundsPage = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const data = await refundService.getAll();
      setRefunds(Array.isArray(data) ? data : []);
    } catch {
      showNotification('Failed to fetch refunds list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleProcessRefund = async (data) => {
    try {
      await refundService.processRefund(data);
      showNotification('Refund processed successfully', 'success');
      fetchRefunds();
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch (error) {
      const errorMsg = error?.response?.data?.detail || 'Failed to process refund';
      showNotification(errorMsg, 'error');
    }
  };

  const columns = [
    {
      id: 'id',
      label: t('admin.refunds.col_refund_id', 'Refund ID'),
      render: (row) => (
        <Typography fontWeight={700} color="#0284c7">
          #{row.id}
        </Typography>
      ),
    },
    {
      id: 'invoice_number',
      label: t('admin.refunds.col_invoice', 'Invoice #'),
      render: (row) => (
        <Typography fontWeight={700} color="#0284c7">
          {row.invoice_number || `INV #${row.invoice_id}`}
        </Typography>
      ),
    },
    {
      id: 'customer_name',
      label: t('admin.refunds.col_customer', 'Customer'),
      render: (row) => (
        <Box>
          <Typography fontWeight={700} color="#0f172a">
            {row.customer_name || row.customerName || `Customer #${row.customer_id}`}
          </Typography>
          {row.customer_email && (
            <Typography variant="caption" color="#64748b" display="block">
              {row.customer_email}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'amount',
      label: t('admin.refunds.col_amount', 'Amount Refunded'),
      render: (row) => (
        <Typography fontWeight={800} color="#16a34a">
          {formatCurrency(row.amount)}
        </Typography>
      ),
    },
    {
      id: 'reason',
      label: t('admin.refunds.col_reason', 'Reason'),
      render: (row) => (
        <Typography variant="body2" color="#334155" fontWeight={600}>
          {formatTranslatedReason(row.reason, t)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: t('admin.refunds.col_status', 'Status'),
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'created_at',
      label: t('admin.refunds.col_date', 'Refund Date'),
      render: (row) => formatDateTime(row.created_at),
    },
    {
      id: 'actions',
      label: t('admin.refunds.col_actions', 'Actions'),
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title={t('admin.refunds.tooltip_view_details', 'View Refund Details')}>
            <IconButton
              size="small"
              onClick={() => {
                setSelectedRefund(row);
                setDetailsOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" sx={{ color: '#0284c7' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a" gutterBottom>
            {t('nav.refunds', 'Customer Refund Adjustments')}
          </Typography>
          <Typography variant="body2" color="#64748b" fontWeight={600}>
            {t('admin.refunds.subtitle', 'Process partial or full customer refunds, recorded as negative line items against invoices.')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<MoneyOffIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ py: 1.2, px: 2.5, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
        >
          {t('admin.refunds.process_button', 'Process Refund')}
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={refunds}
        loading={loading}
        emptyTitle={t('admin.refunds.empty_title', 'No refunds found.')}
        emptyDescription={t('admin.refunds.empty_desc', 'There are currently no refund records in your database.')}
        filterField="status"
        filterOptions={[
          { label: t('status.completed', 'Completed'), value: 'completed' },
          { label: t('status.pending', 'Pending'), value: 'pending' },
          { label: t('status.failed', 'Failed'), value: 'failed' },
        ]}
        filterLabel={t('admin.refunds.filter_label', 'Refund Status')}
      />

      <ProcessRefundModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleProcessRefund}
      />

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t('admin.refunds.drawer_title', 'Refund Audit Record')}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRefund && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748b">
                  {t('admin.refunds.col_refund_id', 'Refund ID')}
                </Typography>
                <Typography variant="body1" fontWeight={700}>#{selectedRefund.id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748b">
                  {t('admin.refunds.col_status', 'Status')}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusBadge status={selectedRefund.status} />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="#64748b">
                  {t('admin.refunds.customer_id', 'Customer ID')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>#{selectedRefund.customer_id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748b">
                  {t('admin.refunds.target_invoice_id', 'Target Invoice ID')}
                </Typography>
                <Typography variant="body1">#{selectedRefund.invoice_id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748b">
                  {t('admin.refunds.amount', 'Amount')}
                </Typography>
                <Typography variant="h6" fontWeight={800} color="#16a34a">{formatCurrency(selectedRefund.amount)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="#64748b">
                  {t('admin.refunds.reason', 'Reason')}
                </Typography>
                <Typography variant="body2">{formatTranslatedReason(selectedRefund.reason, t)}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailsOpen(false)} variant="contained" sx={{ bgcolor: '#0284c7' }}>
            {t('admin.refunds.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RefundsPage;
