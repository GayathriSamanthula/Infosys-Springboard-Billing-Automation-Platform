import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';

import { subscriptionService } from '../../services/subscriptionService';
import { planService } from '../../services/planService';
import { prorationService } from '../../services/prorationService';
import { invoiceService } from '../../services/invoiceService';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency } from '../../utils/formatters';

const ChangePlanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [proration, setProration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const sub = await subscriptionService.getById(id);
        const allPlans = await planService.getAll();
        setSubscription(sub);
        setPlans(allPlans.filter((p) => p.status === 'ACTIVE'));
        if (sub) {
          const nextPlan = allPlans.find((p) => p.id !== sub.plan_id);
          if (nextPlan) {
            setSelectedPlanId(nextPlan.id);
            fetchProrationPreview(sub.id, nextPlan.id);
          }
        }
      } catch {
        showNotification('Failed to load subscription details', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const fetchProrationPreview = async (subId, planId) => {
    try {
      const res = await prorationService.calculateProration(subId, planId);
      setProration(res);
    } catch {
      showNotification('Failed to calculate proration details', 'error');
    }
  };

  const handlePlanSelectionChange = (e) => {
    const newPlanId = e.target.value;
    setSelectedPlanId(newPlanId);
    if (subscription) {
      fetchProrationPreview(subscription.id, newPlanId);
    }
  };

  const handleGenerateInvoice = async () => {
    setGenerating(true);
    try {
      const inv = await invoiceService.generateItemizedInvoice(subscription.id, {
        proration_credit: proration?.current_plan_credit || 0,
        proration_debit: proration?.new_plan_charge || 0,
        remarks: `Plan ${proration?.change_type || 'Adjustment'}: ${currentPlan?.name || 'Previous Plan'} -> ${targetPlan?.name || 'Target Plan'} (${proration?.change_type === 'DOWNGRADE' || (proration?.current_plan_credit > proration?.new_plan_charge) ? 'Platform Refunds Customer' : 'Customer Pays Additional Charge'})`,
        previous_plan_name: currentPlan?.name || 'Previous Plan',
        previous_plan_price: currentPlan?.price || 0,
        remaining_days: proration?.remaining_days || 0,
        total_cycle_days: proration?.total_cycle_days || 30,
      });
      showNotification('Prorated Itemized Invoice generated successfully!', 'success');
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
      navigate(`/invoices/${inv.id}`);
    } catch {
      showNotification('Failed to generate prorated itemized invoice', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Calculating Module 2 Proration Engine...</Typography>
      </Box>
    );
  }

  if (!subscription) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        Subscription record not found.
      </Alert>
    );
  }

  const currentPlan = plans.find((p) => p.id === subscription.plan_id);
  const targetPlan = plans.find((p) => p.id === Number(selectedPlanId));

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/subscriptions')}
        sx={{ mb: 3, textTransform: 'none' }}
      >
        Back to Subscriptions
      </Button>

      <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
        Module 2 Proration & Plan Adjustment
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Triggers FastAPI endpoint POST /proration/calculate to compute mid-cycle upgrade/downgrade adjustments.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Subscription State & Target Selection
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Subscriber
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {subscription.customerName || `Customer #${subscription.customer_id}`}
              </Typography>
            </Box>

            <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                CURRENT ACTIVE PLAN
              </Typography>
              <Typography variant="h6" fontWeight={800} color="primary">
                {subscription.planName || currentPlan?.name || 'Current Tier'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Price: {formatCurrency(subscription.price || currentPlan?.price || 0)}
              </Typography>
            </Box>

            <FormControl fullWidth margin="normal">
              <InputLabel>Select Target Upgrade/Downgrade Plan</InputLabel>
              <Select value={selectedPlanId} label="Select Target Upgrade/Downgrade Plan" onChange={handlePlanSelectionChange}>
                {plans
                  .filter((p) => p.id !== subscription.plan_id)
                  .map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.price)} / {p.billing_cycle}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {targetPlan && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                Changing plan to <strong>{targetPlan.name}</strong> ({targetPlan.billing_cycle}).
              </Alert>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #6366f1' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CalculateIcon color="primary" fontSize="large" />
              <Typography variant="h6" fontWeight={800} color="text.primary">
                Live Proration Calculation Ledger
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Calculated via FastAPI backend (ProrationResponse schema).
            </Typography>

            <Divider sx={{ mb: 2.5 }} />

            {proration && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining Billing Days:
                  </Typography>
                  <Chip label={`${proration.remaining_days} Days`} size="small" color="primary" />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Unused Current Plan Credit:
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main">
                    - {formatCurrency(proration.current_plan_credit)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    New Plan Cost (Prorated):
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatCurrency(proration.new_plan_charge)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Adjustment Type:
                  </Typography>
                  <Chip label={proration.change_type} size="small" color="info" />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="h6" fontWeight={800} color="text.primary">
                    Final Prorated Amount:
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="primary">
                    {formatCurrency(proration.final_amount)}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<ReceiptIcon />}
                  onClick={handleGenerateInvoice}
                  disabled={generating}
                  sx={{ mt: 3, py: 1.5, fontSize: '1rem' }}
                >
                  {generating ? 'Generating Prorated Invoice...' : 'Generate Prorated Invoice'}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChangePlanPage;
