import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';
import FintechBackground from '../../components/common/FintechBackground';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <FintechBackground overlayOpacity={0.7} enableBubbles={true}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: { xs: 4, md: 8 },
        }}
      >
        <Container maxWidth="lg">
          {/* Header Brand with Solid Title */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                component="img"
                src="/nexora-logo.png"
                alt="Nexora Logo"
                sx={{
                  width: 52,
                  height: 52,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 10px rgba(2, 132, 199, 0.35))',
                }}
              />
              <Typography variant="h3" fontWeight={900} color="#0f172a" letterSpacing="-0.03em">
                Nexora
              </Typography>
            </Box>
            <Typography variant="h6" color="#475569" fontWeight={600} sx={{ maxWidth: 600, mx: 'auto' }}>
              Automated Subscription Billing & Financial Compliance Platform
            </Typography>
            <Chip
              label="Unified Gateway Portal"
              size="small"
              sx={{ mt: 2, bgcolor: '#f0f9ff', color: '#0284c7', fontWeight: 800, border: '1.5px solid #0284c7' }}
            />
          </Box>

          {/* Gateway Entrance Cards */}
          <Grid container spacing={4} justifyContent="center">
            {/* 1. Customer Portal Entrance Box (#e76f51 Theme) */}
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  bgcolor: '#FFFFFF !important',
                  border: '3px solid #e76f51',
                  boxShadow: '0 20px 40px -15px rgba(231, 111, 81, 0.4)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 25px 50px -12px rgba(231, 111, 81, 0.6)',
                  },
                }}
              >
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#e76f51', color: '#ffffff', width: 52, height: 52, fontWeight: 900 }}>
                      <PersonOutlineIcon fontSize="medium" />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={900} color="#0f172a">
                        Customer Portal
                      </Typography>
                      <Typography variant="caption" color="#e76f51" fontWeight={800}>
                        SELF-SERVICE & INVOICE MANAGEMENT
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3, flex: 1, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#e76f51', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>View & Upgrade Subscription Plans</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#e76f51', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>Download GST / Tax Compliant Invoices</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#e76f51', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>Manage Payment Methods & Auto-Debit</Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/customer/login')}
                    sx={{
                      py: 1.4,
                      bgcolor: '#e76f51',
                      '&:hover': { bgcolor: '#d45d3f' },
                      fontWeight: 900,
                      fontSize: '1rem',
                      textTransform: 'none',
                      color: '#ffffff',
                      boxShadow: '0 6px 20px rgba(231, 111, 81, 0.45)',
                    }}
                  >
                    Enter Customer Portal
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* 2. Admin Portal Entrance Box (Sky Blue Theme) */}
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  bgcolor: '#FFFFFF !important',
                  border: '3px solid #0284c7',
                  boxShadow: '0 20px 40px -15px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.55)',
                  },
                }}
              >
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#0284c7', color: '#ffffff', width: 52, height: 52, fontWeight: 900 }}>
                      <AdminPanelSettingsIcon fontSize="medium" />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={900} color="#0f172a">
                        Admin Portal
                      </Typography>
                      <Typography variant="caption" color="#0284c7" fontWeight={800}>
                        PLATFORM OPERATIONS & ANALYTICS
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3, flex: 1, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#0284c7', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>12 Interactive SVG Visual Analytics Charts</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#0284c7', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>Failed Payment Retry Queue & Dunning Tracking</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#0284c7', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>Automated Multi-State Tax Calculations & Audit Trail</Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/login')}
                    sx={{
                      py: 1.4,
                      bgcolor: '#0284c7',
                      '&:hover': { bgcolor: '#0369a1' },
                      fontWeight: 900,
                      fontSize: '1rem',
                      textTransform: 'none',
                      color: '#ffffff',
                      boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
                    }}
                  >
                    Enter Admin Portal
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </FintechBackground>
  );
};

export default LandingPage;
