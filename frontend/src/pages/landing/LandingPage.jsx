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
import { CustomerLanguageScope } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import PwaInstallButton from '../../components/common/PwaInstallButton';
import { useTranslation } from 'react-i18next';

const LandingPageContent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <FintechBackground overlayOpacity={0.7} enableBubbles={true}>
      {/* Top bar with Language Switcher & Install App Button */}
      <Box sx={{ position: 'absolute', top: 20, right: 24, zIndex: 10, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LanguageSwitcher color="default" />
        <PwaInstallButton />
      </Box>
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
              {t('landing.heroSubtitle')}
            </Typography>
            <Chip
              label={t('landing.gatewayTag')}
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
                        {t('landing.customerLogin')}
                      </Typography>
                      <Typography variant="caption" color="#e76f51" fontWeight={800}>
                        {t('landing.customerSubtitle')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3, flex: 1, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#e76f51', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>{t('landing.customerBullet1')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#e76f51', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>{t('landing.customerBullet2')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#e76f51', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>{t('landing.customerBullet3')}</Typography>
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
                    {t('landing.customerLogin')}
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
                        {t('landing.adminLogin')}
                      </Typography>
                      <Typography variant="caption" color="#0284c7" fontWeight={800}>
                        {t('landing.adminSubtitle')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3, flex: 1, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#0284c7', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>{t('landing.adminBullet1')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#0284c7', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>{t('landing.adminBullet2')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#0284c7', fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="#334155" fontWeight={700}>{t('landing.adminBullet3')}</Typography>
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
                    {t('landing.adminLogin')}
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

const LandingPage = () => {
  return (
    <CustomerLanguageScope>
      <LandingPageContent />
    </CustomerLanguageScope>
  );
};

export default LandingPage;
