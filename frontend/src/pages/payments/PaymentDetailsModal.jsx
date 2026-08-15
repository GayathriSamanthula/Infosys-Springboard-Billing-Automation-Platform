import React from 'react';
import { Box, Typography, Grid, Button, Paper } from '@mui/material';
import CustomModal from '../../components/common/CustomModal';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const PaymentDetailsModal = ({ open, onClose, payment }) => {
  const { t } = useTranslation();
  if (!payment) return null;

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={t('admin.payments.details_modal_title', 'Payment Gateway Transaction Record')}
      actions={
        <Button onClick={onClose} variant="contained">
          {t('admin.payments.details_close', 'Close')}
        </Button>
      }
    >
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">{t('admin.payments.col_txn_id', 'Transaction ID')}</Typography>
          <Typography variant="body1" fontWeight={700} color="primary">{payment.transaction_id}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">{t('admin.payments.details_status', 'Status')}</Typography>
          <Box sx={{ mt: 0.5 }}>
            <StatusBadge status={payment.payment_status} />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">{t('admin.payments.modal_sub_id', 'Subscription ID')}</Typography>
          <Typography variant="body1" fontWeight={600}>#{payment.subscription_id}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">{t('admin.payments.details_linked_invoice', 'Linked Invoice FK')}</Typography>
          <Typography variant="body1" fontWeight={700} color="success.main">
            {payment.invoice_number || (payment.invoice_id ? `INV-${payment.invoice_id}` : t('admin.payments.details_auto_linked', 'Auto-Linked via Sub FK'))}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">{t('admin.payments.details_amount_charged', 'Amount Charged')}</Typography>
          <Typography variant="h6" fontWeight={800} color="text.primary">{formatCurrency(payment.amount)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">{t('admin.payments.col_method', 'Payment Method')}</Typography>
          <Typography variant="body1" fontWeight={600}>{payment.payment_method}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">{t('admin.payments.details_gateway_engine', 'Gateway Engine')}</Typography>
          <Typography variant="body1">{payment.gateway_name || 'MockGateway'}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mt: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              {t('admin.payments.details_webhook_msg', 'GATEWAY WEBHOOK RESPONSE MESSAGE')}
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
