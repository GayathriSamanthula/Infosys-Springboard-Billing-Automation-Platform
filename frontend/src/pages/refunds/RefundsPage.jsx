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

const RefundsPage = () => {
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
      setRefunds(data);
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
      label: 'Refund ID',
      render: (row) => (
        <Typography fontWeight={700} color="#0284c7">
          #{row.id}
        </Typography>
      ),
    },
    {
      id: 'invoice_number',
      label: 'Invoice #',
      render: (row) => (
        <Typography fontWeight={700} color="#0284c7">
          {row.invoice_number || `INV #${row.invoice_id}`}
        </Typography>
      ),
    },
    {
      id: 'customer_name',
      label: 'Customer',
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
      label: 'Amount Refunded',
      render: (row) => (
        <Typography fontWeight={800} color="#16a34a">
          {formatCurrency(row.amount)}
        </Typography>
      ),
    },
    { id: 'reason', label: 'Reason' },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'created_at',
      label: 'Refund Date',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View Refund Details">
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
            Customer Refund Adjustments
          </Typography>
          <Typography variant="body2" color="#64748b" fontWeight={600}>
            Process partial or full customer refunds, recorded as negative line items against invoices.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<MoneyOffIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ py: 1.2, px: 2.5, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
        >
          Process Refund
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={refunds}
        loading={loading}
        emptyTitle="No refunds found."
        emptyDescription="There are currently no refund records in your database."
        filterField="status"
        filterOptions={[
          { label: 'Completed', value: 'completed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Failed', value: 'failed' },
        ]}
        filterLabel="Refund Status"
      />

      <ProcessRefundModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleProcessRefund}
      />

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Refund Audit Record</DialogTitle>
        <DialogContent dividers>
          {selectedRefund && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748b">Refund ID</Typography>
                <Typography variant="body1" fontWeight={700}>#{selectedRefund.id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748b">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusBadge status={selectedRefund.status} />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="#64748b">Customer ID</Typography>
                <Typography variant="body1" fontWeight={600}>#{selectedRefund.customer_id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748b">Target Invoice ID</Typography>
                <Typography variant="body1">#{selectedRefund.invoice_id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748b">Amount</Typography>
                <Typography variant="h6" fontWeight={800} color="#16a34a">{formatCurrency(selectedRefund.amount)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="#64748b">Reason</Typography>
                <Typography variant="body2">{selectedRefund.reason}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailsOpen(false)} variant="contained" sx={{ bgcolor: '#0284c7' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RefundsPage;
