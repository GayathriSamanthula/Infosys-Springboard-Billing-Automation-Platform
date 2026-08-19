import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';
import { planService } from '../../services/planService';
import { customerPortalService } from '../../services/customerPortalService';
import { formatCurrency } from '../../utils/formatters';
import NexoraCheckoutModal from '../../components/nexora/NexoraCheckoutModal';
import { useTranslation } from 'react-i18next';

const getPlanKey = (plan) => {
  const n = String(plan?.name || '').toLowerCase();
  if (n.includes('basic')) return '1';
  if (n.includes('plus')) return '3';
  if (n.includes('pro')) return '4';
  if (n.includes('premium')) return '2';
  return String(plan?.id || '1');
};

const CustomerPlansPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);

  const currentCustomer = customerPortalService.getCurrentCustomer() || {};
  const customerId = currentCustomer?.id || currentCustomer?.customer_id;

  const loadPlansData = async () => {
    setLoading(true);
    try {
      const [allPlans, portalData] = await Promise.all([
        planService.getAll(),
        customerId ? customerPortalService.getDashboardData(customerId) : Promise.resolve(null),
      ]);
      const standardNames = ['basic plan', 'premium plan', 'premium plus plan', 'premium pro plan'];
      let validPlans = (Array.isArray(allPlans) ? allPlans : []).filter((p) =>
        standardNames.includes(String(p.name || '').trim().toLowerCase())
      );
      if (validPlans.length < 4) {
        validPlans = [
          { id: 1, name: 'Basic Plan', price: 499.0, billing_cycle: 'MONTHLY', description: 'Essential billing automation for individuals & growing startups.' },
          { id: 2, name: 'Premium Plan', price: 999.0, billing_cycle: 'MONTHLY', description: 'Advanced proration engine, tax calculations, and email receipts.' },
          { id: 3, name: 'Premium Plus Plan', price: 1499.0, billing_cycle: 'MONTHLY', description: 'Enterprise-grade Fintech billing, dedicated webhooks & priority SLA.' },
          { id: 4, name: 'Premium Pro Plan', price: 2000.0, billing_cycle: 'MONTHLY', description: 'Full custom automated workflow suite with multi-currency taxation support.' },
        ];
      }
      setPlans(validPlans);
      setActiveSub(portalData?.active_subscription);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlansData();
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlanForUpgrade(plan);
    setCheckoutModalOpen(true);
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#000000">
          {t('nav.plans')}
        </Typography>
        <Typography variant="body2" color="#64748b" fontWeight={700} sx={{ mt: 0.5 }}>
          {t('customerPortal.manageSubSubtext')}
        </Typography>
      </Box>

      {loading ? (
        <Typography variant="body1" color="#e76f51">{t('common.loading')}</Typography>
      ) : (
        <Grid container spacing={3}>
          {plans.map((plan) => {
            const pKey = getPlanKey(plan);
            const activePKey = activeSub ? getPlanKey({ name: activeSub.plan_name || activeSub.plan?.name, id: activeSub.plan_id }) : null;
            const isSubActive = activeSub && ['active', 'trial'].includes(String(activeSub.status || '').toLowerCase());
            const isCurrentPlan = activeSub && (
              String(activeSub.plan_name || '').toLowerCase() === String(plan.name || '').toLowerCase() ||
              Number(activeSub.plan_id) === Number(plan.id) ||
              (activePKey && activePKey === pKey)
            );

            const buttonText = (isCurrentPlan && isSubActive)
              ? t('customerPortal.activePlan', 'Current Active Plan')
              : isCurrentPlan
              ? t('customerPortal.reactivatePlan', 'Reactivate Plan')
              : isSubActive
              ? t('customerPortal.updatePlan', 'Change Plan')
              : t('customerPortal.subscribeNow', 'Subscribe Now');


            return (
              <Grid item xs={12} md={3} key={plan.id}>
                <Card
                  sx={{
                    borderRadius: 3.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: isCurrentPlan ? '3px solid #e76f51' : '1.5px solid #fcdad2',
                    boxShadow: isCurrentPlan ? '0 12px 30px -5px rgba(231, 111, 81, 0.45)' : '0 4px 15px -3px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: '#FFFFFF !important',
                  }}
                >
                  {isCurrentPlan && (
                    <Chip
                      label={t('customerPortal.currentActiveBadge')}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontWeight: 900,
                        fontSize: '0.65rem',
                        bgcolor: '#e76f51',
                        color: '#ffffff',
                      }}
                    />
                  )}

                  <CardContent sx={{ p: 3.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5" fontWeight={900} color="#e76f51" sx={{ mb: 1 }}>
                      {t(`plans.${pKey}.name`, plan.name)}
                    </Typography>

                    <Typography variant="h3" fontWeight={900} color="#0f172a" sx={{ my: 1.5 }}>
                      {formatCurrency(plan.price)}
                      <Typography component="span" variant="body2" color="#64748b" sx={{ ml: 1, fontWeight: 700 }}>
                        / {t('customerPortal.monthlyCycle')}
                      </Typography>
                    </Typography>

                    <Typography variant="body2" color="#475569" sx={{ mb: 3, flex: 1 }}>
                      {t(`plans.${pKey}.desc`, plan.description)}
                    </Typography>



                    <Divider sx={{ my: 2, borderColor: '#fcdad2' }} />

                    <Button
                      variant={isCurrentPlan ? 'outlined' : 'contained'}
                      fullWidth
                      startIcon={<SwapHorizIcon />}
                      onClick={() => {
                        if (!isCurrentPlan) {
                          handleSelectPlan(plan);
                        }
                      }}
                      sx={{
                        py: 1.2,
                        fontWeight: 900,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        borderRadius: 2.5,
                        borderColor: '#e76f51',
                        bgcolor: isCurrentPlan ? 'transparent' : '#e76f51',
                        color: isCurrentPlan ? '#e76f51' : '#ffffff',
                        '&:hover': {
                          bgcolor: isCurrentPlan ? '#fdf0ed' : '#d45d3f',
                          borderColor: '#d45d3f',
                        },
                      }}
                    >
                      {buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {selectedPlanForUpgrade && (
        <NexoraCheckoutModal
          open={checkoutModalOpen}
          onClose={() => {
            setCheckoutModalOpen(false);
            loadPlansData();
          }}
          selectedPlan={selectedPlanForUpgrade}
          currentCustomerId={customerId}
          currentCustomerEmail={currentCustomer?.email}
          platform="NEXORA"
        />
      )}
    </Box>
  );
};

export default CustomerPlansPage;
