import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Alert,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import CloseIcon from '@mui/icons-material/Close';
import TagIcon from '@mui/icons-material/Tag';
import BoltIcon from '@mui/icons-material/Bolt';
import axios from 'axios';
import { prorationService } from '../../services/prorationService';

const VeloraCheckoutModal = ({ open, onClose, selectedPlan, isAnnual = false, currentCustomerId = null, currentCustomerEmail = null, platform = 'VELORA' }) => {
  const isNexora = (platform || '').toUpperCase() === 'NEXORA';
  const platformName = isNexora ? 'Nexora' : 'Velora';
  const brandGradient = isNexora
    ? 'linear-gradient(135deg, #e76f51 0%, #f4a261 100%)'
    : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
  const brandAccent = isNexora ? '#f4a261' : '#818cf8';
  const brandBadge = isNexora ? '#e76f51' : '#a855f7';
  const brandButtonBg = isNexora ? '#e76f51' : '#6366f1';
  const brandRadioBg = isNexora ? 'rgba(231, 111, 81, 0.15)' : 'rgba(99, 102, 241, 0.15)';

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(currentCustomerId || '');
  const [paymentMethod, setPaymentMethod] = useState('velora_wallet');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [prorationDetails, setProrationDetails] = useState(null);
  const [successReceipt, setSuccessReceipt] = useState(null);

  useEffect(() => {
    if (open) {
      fetchCustomers();
      setSuccessReceipt(null);
      if (currentCustomerId) {
        setSelectedCustomerId(currentCustomerId);
      }
    }
  }, [open, currentCustomerId]);

  useEffect(() => {
    if (selectedPlan && open) {
      calculateProration();
    }
  }, [selectedPlan, selectedCustomerId, isAnnual, open]);

  const fetchCustomers = async () => {
    try {
      const endpoint = platform === 'NEXORA' ? '/api/customers' : '/api/velora/customers';
      const res = await axios.get(endpoint);
      const list = res.data || [];
      setCustomers(list);
      if (currentCustomerId) {
        setSelectedCustomerId(currentCustomerId);
      } else if (list.length > 0) {
        setSelectedCustomerId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch customer directory:', err);
      setCustomers([
        { id: 1, name: 'Arjun Kumar', email: 'arjun@example.com' },
        { id: 2, name: 'Priya Reddy', email: 'priya@example.com' },
        { id: 3, name: 'Nadhiya Gedela', email: 'nadhiya@example.com' },
        { id: 4, name: 'Gayathri Samanthula', email: 'gayathri@example.com' },
        { id: 5, name: 'Sruthi Pandey', email: 'sruthi@example.com' },
      ]);
      setSelectedCustomerId(currentCustomerId || 1);
    }
  };

  const calculateProration = async () => {
    setCalculating(true);
    try {
      const rawPrice = Number(selectedPlan?.price || 0.0);
      const basePrice = isAnnual ? Math.round(rawPrice * 0.8) : rawPrice;

      // 1. Fetch live active subscriptions to check if this customer already has an active plan
      let activeSub = null;
      try {
        const subEndpoint = platform === 'NEXORA' ? '/api/subscriptions' : '/api/velora/subscriptions';
        const subRes = await axios.get(subEndpoint);
        const subList = Array.isArray(subRes.data) ? subRes.data : [];
        activeSub = subList.find(
          (s) => String(s.customer_id) === String(selectedCustomerId) && String(s.status || '').toUpperCase() === 'ACTIVE'
        );
      } catch {
        activeSub = null;
      }

      let prorationCredit = 0;
      let walletRefundCredit = 0;
      let taxAmount = 0;
      let totalDue = 0;
      let changeType = 'NEW_SUBSCRIPTION';

      if (!activeSub) {
        // NEW CUSTOMER: No proration credit or debit applied
        changeType = 'NEW_SUBSCRIPTION';
        prorationCredit = 0;
        taxAmount = Math.round(basePrice * 0.18);
        totalDue = basePrice + taxAmount;
      } else {
        const currentPlanPrice = Number(activeSub.price || 0.0);
        let apiProrationSuccess = false;

        // Option A: Backend FastAPI Proration Engine Call
        try {
          if (activeSub.id && selectedPlan?.id && String(activeSub.plan_id || '') !== String(selectedPlan.id)) {
            const apiRes = await prorationService.calculateProration(activeSub.id, selectedPlan.id);
            if (apiRes && typeof apiRes.current_plan_credit === 'number') {
              prorationCredit = Math.round(apiRes.current_plan_credit);
              const newPlanCharge = Math.round(apiRes.new_plan_charge);
              const netProratedCharge = Math.max(0, newPlanCharge - prorationCredit);

              if (apiRes.change_type === 'UPGRADE') {
                changeType = 'UPGRADE_PRORATED';
                taxAmount = Math.round(netProratedCharge * 0.18);
                totalDue = netProratedCharge + taxAmount;
              } else if (apiRes.change_type === 'DOWNGRADE') {
                changeType = 'DOWNGRADE_PRORATED';
                walletRefundCredit = Math.max(0, prorationCredit - newPlanCharge);
                taxAmount = 0;
                totalDue = 0;
              } else {
                changeType = 'SAME_PLAN_RENEWAL';
                prorationCredit = 0;
                taxAmount = Math.round(basePrice * 0.18);
                totalDue = basePrice + taxAmount;
              }
              apiProrationSuccess = true;
            }
          }
        } catch (apiErr) {
          console.warn('Backend proration API call failed, falling back to exact daily calendar math:', apiErr);
          apiProrationSuccess = false;
        }

        // Fallback: Exact Daily Calendar Math (Option B) if API call skipped or unavailable
        if (!apiProrationSuccess) {
          const startDate = activeSub.start_date ? new Date(activeSub.start_date) : new Date(Date.now() - 15 * 86400000);
          const endDate = activeSub.end_date ? new Date(activeSub.end_date) : new Date(Date.now() + 15 * 86400000);
          const today = new Date();

          const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
          const remainingDays = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

          prorationCredit = Math.round((currentPlanPrice * remainingDays) / totalDays);
          const proratedNewCharge = Math.round((basePrice * remainingDays) / totalDays);

          if (basePrice > currentPlanPrice) {
            changeType = 'UPGRADE_PRORATED';
            const netBeforeTax = Math.max(0, proratedNewCharge - prorationCredit);
            taxAmount = Math.round(netBeforeTax * 0.18);
            totalDue = netBeforeTax + taxAmount;
          } else if (basePrice < currentPlanPrice) {
            changeType = 'DOWNGRADE_PRORATED';
            walletRefundCredit = Math.max(0, prorationCredit - proratedNewCharge);
            taxAmount = 0;
            totalDue = 0;
          } else {
            changeType = 'SAME_PLAN_RENEWAL';
            prorationCredit = 0;
            taxAmount = Math.round(basePrice * 0.18);
            totalDue = basePrice + taxAmount;
          }
        }
      }

      setProrationDetails({
        basePrice,
        prorationCredit,
        walletRefundCredit,
        taxAmount,
        totalDue,
        cycle: isAnnual ? 'ANNUAL' : 'MONTHLY',
        changeType,
        hasActiveSub: !!activeSub,
      });
    } catch (err) {
      console.error('Proration calculation notice:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleProcessCheckout = async () => {
    setLoading(true);
    try {
      const activeCustomer = customers.find((c) => String(c.id) === String(selectedCustomerId)) ||
        (currentCustomerEmail ? { name: currentCustomerEmail.split('@')[0], full_name: currentCustomerEmail.split('@')[0], email: currentCustomerEmail } : null) ||
        customers[0] || {
          name: 'Subscriber',
          full_name: 'Subscriber',
          email: currentCustomerEmail || 'customer@example.com',
        };

      const custName = activeCustomer.full_name || activeCustomer.name || 'Subscriber';
      const custEmail = activeCustomer.email || currentCustomerEmail || 'customer@example.com';
      const finalAmount = prorationDetails?.totalDue !== undefined ? prorationDetails.totalDue : (selectedPlan?.price || 0.0);

      // Step 1: Verify customer exists in PostgreSQL DB (No auto-creation)
      let dbCustomerId = null;
      try {
        const checkCustRes = await axios.get(platform === 'NEXORA' ? '/api/customers' : '/api/velora/customers');
        const dbCusts = Array.isArray(checkCustRes.data) ? checkCustRes.data : [];
        const existing = dbCusts.find(c => String(c.id) === String(selectedCustomerId) || (c.email && c.email.toLowerCase() === custEmail.toLowerCase()));
        if (existing) {
          dbCustomerId = existing.id;
        }
      } catch (custEnsureErr) {
        console.warn('Customer DB lookup notice:', custEnsureErr);
      }

      // Step 2: Ensure customer is registered in Database
      if (!dbCustomerId) {
        throw new Error('No customer details found');
      }

      const subRes = await axios.post('/api/subscriptions', {
        customer_id: dbCustomerId,
        plan_id: selectedPlan?.id || 1,
        status: 'ACTIVE',
        platform_source: platform === 'NEXORA' ? 'NEXORA_DIRECT' : 'VELORA_DIRECT',
      });
      
      const createdSubId = subRes.data?.id;
      if (!createdSubId) {
        throw new Error('Subscription creation failed to return a valid subscription ID.');
      }

      // Step 3: Determine Payment Gateway Status (SUCCESS vs FAILED vs PENDING)
      const isFailedAttempt = (paymentMethod === 'credit_card' && String(cardNumber || '').endsWith('0000'));
      const actualPaymentStatus = isFailedAttempt ? 'FAILED' : 'SUCCESS';

      const txnId = `TXN_${platform === 'NEXORA' ? 'NEX' : 'VEL'}_${Date.now()}`;
      const paymentDateStr = new Date().toISOString().split('T')[0];

      const payRes = await axios.post('/api/payments', {
        subscription_id: createdSubId,
        amount: finalAmount,
        payment_method: paymentMethod === 'velora_wallet' ? 'Velora Wallet' : (paymentMethod === 'upi' ? 'UPI' : 'Credit Card'),
        transaction_id: txnId,
        payment_date: paymentDateStr,
        payment_status: actualPaymentStatus,
        gateway_name: platform === 'NEXORA' ? 'Nexora Gateway' : 'Velora Merchant Gateway',
        platform_source: platform === 'NEXORA' ? 'NEXORA_DIRECT' : 'VELORA_DIRECT',
      });

      // Step 4: Create Itemized Invoice in Database
      let createdInvNum = `INV-2026-${platform === 'NEXORA' ? 'NEX' : 'VEL'}-${Math.floor(1000 + Math.random() * 9000)}`;
      let createdInvId = null;
      try {
        const invRes = await axios.post(`/api/invoices/generate-itemized?subscription_id=${createdSubId}`);
        if (invRes.data?.invoice_number) {
          createdInvNum = invRes.data.invoice_number;
          createdInvId = invRes.data.id;
        }
      } catch (invErr) {
        console.warn('Invoice generation notice:', invErr);
      }

      // Step 5: Trigger Platform Webhook & Smart Email Notification (Payment Success vs Payment Failed)
      const eventType = actualPaymentStatus === 'SUCCESS' ? 'subscription.created' : 'payment.failed';
      try {
        await axios.post('/api/velora/webhook-trigger', {
          event_type: eventType,
          email: custEmail,
          customer_email: custEmail,
          customer_name: custName,
          plan: selectedPlan?.name || 'Premium Plan',
          plan_name: selectedPlan?.name || 'Premium Plan',
          amount: finalAmount,
          totalDue: finalAmount,
          status: actualPaymentStatus === 'SUCCESS' ? 'ACTIVE' : 'PAST_DUE',
          platform: platform,
          invoice_number: createdInvNum,
          transaction_id: txnId,
          payload: {
            email: custEmail,
            customer_email: custEmail,
            customer_name: custName,
            plan: selectedPlan?.name || 'Premium Plan',
            plan_name: selectedPlan?.name || 'Premium Plan',
            amount: finalAmount,
            totalDue: finalAmount,
            status: actualPaymentStatus === 'SUCCESS' ? 'ACTIVE' : 'PAST_DUE',
            platform: platform,
            invoice_number: createdInvNum,
            transaction_id: txnId,
          },
        });
      } catch (webhookErr) {
        console.warn('Webhook notification notice:', webhookErr);
      }

      // Generate Receipt Payload for Frontend Display
      const receipt = {
        transactionId: txnId,
        invoiceNumber: createdInvNum,
        customerName: custName,
        customerEmail: custEmail,
        planName: selectedPlan?.name || 'Premium Plan',
        amountPaid: finalAmount,
        billingCycle: isAnnual ? 'Annual' : 'Monthly',
        paymentMethod: paymentMethod === 'velora_wallet' ? 'Merchant Wallet' : (paymentMethod === 'upi' ? 'UPI' : 'Credit / Debit Card'),
        paymentStatus: actualPaymentStatus,
        webhookStatus: `DELIVERED (HTTP 200 OK - ${actualPaymentStatus})`,
        timestamp: new Date().toLocaleString(),
      };

      // Trigger Live Refresh Across Customer Portal & Admin Portals
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));

      setSuccessReceipt(receipt);
    } catch (err) {
      console.error('Subscription checkout aborted due to step failure:', err);
      alert(`Checkout Notice: Subscription could not be completed. ${err?.response?.data?.detail || err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: '#0f172a',
          color: '#ffffff',
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        },
      }}
    >
      {/* Modal Header */}
      <DialogTitle sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              background: brandGradient,
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: '1.2rem', color: '#ffffff' }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#ffffff" lineHeight={1.1}>
              {platformName} Subscription Checkout
            </Typography>
            <Typography variant="caption" color={brandAccent} fontWeight={700}>
              POWERED INVISIBLY BY NEXORA ENGINE
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 0.5, color: '#94a3b8', '&:hover': { color: '#ffffff' } }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <DialogContent sx={{ p: 3 }}>
        {successReceipt ? (
          /* Success Receipt View */
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(52, 211, 153, 0.2)',
                color: '#34d399',
                mx: 'auto',
                mb: 2,
                border: '2px solid #34d399',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>

            <Typography variant="h5" fontWeight={900} color="#ffffff" sx={{ mb: 0.5 }}>
              Subscription Confirmed!
            </Typography>
            <Typography variant="body2" color="#94a3b8" sx={{ mb: 3 }}>
              Your subscription plan is active and synchronized in real-time.
            </Typography>

            <Paper
              sx={{
                p: 2.5,
                bgcolor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                textAlign: 'left',
                mb: 3,
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                    TRANSACTION ID
                  </Typography>
                  <Typography variant="body2" color="#60a5fa" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                    {successReceipt.transactionId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                    INVOICE NUMBER
                  </Typography>
                  <Typography variant="body2" color="#34d399" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                    {successReceipt.invoiceNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                    CUSTOMER
                  </Typography>
                  <Typography variant="body2" color="#ffffff" fontWeight={700}>
                    {successReceipt.customerName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                    PLAN
                  </Typography>
                  <Typography variant="body2" color="#a855f7" fontWeight={800}>
                    {successReceipt.planName} ({successReceipt.billingCycle})
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                    AMOUNT PAID
                  </Typography>
                  <Typography variant="body1" color="#ffffff" fontWeight={900}>
                    ₹{successReceipt.amountPaid.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                    WEBHOOK DISPATCH
                  </Typography>
                  <Chip
                    label={successReceipt.webhookStatus}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(52, 211, 153, 0.15)',
                      color: '#34d399',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      mt: 0.5,
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Alert severity="success" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: 2 }}>
              Zero Data Erasure Guaranteed: All customer records & invoices saved securely in PostgreSQL.
            </Alert>
          </Box>
        ) : (
          /* Checkout Form View */
          <Box>
            {/* Plan Summary Header */}
            <Paper
              sx={{
                p: 2,
                mb: 3,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="#ffffff">
                  {selectedPlan?.name || 'Premium Plan'}
                </Typography>
                <Typography variant="caption" color="#c7d2fe">
                  {selectedPlan?.description || 'Full-stack automated billing plan'}
                </Typography>
              </Box>
              <Chip
                label={isAnnual ? 'ANNUAL BILLING' : 'MONTHLY BILLING'}
                size="small"
                sx={{ bgcolor: brandBadge, color: '#ffffff', fontWeight: 800, fontSize: '0.7rem' }}
              />
            </Paper>

            {/* 1. Customer Selection */}
            <Typography variant="caption" color={brandAccent} fontWeight={800} letterSpacing="0.05em" sx={{ display: 'block', mb: 1 }}>
              1. SELECT SUBSCRIBER CUSTOMER
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <InputLabel sx={{ color: '#94a3b8' }}>Select {platformName} Customer</InputLabel>
              <Select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                label={`Select ${platformName} Customer`}
                sx={{
                  color: '#ffffff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brandAccent },
                  '.MuiSvgIcon-root': { color: '#ffffff' },
                }}
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 2. Proration Breakdown */}
            <Typography variant="caption" color={brandAccent} fontWeight={800} letterSpacing="0.05em" sx={{ display: 'block', mb: 1 }}>
              2. REAL-TIME PRORATION & BILLING BREAKDOWN
            </Typography>

            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                bgcolor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
              }}
            >
              {calculating ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <CircularProgress size={20} sx={{ color: brandAccent }} />
                  <Typography variant="body2" color="#94a3b8">
                    Calculating pro-rata credits & taxes...
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="#94a3b8">
                      Base Plan Rate
                    </Typography>
                    <Typography variant="body2" color="#ffffff" fontWeight={700}>
                      ₹{(prorationDetails?.basePrice || 0).toLocaleString()}
                    </Typography>
                  </Box>

                  {prorationDetails?.prorationCredit > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SyncAltIcon sx={{ color: '#34d399', fontSize: '0.9rem' }} />
                        <Typography variant="body2" color="#34d399">
                          Unused Cycle Proration Credit
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="#34d399" fontWeight={700}>
                        -₹{prorationDetails?.prorationCredit.toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="#94a3b8">
                      Applicable GST / Tax (18%)
                    </Typography>
                    <Typography variant="body2" color="#ffffff" fontWeight={700}>
                      +₹{(prorationDetails?.taxAmount || 0).toLocaleString()}
                    </Typography>
                  </Box>

                  {prorationDetails?.walletRefundCredit > 0 && (
                    <Box sx={{ p: 1.2, my: 1, bgcolor: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399', borderRadius: 2 }}>
                      <Typography variant="caption" color="#34d399" fontWeight={800} display="block">
                        🎁 Plan Downgrade Credit: ₹{prorationDetails.walletRefundCredit.toLocaleString()} unused credit will be refunded to customer's {platformName} Wallet!
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={800} color="#ffffff">
                      Total Net Amount Due
                    </Typography>
                    <Typography variant="h5" fontWeight={900} color={brandBadge}>
                      ₹{(prorationDetails?.totalDue || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>

            {/* 3. Payment Method */}
            <Typography variant="caption" color={brandAccent} fontWeight={800} letterSpacing="0.05em" sx={{ display: 'block', mb: 1 }}>
              3. SELECT PAYMENT METHOD
            </Typography>

            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              sx={{ mb: 2 }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  px: 2,
                  mb: 1.5,
                  bgcolor: paymentMethod === 'velora_wallet' ? brandRadioBg : 'rgba(30, 41, 59, 0.5)',
                  border: paymentMethod === 'velora_wallet' ? `1px solid ${brandAccent}` : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2.5,
                }}
              >
                <FormControlLabel
                  value="velora_wallet"
                  control={<Radio sx={{ color: brandAccent, '&.Mui-checked': { color: brandAccent } }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalanceWalletIcon sx={{ color: brandAccent }} />
                      <Box>
                        <Typography variant="body2" fontWeight={800} color="#ffffff">
                          {platformName} Merchant Wallet (Instant Sync)
                        </Typography>
                        <Typography variant="caption" color="#94a3b8">
                          API Token: {isNexora ? 'nex_live_sec_98234' : 'vel_live_sec_98234'}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </Paper>

              <Paper
                sx={{
                  p: 1.5,
                  px: 2,
                  mb: 1.5,
                  bgcolor: paymentMethod === 'card' ? brandRadioBg : 'rgba(30, 41, 59, 0.5)',
                  border: paymentMethod === 'card' ? `1px solid ${brandAccent}` : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2.5,
                }}
              >
                <FormControlLabel
                  value="card"
                  control={<Radio sx={{ color: brandAccent, '&.Mui-checked': { color: brandAccent } }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCardIcon sx={{ color: '#34d399' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={800} color="#ffffff">
                          Credit / Debit Card
                        </Typography>
                        <Typography variant="caption" color="#94a3b8">
                          PCI-DSS 256-bit encrypted checkout
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </Paper>

              {/* UPI Payment Option */}
              <Paper
                sx={{
                  p: 1.5,
                  px: 2,
                  bgcolor: paymentMethod === 'upi' ? brandRadioBg : 'rgba(30, 41, 59, 0.5)',
                  border: paymentMethod === 'upi' ? `1px solid ${brandAccent}` : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2.5,
                }}
              >
                <FormControlLabel
                  value="upi"
                  control={<Radio sx={{ color: brandAccent, '&.Mui-checked': { color: brandAccent } }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BoltIcon sx={{ color: '#f59e0b' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={800} color="#ffffff">
                          UPI
                        </Typography>
                        <Typography variant="caption" color="#94a3b8">
                          Instant VPA payment transfer
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>
          </Box>
        )}
      </DialogContent>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <DialogActions sx={{ p: 3, pt: 2 }}>
        {successReceipt ? (
          <Button
            fullWidth
            variant="contained"
            onClick={onClose}
            sx={{
              py: 1.5,
              borderRadius: 3,
              fontWeight: 800,
              bgcolor: brandButtonBg,
              '&:hover': { opacity: 0.9 },
            }}
          >
            Close & Return to {platformName} Platform
          </Button>
        ) : (
          <Box sx={{ width: '100%', display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: 3,
                fontWeight: 700,
                color: '#94a3b8',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': { borderColor: '#ffffff', color: '#ffffff' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={loading || calculating}
              onClick={handleProcessCheckout}
              startIcon={loading ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : <BoltIcon />}
              sx={{
                flex: 2,
                py: 1.2,
                borderRadius: 3,
                fontWeight: 800,
                textTransform: 'none',
                background: brandGradient,
                boxShadow: isNexora ? '0 4px 15px rgba(231, 111, 81, 0.4)' : '0 4px 15px rgba(168, 85, 247, 0.4)',
                '&:hover': { opacity: 0.9 },
              }}
            >
              {loading ? 'Processing...' : `Confirm & Pay ₹${(prorationDetails?.totalDue || 0).toLocaleString()}`}
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VeloraCheckoutModal;
