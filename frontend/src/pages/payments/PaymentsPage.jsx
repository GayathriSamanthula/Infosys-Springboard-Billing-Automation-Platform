import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { useNavigate } from 'react-router-dom';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import PaymentDetailsModal from './PaymentDetailsModal';
import { paymentService } from '../../services/paymentService';
import { useNotification } from '../../hooks/useNotification';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

const PaymentsPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Process Payment Modal State
  const [processOpen, setProcessOpen] = useState(false);
  const [subId, setSubId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [processing, setProcessing] = useState(false);

  // Selected payment modal details
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getAll();
      setPayments(data);
    } catch {
      showNotification('Failed to fetch payment transaction log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleProcessPayment = async () => {
    setProcessing(true);
    try {
      const payload = {
        subscription_id: parseInt(subId, 10),
        amount: parseFloat(amount),
        payment_method: paymentMethod,
      };
      if (invoiceId) {
        payload.invoice_id = parseInt(invoiceId, 10);
      }
      const res = await paymentService.processPayment(payload);

      const isSuccess =
        res &&
        (String(res.payment_status).toUpperCase() === 'SUCCESS' ||
          String(res.status).toUpperCase() === 'SUCCESS' ||
          String(res.payment_status).toUpperCase() === 'PAID');

      if (isSuccess) {
        showNotification(`Payment processed successfully! Transaction ID: ${res.transaction_id}`, 'success');
        setProcessOpen(false);
        fetchPayments();
        window.dispatchEvent(new CustomEvent('dashboard_refresh'));
      } else {
        showNotification(`Payment gateway transaction failed: ${res.response_message || res.remarks || 'Gateway error'}`, 'error');
      }
    } catch {
      showNotification('Payment processing failed or gateway error', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Metric summaries
  const totalVolume = payments.reduce((acc, p) => acc + (p.payment_status === 'SUCCESS' ? p.amount : 0), 0);
  const successRate = payments.length > 0
    ? Math.round((payments.filter(p => p.payment_status === 'SUCCESS').length / payments.length) * 100)
    : 100;

  const columns = [
    {
      id: 'transaction_id',
      label: 'Transaction ID',
      render: (row) => (
        <Typography fontWeight={700} color="#0284c7">
          {row.transaction_id || `TXN-${row.id}`}
        </Typography>
      ),
    },
    {
      id: 'customer_name',
      label: 'Customer & Customer ID',
      render: (row) => {
        const custId = row.customer_id || (row.subscription_id ? row.subscription_id : 1);
        return (
          <Box>
            <Typography fontWeight={700} color="#0f172a">
              {row.customer_name || row.customerName || `Customer #${custId}`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
              <Chip
                size="small"
                label={`Customer ID: #${custId}`}
                onClick={() => navigate(`/customers?id=${custId}`)}
                sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 800, cursor: 'pointer', fontSize: '0.72rem' }}
              />
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'subscription_id',
      label: 'Sub ID',
      render: (row) => `#${row.subscription_id}`,
    },
    {
      id: 'invoice_number',
      label: 'Linked Invoice',
      render: (row) => {
        const invNum = row.invoice_number || (row.invoice_id ? `INV-${row.invoice_id}` : null);
        const invId = row.invoice_id;
        return invNum ? (
          <Chip
            size="small"
            label={invNum}
            onClick={() => navigate(invId ? `/invoices/${invId}` : '/invoices')}
            sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 800, cursor: 'pointer', fontSize: '0.72rem' }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">Auto-Linked</Typography>
        );
      },
    },
    {
      id: 'amount',
      label: 'Amount',
      render: (row) => (
        <Typography fontWeight={800} color="#0f172a">
          {formatCurrency(row.amount)}
        </Typography>
      ),
    },
    {
      id: 'payment_status',
      label: 'Gateway Status',
      render: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      id: 'payment_method',
      label: 'Payment Method',
      render: (row) => row.payment_method || 'Credit Card',
    },
    {
      id: 'payment_date',
      label: 'Timestamp',
      render: (row) => formatDateTime(row.payment_date),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const custId = row.customer_id || 1;
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title="Inspect Customer (Method A)">
              <IconButton size="small" onClick={() => navigate(`/customers?id=${custId}`)}>
                <PersonSearchIcon fontSize="small" sx={{ color: '#0284c7' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Gateway Log">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedPayment(row);
                  setDetailsOpen(true);
                }}
              >
                <VisibilityIcon fontSize="small" sx={{ color: '#0284c7' }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      {/* Header & Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" fontWeight={900} color="#0f172a">
              Payment Gateway & Transactions
            </Typography>
            <Chip
              icon={<CheckCircleIcon style={{ color: '#16a34a' }} />}
              label="Mock Gateway Connected (100% Operational)"
              size="small"
              sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.75rem' }}
            />
          </Box>
          <Typography variant="body2" color="#0284c7" fontWeight={600}>
            Execute charges, review gateway transaction history, and inspect authorization logs.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CreditCardIcon />}
          onClick={() => setProcessOpen(true)}
          sx={{ py: 1.2, px: 2.5, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800 }}
        >
          Process Payment
        </Button>
      </Box>

      {/* Payment Dashboard Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ p: 1, border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#e0f2fe', color: '#0284c7' }}>
                <AccountBalanceWalletIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="#64748b" fontWeight={700}>
                  Total Settled Volume
                </Typography>
                <Typography variant="h5" fontWeight={900} color="#0f172a">
                  {formatCurrency(totalVolume)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ p: 1, border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#dcfce7', color: '#16a34a' }}>
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="#64748b" fontWeight={700}>
                  Gateway Success Rate
                </Typography>
                <Typography variant="h5" fontWeight={900} color="#0f172a">
                  {successRate}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ p: 1, border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f1f5f9', color: '#475569' }}>
                <ReceiptLongIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="#64748b" fontWeight={700}>
                  Total Gateway Transactions
                </Typography>
                <Typography variant="h5" fontWeight={900} color="#0f172a">
                  {payments.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transactions Data Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyTitle="No payment transactions found."
        emptyDescription="There are currently no payment records in your database."
        filterField="payment_status"
        filterOptions={[
          { label: 'Success', value: 'success' },
          { label: 'Failed', value: 'failed' },
          { label: 'Pending', value: 'pending' },
        ]}
        filterLabel="Payment Status"
      />

      {/* Process Payment Form Modal */}
      <Dialog open={processOpen} onClose={() => setProcessOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Process Payment Execution</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Subscription ID"
            fullWidth
            type="number"
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
          />
          <TextField
            label="Charge Amount ($)"
            fullWidth
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <TextField
            select
            label="Payment Method"
            fullWidth
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <MenuItem value="Credit Card">Credit Card</MenuItem>
            <MenuItem value="Bank Transfer">Bank Transfer (ACH)</MenuItem>
            <MenuItem value="Debit Card">Debit Card</MenuItem>
            <MenuItem value="PayPal">PayPal / Digital Wallet</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setProcessOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProcessPayment}
            disabled={processing}
            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
          >
            {processing ? 'Processing Charge...' : 'Execute Charge'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Details Modal */}
      <PaymentDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        payment={selectedPayment}
      />
    </Box>
  );
};

export default PaymentsPage;
