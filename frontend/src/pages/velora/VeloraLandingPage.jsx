import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Paper,
  Divider,
  CircularProgress,
  Switch,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CampaignIcon from '@mui/icons-material/Campaign';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FintechBackground from '../../components/common/FintechBackground';
import VeloraCheckoutModal from '../../components/velora/VeloraCheckoutModal';

const VeloraLandingPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

  // Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);

  // Velora Announcements Feed
  const announcements = [
    {
      id: 1,
      tag: 'API RELEASE',
      title: 'Velora Webhook Engine v2.4 Live',
      date: 'July 27, 2026',
      desc: 'Real-time subscription lifecycle events (`subscription.created`, `subscription.prorated`) now deliver with sub-50ms latency.',
      color: '#10b981',
    },
    {
      id: 2,
      tag: 'MERCHANT NOTICE',
      title: 'Zero-Downtime Billing Sync Active',
      date: 'July 26, 2026',
      desc: 'Velora merchant accounts are seamlessly integrated with Nexora core state machines with 100% database record preservation.',
      color: '#6366f1',
    },
    {
      id: 3,
      tag: 'FEATURE UPDATE',
      title: 'Instant Pro-Rata Credit Calculation',
      date: 'July 24, 2026',
      desc: 'Upgrading or downgrading plans mid-cycle automatically computes daily proration with immediate invoice preview.',
      color: '#ec4899',
    },
  ];

  useEffect(() => {
    document.title = 'Velora Fintech Platform | Home';
    fetchVeloraPlans();
  }, []);

  const fetchVeloraPlans = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/velora/plans');
      let fetchedPlans = res.data || [];
      setPlans(uniquePlans);
    } catch (err) {
      console.error('Failed to fetch Velora synced plans:', err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckout = (plan) => {
    setSelectedPlanForCheckout(plan);
    setCheckoutModalOpen(true);
  };

  return (
    <FintechBackground overlayOpacity={0.85}>
      <Box sx={{ minHeight: '100vh', color: '#0f172a', pb: 10 }}>
        {/* Velora Top Brand Bar */}
        <Paper
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '2px solid rgba(99, 102, 241, 0.4)',
            py: 2,
            position: 'sticky',
            top: 0,
            zIndex: 1100,
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Velora Logo & Solid Black Brand Title */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <AccountBalanceWalletIcon sx={{ color: '#ffffff' }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={900} letterSpacing="-0.02em" sx={{ color: '#000000', lineHeight: 1 }}>
                    Velora
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 800, letterSpacing: '0.05em' }}>
                    FINTECH PLATFORM
                  </Typography>
                </Box>
              </Box>

              {/* Top Navigation Links */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
                <Typography variant="body2" fontWeight={800} onClick={() => navigate('/velora')} sx={{ color: '#4338ca', cursor: 'pointer' }}>
                  Overview
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  onClick={() => {
                    const el = document.getElementById('announcements-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{ color: '#7e22ce', cursor: 'pointer', '&:hover': { color: '#a855f7' } }}
                >
                  Announcements
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  onClick={() => {
                    const el = document.getElementById('plans-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{ color: '#0284c7', cursor: 'pointer', '&:hover': { color: '#0369a1' } }}
                >
                  Plans & Pricing
                </Typography>
              </Box>

              {/* Portal CTA Buttons: Changed back to "Customer Portal" as requested */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<PersonOutlineIcon />}
                  onClick={() => navigate('/velora/customer/login')}
                  sx={{
                    color: '#4338ca',
                    borderColor: '#6366f1',
                    fontWeight: 800,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    px: 2,
                    bgcolor: '#ffffff',
                    '&:hover': { borderColor: '#4338ca', bgcolor: 'rgba(99, 102, 241, 0.08)' },
                  }}
                >
                  Customer Portal
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AdminPanelSettingsIcon />}
                  onClick={() => navigate('/velora/admin/login')}
                  sx={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    fontWeight: 800,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    px: 2,
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                    '&:hover': { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' },
                  }}
                >
                  Velora Merchant Admin
                </Button>
              </Box>
            </Box>
          </Container>
        </Paper>

        <Container maxWidth="lg" sx={{ pt: 6 }}>
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 8, pt: 2 }}>
            <Chip
              label="VELORA FINTECH & AUTOMATED BILLING HUB"
              size="small"
              sx={{
                mb: 2,
                bgcolor: '#ffffff',
                color: '#6b21a8',
                fontWeight: 800,
                letterSpacing: '0.08em',
                border: '1.5px solid #a855f7',
                py: 0.5,
                px: 1,
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)',
              }}
            />
            <Typography variant="h2" fontWeight={900} letterSpacing="-0.03em" sx={{ mb: 2, color: '#0f172a' }}>
              Next-Generation Financial Infrastructure
            </Typography>
            <Typography variant="h6" color="#334155" sx={{ maxWidth: 720, mx: 'auto', mb: 4, fontWeight: 600 }}>
              Seamlessly manage global subscriptions, automated billing cycles, real-time proration calculations, and instant merchant webhooks on Velora.
            </Typography>

            {/* Quick Metrics Bar */}
            <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: 900, mx: 'auto', mb: 6 }}>
              <Grid item xs={12} sm={4}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: '#FFFFFF',
                    border: '2px solid #6366f1',
                    borderRadius: 4,
                    boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.15)',
                  }}
                >
                  <Typography variant="h4" fontWeight={900} color="#4338ca">
                    99.99%
                  </Typography>
                  <Typography variant="caption" color="#475569" fontWeight={800}>
                    BILLING API UPTIME
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: '#FFFFFF',
                    border: '2px solid #10b981',
                    borderRadius: 4,
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)',
                  }}
                >
                  <Typography variant="h4" fontWeight={900} color="#047857">
                    Instant
                  </Typography>
                  <Typography variant="caption" color="#475569" fontWeight={800}>
                    PRORATION CALCULATOR
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: '#FFFFFF',
                    border: '2px solid #ec4899',
                    borderRadius: 4,
                    boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.15)',
                  }}
                >
                  <Typography variant="h4" fontWeight={900} color="#be185d">
                    100%
                  </Typography>
                  <Typography variant="caption" color="#475569" fontWeight={800}>
                    SYNCHRONIZED AUDIT TRAIL
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Announcements Section */}
          <Box sx={{ mb: 8 }} id="announcements-section">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <CampaignIcon sx={{ color: '#7e22ce', fontSize: '2rem' }} />
              <Typography variant="h4" fontWeight={900} color="#0f172a">
                Velora Platform Announcements
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {announcements.map((item) => (
                <Grid item xs={12} md={4} key={item.id}>
                  <Card
                    sx={{
                      height: '100%',
                      bgcolor: '#FFFFFF',
                      border: `2px solid ${item.color}`,
                      borderRadius: 4,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 15px 30px -5px ${item.color}30`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Chip
                          label={item.tag}
                          size="small"
                          sx={{
                            bgcolor: `${item.color}15`,
                            color: item.color,
                            fontWeight: 900,
                            fontSize: '0.7rem',
                            border: `1.5px solid ${item.color}`,
                          }}
                        />
                        <Typography variant="caption" color="#64748b" fontWeight={700}>
                          {item.date}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="#334155" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
                        {item.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Synced Subscription Plans Section */}
          <Box sx={{ mb: 8 }} id="plans-section">
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ mb: 1 }}>
                Select Your Subscription Plan
              </Typography>
              <Typography variant="body1" color="#334155" fontWeight={600}>
                All plans feature instant proration credit engine & synchronized invoices.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                <Typography variant="body2" color={!isAnnual ? '#4338ca' : '#64748b'} fontWeight={800}>
                  Monthly Billing
                </Typography>
                <Switch
                  checked={isAnnual}
                  onChange={(e) => setIsAnnual(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#7e22ce' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#7e22ce' },
                  }}
                />
                <Typography variant="body2" color={isAnnual ? '#7e22ce' : '#64748b'} fontWeight={800}>
                  Annual Billing (Save 20%)
                </Typography>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: '#6366f1' }} />
              </Box>
            ) : (
              <Grid container spacing={4} justifyContent="center">
                {plans.map((plan) => {
                  const monthlyPrice = Number(plan.price || 499);
                  const displayPrice = isAnnual ? Math.round(monthlyPrice * 0.8) : monthlyPrice;
                  const isFeatured = plan.name?.toLowerCase().includes('premium plan') && !plan.name?.toLowerCase().includes('plus');

                  return (
                    <Grid item xs={12} md={4} key={plan.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 4,
                          bgcolor: '#FFFFFF',
                          border: isFeatured ? '2.5px solid #6366f1' : '1.5px solid #cbd5e1',
                          boxShadow: isFeatured ? '0 20px 40px -10px rgba(99, 102, 241, 0.25)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                          position: 'relative',
                          overflow: 'visible',
                        }}
                      >
                        {isFeatured && (
                          <Chip
                            label="MOST POPULAR"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: -14,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              bgcolor: '#6366f1',
                              color: '#ffffff',
                              fontWeight: 900,
                              px: 1.5,
                            }}
                          />
                        )}

                        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <Typography variant="h5" fontWeight={900} color="#0f172a" sx={{ mb: 1 }}>
                            {plan.name}
                          </Typography>
                          <Typography variant="body2" color="#475569" sx={{ minHeight: 40, mb: 3, fontWeight: 500 }}>
                            {plan.description || 'Full-stack automated subscription plan on Velora.'}
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 3 }}>
                            <Typography variant="h3" fontWeight={900} color="#6366f1">
                              ₹{displayPrice.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="#64748b" fontWeight={700}>
                              / {isAnnual ? 'month (billed annually)' : 'month'}
                            </Typography>
                          </Box>

                          <Divider sx={{ borderColor: '#e2e8f0', mb: 3 }} />

                          <Box sx={{ flex: 1, mb: 4 }}>
                            <Typography variant="caption" color="#4338ca" fontWeight={800} letterSpacing="0.05em" sx={{ display: 'block', mb: 2 }}>
                              PLAN INCLUSIONS
                            </Typography>

                            {[
                              'Automated Invoice Generation',
                              'Pro-Rata Immediate Calculation',
                              'Multi-Currency Support',
                              'Real-Time Webhook Notifications',
                              'Audit Trail & Compliance Logs',
                            ].map((feature, idx) => (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                                <CheckCircleIcon sx={{ color: isFeatured ? '#6366f1' : '#10b981', fontSize: '1.1rem' }} />
                                <Typography variant="body2" color="#1e293b" fontWeight={600}>
                                  {feature}
                                </Typography>
                              </Box>
                            ))}
                          </Box>

                          <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => handleOpenCheckout(plan)}
                            sx={{
                              py: 1.5,
                              borderRadius: 3,
                              fontWeight: 800,
                              textTransform: 'none',
                              fontSize: '1rem',
                              bgcolor: isFeatured ? '#6366f1' : '#0f172a',
                              color: '#ffffff',
                              '&:hover': {
                                bgcolor: isFeatured ? '#4f46e5' : '#1e293b',
                              },
                            }}
                          >
                            Subscribe to Plan
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>

          {/* Infrastructure Capabilities Showcase */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={900} color="#0f172a" textAlign="center" sx={{ mb: 4 }}>
              Velora Merchant Services Infrastructure
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, bgcolor: '#FFFFFF', border: '2px solid #6366f1', borderRadius: 4, boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.12)' }}>
                  <SyncAltIcon sx={{ color: '#6366f1', fontSize: '2.5rem', mb: 2 }} />
                  <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                    Pro-Rata Engine
                  </Typography>
                  <Typography variant="body2" color="#334155" fontWeight={500}>
                    Mid-cycle upgrades calculate unused days vs new plan rates to compute accurate credit balances instantly.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, bgcolor: '#FFFFFF', border: '2px solid #10b981', borderRadius: 4, boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.12)' }}>
                  <ReceiptLongIcon sx={{ color: '#10b981', fontSize: '2.5rem', mb: 2 }} />
                  <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                    Tax & Line-Item Invoicing
                  </Typography>
                  <Typography variant="body2" color="#334155" fontWeight={500}>
                    Itemized line items generated dynamically upon payment confirmation with full GST/VAT taxation support.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, bgcolor: '#FFFFFF', border: '2px solid #ec4899', borderRadius: 4, boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.12)' }}>
                  <SecurityIcon sx={{ color: '#ec4899', fontSize: '2.5rem', mb: 2 }} />
                  <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                    Immutable Compliance Audit
                  </Typography>
                  <Typography variant="body2" color="#334155" fontWeight={500}>
                    Every state transition, subscription change, and payment transaction logs an immutable audit trace.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Container>

        {/* Checkout Modal */}
        <VeloraCheckoutModal
          open={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          selectedPlan={selectedPlanForCheckout}
          isAnnual={isAnnual}
        />

        {/* Footer */}
        <Box sx={{ borderTop: '2px solid rgba(99, 102, 241, 0.3)', pt: 4, mt: 8, textAlign: 'center' }}>
          <Typography variant="body2" color="#475569" fontWeight={700}>
            © 2026 Velora Fintech Platform. All rights reserved. Powered by Nexora Billing Infrastructure Engine.
          </Typography>
        </Box>
      </Box>
    </FintechBackground>
  );
};

export default VeloraLandingPage;
