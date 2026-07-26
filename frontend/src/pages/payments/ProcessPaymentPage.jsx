import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  MenuItem,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import FormInput from '../../components/common/FormInput';
import { PAYMENT_METHODS } from '../../constants/statusTypes';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const ProcessPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();

  const [invoices, setInvoices] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const prefilledSubId = location.state?.subscription_id || 101;
  const prefilledAmount = location.state?.amount || 9438.82;

  const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      subscription_id: prefilledSubId,
      amount: prefilledAmount,
      payment_method: 'Credit Card',
    },
  });

  useEffect(() => {
    invoiceService.getAll().then(setInvoices);
  }, []);

  const handleFormSubmit = async (data) => {
    setSubmitting(true);
    setPaymentResult(null);
    try {
      const result = await paymentService.processPayment(data);
      setPaymentResult(result);
      if (result.payment_status === 'success' || result.payment_status === 'SUCCESS') {
        showNotification('Payment processed successfully!', 'success');
      } else {
        showNotification('Payment gateway transaction failed', 'error');
      }
    } catch {
      showNotification('Failed to execute payment API endpoint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/payments')}
        sx={{ mb: 3, textTransform: 'none' }}
      >
        Back to Payment Log
      </Button>

      <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
        Mock Payment Gateway Processing (Module 2)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Triggers POST /payments/process and receives PaymentProcessResponse payload.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Transaction Parameters
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormInput
                name="subscription_id"
                control={control}
                label="Target Subscription ID"
                type="number"
                rules={{ required: 'Subscription ID is required' }}
              />

              <FormInput
                name="amount"
                control={control}
                label="Amount to Charge (₹)"
                type="number"
                rules={{ required: 'Amount is required', min: { value: 1, message: 'Amount must be greater than 0' } }}
              />

              <FormInput name="payment_method" control={control} label="Payment Instrument" select>
                {PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </FormInput>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                startIcon={<CreditCardIcon />}
                disabled={submitting}
                sx={{ mt: 3, py: 1.5 }}
              >
                {submitting ? 'Executing POST /payments/process...' : 'Process Payment Now'}
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Gateway Response Payload
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {!paymentResult ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <CreditCardIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Submit form to trigger FastAPI backend mock gateway response.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Alert
                  severity={paymentResult.payment_status === 'success' || paymentResult.payment_status === 'SUCCESS' ? 'success' : 'error'}
                  icon={paymentResult.payment_status === 'success' || paymentResult.payment_status === 'SUCCESS' ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  Transaction {String(paymentResult.payment_status).toUpperCase()}
                </Alert>

                <Box sx={{ py: 1 }}>
                  <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="primary">{paymentResult.transaction_id}</Typography>
                </Box>

                <Box sx={{ py: 1 }}>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body2">{formatDateTime(paymentResult.payment_timestamp || paymentResult.payment_date)}</Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    RAW API RESPONSE MESSAGE
                  </Typography>
                  <Typography variant="caption" fontFamily="monospace" display="block">
                    {paymentResult.response_message || paymentResult.remarks}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProcessPaymentPage;
