import React from 'react';
import { Box, Typography, Grid, Button, Paper } from '@mui/material';
import CustomModal from '../../components/common/CustomModal';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

const PaymentDetailsModal = ({ open, onClose, payment }) => {
  if (!payment) return null;

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Payment Gateway Transaction Record"
      actions={
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      }
    >
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
          <Typography variant="body1" fontWeight={700} color="primary">{payment.transaction_id}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Status</Typography>
          <Box sx={{ mt: 0.5 }}>
            <StatusBadge status={payment.payment_status} />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Subscription ID</Typography>
          <Typography variant="body1" fontWeight={600}>#{payment.subscription_id}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Linked Invoice FK</Typography>
          <Typography variant="body1" fontWeight={700} color="success.main">
            {payment.invoice_number || (payment.invoice_id ? `INV-${payment.invoice_id}` : 'Auto-Linked via Sub FK')}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Amount Charged</Typography>
          <Typography variant="h6" fontWeight={800} color="text.primary">{formatCurrency(payment.amount)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Payment Method</Typography>
          <Typography variant="body1" fontWeight={600}>{payment.payment_method}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Gateway Engine</Typography>
          <Typography variant="body1">{payment.gateway_name || 'MockGateway'}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mt: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              GATEWAY WEBHOOK RESPONSE MESSAGE
            </Typography>
            <Typography variant="body2" fontFamily="monospace" color={payment.payment_status === 'failed' ? 'error.main' : 'success.main'}>
              {payment.remarks || payment.response_message || '200 OK - Charge Succeeded'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </CustomModal>
  );
};

export default PaymentDetailsModal;
