import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Tooltip,
  IconButton,
  Alert,
  AlertTitle,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { customerPortalService } from '../../services/customerPortalService';
import { subscriptionService } from '../../services/subscriptionService';
import { invoiceService } from '../../services/invoiceService';
import { useNotification } from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { useTranslation } from 'react-i18next';

const CustomerDashboardPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Get active authenticated customer info safely
  const currentCustomer = customerPortalService.getCurrentCustomer() || {};
  const customerId = currentCustomer?.id || currentCustomer?.customer_id;

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      if (customerId) {
        const data = await customerPortalService.getDashboardData(customerId);
        setDashboardData(data);
      } else {
        setDashboardData(null);
      }
    } catch (err) {
      console.error('Failed to load customer portal data:', err);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSub = async () => {
    if (!activeSub?.id) return;
    try {
      await subscriptionService.pause(activeSub.id);
      showNotification('Subscription paused successfully. Automated billing is paused.', 'success');
      fetchCustomerData();
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch (err) {
      showNotification(String(err?.response?.data?.detail || 'Failed to pause subscription'), 'error');
    }
  };

  const handleResumeSub = async () => {
    if (!activeSub?.id) return;
    try {
      await subscriptionService.resume(activeSub.id);
      showNotification('Subscription resumed successfully. Active status restored.', 'success');
      fetchCustomerData();
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch (err) {
      showNotification(String(err?.response?.data?.detail || 'Failed to resume subscription'), 'error');
    }
  };

  const handleImmediateCancel = async () => {
    if (!activeSub?.id) return;
    setActionLoading(true);
    try {
      await subscriptionService.cancel(activeSub.id);
      showNotification('Subscription cancelled immediately. No further billing will occur.', 'success');
      setCancelDialogOpen(false);
      fetchCustomerData();
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch (err) {
      showNotification(String(err?.response?.data?.detail || 'Failed to cancel subscription'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePeriodEndCancel = async () => {
    if (!activeSub?.id) return;
    setActionLoading(true);
    try {
      await subscriptionService.cancelAtPeriodEnd(activeSub.id);
      showNotification('Subscription set to cancel automatically at the end of current billing cycle.', 'success');
      setCancelDialogOpen(false);
      fetchCustomerData();
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch (err) {
      showNotification(String(err?.response?.data?.detail || 'Failed to schedule cancellation'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="#d45d3f">Loading Customer Portal...</Typography>
      </Box>
    );
  }

  const customer = dashboardData?.customer || currentCustomer;
  const activeSub = dashboardData?.active_subscription;
  const invoices = dashboardData?.invoices || [];
  const summary = dashboardData?.summary || {};

  const isPastDue = String(activeSub?.status || '').toLowerCase() === 'past_due' || String(activeSub?.status || '').toLowerCase() === 'past due';

  const calculateRemainingGraceDays = (pastDueAtStr) => {
    if (!pastDueAtStr) return 11;
    const pastDueTime = new Date(pastDueAtStr).getTime();
    if (isNaN(pastDueTime)) return 11;
    const nowTime = new Date().getTime();
    const elapsedDays = Math.floor((nowTime - pastDueTime) / (1000 * 60 * 60 * 24));
    const totalGraceDays = 11;
    const remaining = totalGraceDays - elapsedDays;
    return remaining > 0 ? remaining : 0;
  };

  const remainingGraceDays = calculateRemainingGraceDays(activeSub?.past_due_at || activeSub?.updated_at);

  return (
    <Box sx={{ pb: 6 }}>
      {/* 0. Dunning Grace Period Alert Banner (Rendered when subscription is PAST_DUE) */}
      {isPastDue && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon fontSize="large" />}
          sx={{
            mb: 3,
            borderRadius: 3.5,
            bgcolor: '#FFF7ED',
            border: '2px solid #f97316',
            color: '#9a3412',
          }}
          action={
            <Button
              color="warning"
              variant="contained"
              size="small"
              startIcon={<CreditCardIcon />}
              onClick={() => navigate('/customer/invoices')}
              sx={{ fontWeight: 800, textTransform: 'none', bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, color: '#ffffff' }}
            >
              Pay Now
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 900, fontSize: '1rem' }}>
            Renewal Payment Due — Grace Period Active ({remainingGraceDays} Days Remaining)
          </AlertTitle>
          The renewal payment was due, but it has not yet been received. You retain full service access for {remainingGraceDays} more days while automated payment retries are scheduled (Attempt 1 on Day 1, Attempt 2 on Day 3, Attempt 3 on Day 7). You can also complete payment manually to reactivate your subscription.
        </Alert>
      )}

      {/* 1. Welcome & Active Plan Hero Banner: VIBRANT SKY BLUE PALETTE */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          mb: 4,
          borderRadius: 4,
          bgcolor: '#FFFFFF !important',
          border: '3px solid #e76f51',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Avatar sx={{ bgcolor: '#e76f51', color: '#ffffff', width: 52, height: 52, fontSize: '1.4rem', fontWeight: 900, border: '2px solid #e76f51' }}>
                {customer.full_name ? customer.full_name[0].toUpperCase() : 'C'}
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={900} color="#0f172a">
                  {t('customerPortal.welcomeUser')}, {customer.full_name || 'Customer'}!
                </Typography>
                <Typography variant="body2" color="#e76f51" fontWeight={800}>
                  Customer ID: #{customer.id || customerId || 'N/A'} • {customer.email || 'N/A'}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="#334155" fontWeight={600} sx={{ mt: 1 }}>
              {t('customerPortal.manageSubSubtext')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ bgcolor: '#fdf0ed !important', border: '2.5px solid #e76f51', borderRadius: 3, boxShadow: '0 4px 15px rgba(231, 111, 81, 0.3)' }}>
              <CardContent sx={{ p: '20px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e76f51', fontWeight: 900 }}>
                    {t('customerPortal.activePlanTier')}
                  </Typography>
                  {activeSub && <StatusBadge status={activeSub.status} />}
                </Box>
                <Typography variant="h5" fontWeight={900} color="#e76f51">
                  {activeSub ? (
                    (() => {
                      const pName = activeSub.plan_name || summary.active_plan_name || 'Basic Plan';
                      const n = String(pName).toLowerCase();
                      let pKey = '1';
                      if (n.includes('plus')) pKey = '3';
                      else if (n.includes('pro')) pKey = '4';
                      else if (n.includes('premium')) pKey = '2';
                      else if (activeSub.plan_id) pKey = String(activeSub.plan_id);
                      return t(`plans.${pKey}.name`, pName);
                    })()
                  ) : t('customerPortal.activePlan')}
                </Typography>


                <Typography variant="subtitle1" fontWeight={800} color="#0f172a" sx={{ my: 0.5 }}>
                  {activeSub ? `${formatCurrency(activeSub.price || activeSub.amount || 0)} / ${activeSub.billing_cycle || 'monthly'}` : 'No Active Subscription'}
                </Typography>
                {activeSub?.next_billing_date && (
                  <Typography variant="caption" color="#64748b" fontWeight={700} display="block">
                    {t('customerPortal.nextRenewal')}: {formatDate(activeSub.next_billing_date)}
                  </Typography>
                )}
                {activeSub && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SwapHorizIcon />}
                      onClick={() => navigate('/customer/plans')}
                      sx={{ bgcolor: '#e76f51', '&:hover': { bgcolor: '#d45d3f' }, textTransform: 'none', fontWeight: 900, color: '#ffffff' }}
                    >
                      {t('customerPortal.changePlan')}
                    </Button>
                    {(String(activeSub.status).toUpperCase() === 'ACTIVE' || String(activeSub.status).toUpperCase() === 'TRIAL') && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PauseCircleIcon />}
                        onClick={handlePauseSub}
                        sx={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 900, textTransform: 'none', '&:hover': { bgcolor: '#e0f2fe' } }}
                      >
                        {t('customerPortal.pause')}
                      </Button>
                    )}
                    {String(activeSub.status).toUpperCase() === 'PAUSED' && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayCircleIcon />}
                        onClick={handleResumeSub}
                        sx={{ bgcolor: '#10b981', color: '#ffffff', fontWeight: 900, textTransform: 'none', '&:hover': { bgcolor: '#059669' } }}
                      >
                        {t('customerPortal.resume')}
                      </Button>
                    )}
                    {String(activeSub.status).toUpperCase() !== 'CANCELLED' && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => setCancelDialogOpen(true)}
                        sx={{ fontWeight: 900, textTransform: 'none' }}
                      >
                        {t('customerPortal.cancelSub')}
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* 2. Customer Invoices Quick Table: SKY BLUE BRANDED TABLE */}
      <Paper sx={{ p: 3.5, borderRadius: 4, bgcolor: '#FFFFFF !important', border: '3px solid #e76f51', boxShadow: '0 10px 25px -5px rgba(231, 111, 81, 0.35)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(231, 111, 81, 0.2)', color: '#e76f51' }}>
              <ReceiptIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={900} color="#0f172a">
              {t('customerPortal.recentInvoices')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/customer/invoices')}
            sx={{ fontWeight: 800, bgcolor: '#e76f51', '&:hover': { bgcolor: '#d45d3f' }, color: '#ffffff' }}
          >
            {t('customerPortal.viewAllInvoices')}
          </Button>
        </Box>

        <Divider sx={{ my: 2, borderColor: '#fcdad2' }} />

        {invoices.length === 0 ? (
          <EmptyState title="No billing statements generated yet" message="Invoices will appear here once your subscription renews." />
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#fdf0ed' }}>
                <TableRow sx={{ borderBottom: '2px solid #f8b4a5' }}>
                  <TableCell sx={{ color: '#e76f51', fontWeight: 900 }}>{t('customerPortal.colRef')}</TableCell>
                  <TableCell sx={{ color: '#e76f51', fontWeight: 900 }}>{t('customerPortal.colDate')}</TableCell>
                  <TableCell sx={{ color: '#e76f51', fontWeight: 900 }}>{t('customerPortal.colAmount')}</TableCell>
                  <TableCell sx={{ color: '#e76f51', fontWeight: 900 }}>{t('customerPortal.colStatus')}</TableCell>
                  <TableCell align="right" sx={{ color: '#e76f51', fontWeight: 900 }}>{t('customerPortal.colActions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.slice(0, 5).map((inv) => (
                  <TableRow key={inv.id} sx={{ '&:hover': { bgcolor: 'rgba(231, 111, 81, 0.1)' } }}>
                    <TableCell sx={{ fontWeight: 800, color: '#e76f51', fontFamily: 'monospace' }}>
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                      {formatDate(inv.issue_date)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900, color: '#0f172a' }}>
                      {formatCurrency(inv.total_amount || inv.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Download Branded PDF Invoice (ReportLab)">
                        <IconButton
                          onClick={() => invoiceService.downloadPdfBlob(inv.id, inv.invoice_number, 'NEXORA')}
                          sx={{ bgcolor: '#fcdad2', color: '#e76f51', '&:hover': { bgcolor: '#f8b4a5', color: '#d45d3f' } }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* CUSTOMER CANCELLATION OPTIONS MODAL DIALOG */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: '#dc2626' }}>
          Cancel Active Subscription
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
            Are you sure you want to cancel your subscription for {activeSub ? (summary.active_plan_name || activeSub.plan_name || 'Active Plan') : 'your active plan'}?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Once cancelled, automated recurring billing for this plan will stop and no further invoices will be generated.
          </Alert>
          <Typography variant="subtitle2" fontWeight={800} color="#334155" sx={{ mb: 1 }}>
            Please select your preferred cancellation method:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: '#fca5a5', bgcolor: '#fef2f2' }}>
              <Typography variant="subtitle2" fontWeight={900} color="#dc2626">
                1. Immediate Cancellation
              </Typography>
              <Typography variant="caption" color="#475569" display="block">
                Terminates your subscription immediately today. Automated recurring billing stops right away.
              </Typography>
              <Button
                variant="contained"
                color="error"
                size="small"
                disabled={actionLoading}
                onClick={handleImmediateCancel}
                sx={{ mt: 1.5, fontWeight: 900, textTransform: 'none' }}
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Immediate Cancellation'}
              </Button>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: '#cbd5e1', bgcolor: '#f8fafc' }}>
              <Typography variant="subtitle2" fontWeight={900} color="#0f172a">
                2. Cancel at End of Billing Cycle
              </Typography>
              <Typography variant="caption" color="#475569" display="block">
                Keep full active access until your next renewal date ({activeSub?.next_billing_date ? formatDate(activeSub.next_billing_date) : 'end of current cycle'}), then automatically cancel without renewing.
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                disabled={actionLoading}
                onClick={handlePeriodEndCancel}
                sx={{ mt: 1.5, fontWeight: 900, textTransform: 'none', borderColor: '#475569', color: '#0f172a' }}
              >
                {actionLoading ? 'Scheduling...' : 'Cancel at Cycle End'}
              </Button>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)} color="inherit" sx={{ fontWeight: 800 }}>
            Keep My Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDashboardPage;
