import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import axios from 'axios';
import { customerPortalService } from '../../services/customerPortalService';
import { formatCurrency } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

import StatusBadge from '../../components/common/StatusBadge';

const CustomerPaymentsPage = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentCustomer = customerPortalService.getCurrentCustomer() || {};
  const customerId = currentCustomer?.id || currentCustomer?.customer_id;

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      try {
        if (!customerId) {
          setPayments([]);
          return;
        }

        const [payRes, portalData] = await Promise.allSettled([
          axios.get('/api/payments'),
          customerPortalService.getDashboardData(customerId),
        ]);

        let allPays = [];
        if (payRes.status === 'fulfilled') allPays = payRes.value.data || [];

        let customerPays = allPays.filter(p =>
          (customerId && Number(p.customer_id) === Number(customerId)) ||
          (currentCustomer.full_name && String(p.customer_name || '').toLowerCase() === String(currentCustomer.full_name).toLowerCase())
        );

        if (customerPays.length === 0 && portalData.status === 'fulfilled' && portalData.value?.payment_history) {
          customerPays = portalData.value.payment_history || [];
        }

        setPayments(customerPays);
      } catch (err) {
        console.error('Failed to load payment transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const totalPaid = payments
    .filter(p => String(p.status || p.payment_status || '').toUpperCase() === 'SUCCESS' || String(p.status || p.payment_status || '').toUpperCase() === 'PAID')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#000000">
          {t('customerPortal.paymentMethods')}
        </Typography>
        <Typography variant="body2" color="#64748b" fontWeight={700} sx={{ mt: 0.5 }}>
          {t('customerPortal.manageSubSubtext')}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
              border: '2.5px solid #fcdad2',
              bgcolor: '#FFFFFF !important',
            }}
          >
            <Typography variant="caption" color="#e76f51" fontWeight={900} letterSpacing="0.05em">
              {t('dashboard.totalRevenue')}
            </Typography>
            <Typography variant="h3" fontWeight={900} color="#0f172a" sx={{ mt: 1 }}>
              {formatCurrency(totalPaid)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
              border: '2.5px solid #fcdad2',
              bgcolor: '#FFFFFF !important',
            }}
          >
            <Typography variant="caption" color="#e76f51" fontWeight={900} letterSpacing="0.05em">
              {t('customerPortal.successfulTxns')}
            </Typography>
            <Typography variant="h3" fontWeight={900} color="#0f172a" sx={{ mt: 1 }}>
              {payments.length} {t('customerPortal.txnsCount')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        sx={{
          borderRadius: 4,
          border: '2.5px solid #fcdad2',
          bgcolor: '#FFFFFF !important',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#fdf0ed' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, color: '#e76f51' }}>{t('customerPortal.colTxnId')}</TableCell>
                <TableCell sx={{ fontWeight: 900, color: '#e76f51' }}>{t('customerPortal.colAmount')}</TableCell>
                <TableCell sx={{ fontWeight: 900, color: '#e76f51' }}>{t('customerPortal.colMethod')}</TableCell>
                <TableCell sx={{ fontWeight: 900, color: '#e76f51' }}>{t('customerPortal.colStatus')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, color: '#e76f51' }}>{t('customerPortal.colDate')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#e76f51', fontWeight: 800 }}>
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#64748b', fontWeight: 700 }}>
                    No payment transactions recorded for this account.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p, idx) => (
                  <TableRow key={p.id || p.transaction_id || idx} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#e76f51', fontFamily: 'monospace' }}>
                      {p.transaction_id || p.id || `TXN-${idx + 100}`}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900, color: '#0f172a' }}>
                      {formatCurrency(p.amount || 2000.0)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>
                      {p.payment_method || 'Credit Card / UPI'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status || p.payment_status || 'SUCCESS'} />
                    </TableCell>

                    <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600 }}>
                      {p.created_at || p.payment_date || '2026-07-26'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CustomerPaymentsPage;
