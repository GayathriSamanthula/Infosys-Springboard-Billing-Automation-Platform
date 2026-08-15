import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { useNavigate } from 'react-router-dom';
import { customerPortalService } from '../../services/customerPortalService';
import { subscriptionService } from '../../services/subscriptionService';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../../components/common/StatusBadge';

const CustomerSubscriptionsPage = () => {

  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const currentCustomer = customerPortalService.getCurrentCustomer() || {};
  const customerId = currentCustomer?.id || currentCustomer?.customer_id;

  const loadSub = async () => {
    setLoading(true);
    try {
      if (customerId) {
        const portalData = await customerPortalService.getDashboardData(customerId);
        setActiveSub(portalData?.active_subscription || null);
      } else {
        setActiveSub(null);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
      setActiveSub(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSub();
  }, [customerId]);

  const handleConfirmCancel = async () => {
    if (!activeSub?.id) return;
    setCancelling(true);
    try {
      await subscriptionService.cancel(activeSub.id);
      showNotification('Subscription cancelled & prorated refund processed successfully!', 'success');
      setCancelModalOpen(false);
      loadSub();
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch (err) {
      console.error('Cancellation failed:', err);
      showNotification('Failed to cancel subscription or process refund', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#000000">
          {t('customerPortal.mySubscriptions')}
        </Typography>
        <Typography variant="body2" color="#64748b" fontWeight={700} sx={{ mt: 0.5 }}>
          {t('customerPortal.manageSubSubtext')}
        </Typography>
      </Box>

      {loading ? (
        <Typography variant="body1" color="#e76f51">{t('common.loading')}</Typography>
      ) : !activeSub ? (
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: '#FFFFFF !important',
            border: '2px solid #fcdad2',
            textAlign: 'center',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <CardMembershipIcon sx={{ color: '#e76f51', fontSize: '3rem', mb: 1 }} />
          <Typography variant="h5" fontWeight={900} color="#0f172a" gutterBottom>
            No Active Subscription Found
          </Typography>
          <Typography variant="body1" color="#64748b" fontWeight={600} sx={{ mb: 3 }}>
            You do not currently have an active subscription plan linked to your account. Select an available plan below to subscribe.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/customer/plans')}
            sx={{ bgcolor: '#e76f51', '&:hover': { bgcolor: '#d45d3f' }, fontWeight: 800, borderRadius: 2.5 }}
          >
            Explore Available Plans
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3.5,
                borderRadius: 4,
                bgcolor: '#FFFFFF !important',
                border: '2px solid #fcdad2',
                boxShadow: '0 10px 25px -5px rgba(231, 111, 81, 0.15)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CardMembershipIcon sx={{ color: '#e76f51', fontSize: '2.2rem' }} />
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      {(() => {
                        const pName = activeSub?.plan_name || activeSub?.plan?.name || activeSub?.plan || 'Basic Plan';
                        const n = String(pName).toLowerCase();
                        let pKey = '1';
                        if (n.includes('plus')) pKey = '3';
                        else if (n.includes('pro')) pKey = '4';
                        else if (n.includes('premium')) pKey = '2';
                        else if (activeSub?.plan_id) pKey = String(activeSub.plan_id);
                        return t(`plans.${pKey}.name`, pName);
                      })()}
                    </Typography>
                    <Typography variant="caption" color="#e76f51" fontWeight={800}>
                      {t('customerPortal.activePlanTier')} • {t('customerPortal.monthlyCycle')}
                    </Typography>
                  </Box>
                </Box>
                <StatusBadge status={activeSub?.status || 'ACTIVE'} />
              </Box>

              <Divider sx={{ my: 2, borderColor: '#fcdad2' }} />

              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="#64748b" fontWeight={700} display="block">{t('customerPortal.recurringAmount', 'RECURRING AMOUNT')}</Typography>
                  <Typography variant="h6" fontWeight={900} color="#0f172a">
                    {formatCurrency(activeSub?.price || activeSub?.amount || activeSub?.plan?.price || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="#64748b" fontWeight={700} display="block">{t('customerPortal.nextRenewalDate', 'NEXT RENEWAL DATE')}</Typography>
                  <Typography variant="h6" fontWeight={900} color="#e76f51">
                    {activeSub?.next_billing_date ? formatDate(activeSub.next_billing_date) : (activeSub?.renewal_date ? formatDate(activeSub.renewal_date) : 'N/A')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="#64748b" fontWeight={700} display="block">{t('customerPortal.autoRenewal', 'AUTO-RENEWAL')}</Typography>
                  <Typography variant="h6" fontWeight={900} color="#16a34a">
                    {t('common.enabled', 'Enabled')}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<SyncAltIcon />}
                  onClick={() => navigate('/customer/plans')}
                  sx={{ bgcolor: '#e76f51', '&:hover': { bgcolor: '#d45d3f' }, fontWeight: 800, borderRadius: 2.5 }}
                >
                  {t('customerPortal.updatePlan', 'Upgrade / Change Plan')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setCancelModalOpen(true)}
                  sx={{ fontWeight: 800, borderRadius: 2.5, border: '2px solid #ef4444' }}
                >
                  {t('customerPortal.cancelSub', 'Cancel Subscription')}
                </Button>
              </Box>

              {/* Cancellation & Refund Confirmation Dialog */}
              <Dialog open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 900, color: '#991b1b' }}>Cancel Subscription & Request Refund</DialogTitle>
                <DialogContent>
                  <Typography variant="body2" color="#334155" sx={{ mb: 2 }}>
                    Are you sure you want to cancel your <strong>{activeSub?.plan_name || 'Active Plan'}</strong> subscription?
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 2, mb: 2 }}>
                    <Typography variant="caption" color="#991b1b" fontWeight={800} display="block">PRORATED REFUND SUMMARY</Typography>
                    {(() => {
                      const subPrice = Number(activeSub?.price || activeSub?.amount || activeSub?.plan?.price || 0.0);
                      const nextBilling = activeSub?.next_billing_date ? new Date(activeSub.next_billing_date) : new Date(Date.now() + 15 * 86400000);
                      const remainingDays = Math.max(0, Math.ceil((nextBilling - new Date()) / (1000 * 60 * 60 * 24)));
                      const totalDays = String(activeSub?.billing_cycle).toUpperCase() === 'YEARLY' ? 365 : 30;
                      const dynamicRefundPreview = Math.max(0, Number(((subPrice * remainingDays) / totalDays).toFixed(2)));
                      return (
                        <>
                          <Typography variant="body2" fontWeight={700} color="#7f1d1d">
                            Calculated Credit Refund: {formatCurrency(dynamicRefundPreview)}
                          </Typography>
                          <Typography variant="caption" color="#991b1b">
                            Calculated based on {remainingDays} unused day{remainingDays === 1 ? '' : 's'} remaining in current billing cycle.
                          </Typography>
                        </>
                      );
                    })()}
                  </Paper>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                  <Button onClick={() => setCancelModalOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>
                    Keep Subscription
                  </Button>
                  <Button onClick={handleConfirmCancel} variant="contained" color="error" disabled={cancelling} sx={{ fontWeight: 800 }}>
                    {cancelling ? 'Processing...' : 'Confirm Cancellation & Refund'}
                  </Button>
                </DialogActions>
              </Dialog>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: '#fdf0ed !important',
                border: '1.5px solid #fcdad2',
              }}
            >
              <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 2 }}>
                {t('customerPortal.includedFeatures', 'Included Plan Features')}
              </Typography>
              {[
                t('customerPortal.featInvoices', 'Automated Itemized Invoices'),
                t('customerPortal.featProration', 'Instant Proration Credit'),
                t('customerPortal.featTax', 'Multi-Currency Tax Engine'),
                t('customerPortal.featWebhooks', 'Real-time Webhook Receipts'),
                t('customerPortal.featSupport', '24/7 Priority SLA Support'),
              ].map((feat, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <CheckCircleIcon sx={{ color: '#e76f51', fontSize: '1.1rem' }} />
                  <Typography variant="body2" fontWeight={700} color="#334155">{feat}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>


        </Grid>
      )}
    </Box>
  );
};

export default CustomerSubscriptionsPage;
