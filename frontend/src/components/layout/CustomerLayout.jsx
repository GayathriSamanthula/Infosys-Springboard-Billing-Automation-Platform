import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Button,
  Container,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import FintechBackground from '../common/FintechBackground';
import CustomerSidebar from './CustomerSidebar';
import { customerPortalService } from '../../services/customerPortalService';
import { CustomerLanguageScope } from '../../context/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const SIDEBAR_WIDTH = 260;

const CustomerLayoutContent = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const currentCustomer = customerPortalService.getCurrentCustomer() || { customer_id: Date.now(), full_name: 'Customer Account', email: '' };

  React.useEffect(() => {
    const checkAuthOnBack = () => {
      const custUser = localStorage.getItem('customer_user') || localStorage.getItem('customer_info') || localStorage.getItem('customer_token');
      if (!custUser) {
        navigate('/customer/login', { replace: true });
      }
    };
    checkAuthOnBack();
    window.addEventListener('popstate', checkAuthOnBack);
    window.addEventListener('pageshow', checkAuthOnBack);
    return () => {
      window.removeEventListener('popstate', checkAuthOnBack);
      window.removeEventListener('pageshow', checkAuthOnBack);
    };
  }, [navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    customerPortalService.logout();
    navigate('/customer/login', { replace: true });
  };

  return (
    <FintechBackground overlayOpacity={0.65}>
      <Box sx={{ minHeight: '100vh', display: 'flex' }}>
        {/* Customer Sidebar */}
        <CustomerSidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} drawerWidth={SIDEBAR_WIDTH} />

        <Box sx={{ flexGrow: 1, width: { sm: `calc(100% - ${SIDEBAR_WIDTH}px)` }, display: 'flex', flexDirection: 'column' }}>
          {/* Customer Header in Sky Blue */}
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: '#ffffff',
              color: '#0f172a',
              borderBottom: '2px solid #e0f2fe',
              py: 0.5,
            }}
          >
            <Container maxWidth="xl">
              <Toolbar sx={{ justifyContent: 'space-between', px: '0 !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/customer/dashboard')}>
                  <Avatar sx={{ bgcolor: '#e76f51', color: '#ffffff', fontWeight: 900 }}>N</Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ lineHeight: 1.1 }}>
                      Nexora {t('nav.customerPortal')}
                    </Typography>
                    <Typography variant="caption" color="#e76f51" fontWeight={800}>
                      {t('landing.customerSubtitle')}
                    </Typography>
                  </Box>
                </Box>


                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LanguageSwitcher />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: '#e76f51', color: '#ffffff', width: 34, height: 34, fontWeight: 800, fontSize: '0.85rem' }}>
                        {currentCustomer.full_name ? currentCustomer.full_name[0].toUpperCase() : 'C'}
                      </Avatar>
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ lineHeight: 1.1 }}>
                          {currentCustomer.full_name || 'Customer Account'}
                        </Typography>
                        <Typography variant="caption" color="#e76f51" fontWeight={700}>
                          {currentCustomer.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Tooltip title="Sign Out">
                      <IconButton size="small" onClick={handleLogout} sx={{ color: '#ef4444' }}>
                        <LogoutIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Toolbar>
              </Container>
            </AppBar>

            {/* Main Customer Portal Content Container */}
            <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
              {children}
            </Container>
          </Box>
        </Box>
      </FintechBackground>
  );
};

const CustomerLayout = ({ children }) => {
  return (
    <CustomerLanguageScope>
      <CustomerLayoutContent>{children}</CustomerLayoutContent>
    </CustomerLanguageScope>
  );
};

export default CustomerLayout;

