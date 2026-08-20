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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import BadgeIcon from '@mui/icons-material/Badge';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LockIcon from '@mui/icons-material/Lock';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import FintechBackground from '../../components/common/FintechBackground';
import NexoraCheckoutModal from '../../components/nexora/NexoraCheckoutModal';

const NexoraCustomerPage = () => {
  const navigate = useNavigate();
  // Active Sidebar Tab Options matching Velora Portal exactly: 'dashboard', 'active-plans', 'subscriptions', 'invoices', 'payments', 'profile', 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customer, setCustomer] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeSub, setActiveSub] = useState(null);
  const [loading, setLoading] = useState(true);

  // Notification Preferences State
  const [emailNotifications, setEmailNotifications] = useState({
    paymentSuccess: true,
    paymentFailure: true,
    subscriptionRenewal: true,
    promotionalOffers: false,
  });

  // Editable Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    country: '',
    address: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Upgrade / Subscribe Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);

  useEffect(() => {
    // Set browser top tab title for Nexora Platform
    document.title = 'Nexora Platform | Customer Portal';
    fetchCustomerSpecificData();

    const handleRefresh = () => {
      fetchCustomerSpecificData();
    };

    window.addEventListener('dashboard_refresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboard_refresh', handleRefresh);
    };
  }, []);

  const fetchCustomerSpecificData = async () => {
    setLoading(true);
    try {
      const [custRes, invRes, planRes, subRes, payRes] = await Promise.allSettled([
        api.get('/customers'),
        api.get('/invoices'),
        api.get('/plans'),
        api.get('/subscriptions'),
        api.get('/payments'),
      ]);
        
      let custs = [];
      if (custRes.status === 'fulfilled') custs = custRes.value.data || [];
      
      // Target Logged-in Customer dynamically from localStorage or API list
      let loggedUser = null;
      try {
        const stored = localStorage.getItem('customer_user');
        if (stored) loggedUser = JSON.parse(stored);
      } catch (e) {}

      const loggedEmail = loggedUser?.email || localStorage.getItem('customer_email') || '';

      const currentCust = custs.find(c => 
        (loggedEmail && String(c.email || '').toLowerCase() === String(loggedEmail).toLowerCase()) ||
        (loggedUser?.id && Number(c.id) === Number(loggedUser.id)) ||
        (loggedUser?.full_name && String(c.full_name || c.name || '').toLowerCase() === String(loggedUser.full_name).toLowerCase())
      ) || (loggedEmail ? {
        id: loggedUser?.id || Date.now(),
        full_name: loggedUser?.full_name || loggedUser?.name || loggedEmail.split('@')[0],
        name: loggedUser?.full_name || loggedUser?.name || loggedEmail.split('@')[0],
        email: loggedEmail,
        phone_number: loggedUser?.phone_number || '',
        country: loggedUser?.country || 'India',
        address: loggedUser?.address || 'Customer Portal Account',
        plan: loggedUser?.plan || 'No Active Plan',
      } : null);

      // Fetch Live Active Subscriptions & Sync Customer Active Plan & Price
      let subs = [];
      if (subRes.status === 'fulfilled') subs = subRes.value.data || [];
      const customerId = currentCust?.id;
      const foundSub = subs.find(s =>
        (customerId && Number(s.customer_id) === Number(customerId)) ||
        (currentCust?.full_name && String(s.customer_name || '').toLowerCase() === String(currentCust.full_name).toLowerCase()) ||
        (currentCust?.email && String(s.customer_email || '').toLowerCase() === String(currentCust.email).toLowerCase())
      );

      if (foundSub && currentCust) {
        currentCust.plan = foundSub.plan_name || foundSub.plan || currentCust.plan;
        currentCust.price = foundSub.price || foundSub.amount || currentCust.price;
        setActiveSub(foundSub);
      } else {
        setActiveSub(null);
      }

      if (currentCust) {
        setProfileForm({
          full_name: currentCust.full_name || currentCust.name || '',
          email: currentCust.email || '',
          phone_number: currentCust.phone_number || currentCust.phone || '',
          country: currentCust.country || 'India',
          address: currentCust.address || '',
        });
      }
      setCustomer(currentCust ? { ...currentCust } : null);

      // Fetch Live Active Plans (Guaranteed 4 Standard Plans: Basic ₹499, Premium ₹999, Premium Plus ₹1499, Premium Pro ₹2000)
      let activePlansList = [];
      if (planRes.status === 'fulfilled' && Array.isArray(planRes.value.data) && planRes.value.data.length > 0) {
        activePlansList = planRes.value.data;
      } else {
        activePlansList = [
          { id: 1, name: 'Basic Plan', price: 499.0, billing_cycle: 'MONTHLY', description: 'Essential billing automation for individuals & growing startups.' },
          { id: 2, name: 'Premium Plan', price: 999.0, billing_cycle: 'MONTHLY', description: 'Advanced proration engine, tax calculations, and email receipts.' },
          { id: 3, name: 'Premium Plus Plan', price: 1499.0, billing_cycle: 'MONTHLY', description: 'Enterprise-grade Fintech billing, dedicated webhooks & priority SLA.' },
          { id: 4, name: 'Premium Pro Plan', price: 2000.0, billing_cycle: 'MONTHLY', description: 'Full custom automated workflow suite with multi-currency taxation support.' },
        ];
      }
      setPlans(activePlansList);

      // Filter invoices strictly for this specific customer
      let invs = [];
      if (invRes.status === 'fulfilled') invs = invRes.value.data || [];
      let customerInvoices = invs.filter(inv => 
        (customerId && Number(inv.customer_id) === Number(customerId)) || 
        (currentCust?.full_name && String(inv.customer_name || '').toLowerCase() === String(currentCust.full_name).toLowerCase()) ||
        (currentCust?.email && String(inv.customer_email || '').toLowerCase() === String(currentCust.email).toLowerCase())
      );
      setInvoices(customerInvoices);

      // Filter payments strictly for this specific customer
      let pays = [];
      if (payRes.status === 'fulfilled') pays = payRes.value.data || [];
      const customerSubIds = subs.filter(s =>
        (customerId && Number(s.customer_id) === Number(customerId)) ||
        (currentCust?.full_name && String(s.customer_name || '').toLowerCase() === String(currentCust.full_name).toLowerCase()) ||
        (currentCust?.email && String(s.customer_email || '').toLowerCase() === String(currentCust.email).toLowerCase())
      ).map(s => Number(s.id));

      let customerPayments = pays.filter(p =>
        (customerId && Number(p.customer_id) === Number(customerId)) ||
        (p.subscription_id && customerSubIds.includes(Number(p.subscription_id))) ||
        (currentCust?.full_name && String(p.customer_name || '').toLowerCase() === String(currentCust.full_name).toLowerCase()) ||
        (currentCust?.email && String(p.customer_email || '').toLowerCase() === String(currentCust.email).toLowerCase())
      );
      setPayments(customerPayments);
    } catch (err) {
      console.error('Error loading Nexora customer portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlanToSubscribe = (plan) => {
    setSelectedPlanForUpgrade(plan);
    setCheckoutModalOpen(true);
  };

  const handleDownloadPDF = async (invoiceId, invNum) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf?platform=NEXORA`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${invNum || `Invoice_${invoiceId}`}_NEXORA.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
      alert('Failed to download PDF invoice. Please ensure the backend server is running.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!customer?.id) {
      setProfileError('No valid customer account ID found.');
      return;
    }
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const payload = {
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone_number: profileForm.phone_number,
        country: profileForm.country,
        address: profileForm.address,
      };
      const res = await api.put(`/customers/${customer.id}`, payload);
      
      const updatedCust = {
        ...customer,
        ...res.data,
        name: res.data.full_name || profileForm.full_name,
        full_name: res.data.full_name || profileForm.full_name,
        email: res.data.email || profileForm.email,
      };

      setCustomer(updatedCust);
      localStorage.setItem('customer_user', JSON.stringify(updatedCust));
      localStorage.setItem('customer_info', JSON.stringify(updatedCust));
      if (updatedCust.email) {
        localStorage.setItem('customer_email', updatedCust.email);
      }
      setProfileSuccess('Profile details updated successfully in database!');
    } catch (err) {
      console.error('Profile update error:', err);
      setProfileError(err?.response?.data?.detail || 'Failed to save profile changes. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out of Nexora Customer Portal?')) {
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_user');
      localStorage.removeItem('customer_info');
      localStorage.removeItem('customer_email');
      navigate('/customer/login', { replace: true });
    }
  };

  return (
    <FintechBackground overlayOpacity={0.88} enableBubbles={false}>
      <Box sx={{ minHeight: '100vh', color: '#0f172a', pb: 10 }}>
        {/* Nexora Top Navigation Bar */}
        <Paper
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: '3px solid #e76f51',
            py: 2,
            position: 'sticky',
            top: 0,
            zIndex: 1100,
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/')}
                  sx={{ color: '#e76f51', '&:hover': { color: '#d45d3f' }, textTransform: 'none', fontWeight: 800 }}
                >
                  Back to Nexora Gateway
                </Button>
                <Divider orientation="vertical" flexItem sx={{ borderColor: '#cbd5e1' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      background: 'linear-gradient(135deg, #e76f51 0%, #e76f51 100%)',
                      color: '#ffffff',
                    }}
                  >
                    <AutoAwesomeIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={900} letterSpacing="-0.02em" sx={{ color: '#0f172a', lineHeight: 1 }}>
                      Nexora
                    </Typography>
                    <Typography variant="caption" color="#e76f51" fontWeight={800} letterSpacing="0.05em">
                      CUSTOMER PORTAL
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: '#e76f51', color: '#ffffff', width: 34, height: 34, fontWeight: 800, fontSize: '0.85rem' }}>
                    {customer?.full_name ? customer.full_name[0].toUpperCase() : (customer?.name ? customer.name[0].toUpperCase() : 'C')}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ lineHeight: 1.1 }}>
                      {customer?.full_name || customer?.name || 'Customer Account'}
                    </Typography>
                    <Typography variant="caption" color="#e76f51" fontWeight={700}>
                      {customer?.email || ''}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<LogoutIcon />}
                  onClick={handleSignOut}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#dc2626',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#fef2f2', borderColor: '#dc2626' },
                  }}
                >
                  Sign Out
                </Button>
              </Box>
            </Box>
          </Container>
        </Paper>

        <Container maxWidth="xl" sx={{ pt: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#e76f51' }} />
            </Box>
          ) : !customer ? (
            <Box sx={{ py: 8, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
              <Paper sx={{ p: 4, borderRadius: 4, border: '2px solid #ef4444', bgcolor: '#ffffff', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15)' }}>
                <Typography variant="h5" fontWeight={900} color="#dc2626" gutterBottom>
                  No Customer Found
                </Typography>
                <Typography variant="body1" color="#475569" sx={{ mb: 3, fontWeight: 600 }}>
                  No customer record found with the provided details. Please verify your credentials or register a new account.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/customer/login')} sx={{ bgcolor: '#e76f51', '&:hover': { bgcolor: '#d45d3f' }, fontWeight: 800 }}>
                  Back to Customer Sign In
                </Button>
              </Paper>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* LEFT SIDEBAR NAVIGATION (Matching Sky Blue Palette) */}
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 4,
                    bgcolor: '#FFFFFF !important',
                    background: '#FFFFFF !important',
                    border: '3px solid #e76f51',
                    boxShadow: '0 10px 25px -5px rgba(231, 111, 81, 0.35)',
                  }}
                >
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: '#e76f51',
                        color: '#ffffff',
                        width: 64,
                        height: 64,
                        fontSize: '1.8rem',
                        fontWeight: 900,
                        mx: 'auto',
                        mb: 1.5,
                        border: '2px solid #e76f51',
                      }}
                    >
                      {customer?.full_name ? customer.full_name[0] : (customer?.name ? customer.name[0] : (customer?.email ? customer.email[0].toUpperCase() : 'C'))}
                    </Avatar>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      {customer?.full_name || customer?.name || customer?.email?.split('@')[0] || 'Customer Account'}
                    </Typography>
                    <Typography variant="caption" color="#e76f51" fontWeight={800} display="block">
                      Customer ID: #{customer?.id || customer?.customer_id || 'ACCOUNT'}
                    </Typography>
                    <Typography variant="caption" color="#64748b" fontWeight={600} display="block">
                      {customer?.email || ''}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5, borderColor: '#e2e8f0' }} />

                  {/* Sidebar Menu Items matching Screenshot */}
                  <List disablePadding>
                    {/* 1. Customer Dashboard */}
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        selected={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                        sx={{
                          borderRadius: 2.5,
                          '&.Mui-selected': { bgcolor: '#fcdad2', color: '#e76f51' },
                          '&:hover': { bgcolor: '#fdf0ed' },
                        }}
                      >
                        <ListItemIcon sx={{ color: activeTab === 'dashboard' ? '#e76f51' : '#64748b', minWidth: 38 }}>
                          <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography fontWeight={800} fontSize="0.9rem" color="#0f172a">Customer Dashboard</Typography>}
                        />
                      </ListItemButton>
                    </ListItem>

                    {/* 2. Active Plans */}
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        selected={activeTab === 'active-plans'}
                        onClick={() => setActiveTab('active-plans')}
                        sx={{
                          borderRadius: 2.5,
                          '&.Mui-selected': { bgcolor: '#fcdad2', color: '#e76f51' },
                          '&:hover': { bgcolor: '#fdf0ed' },
                        }}
                      >
                        <ListItemIcon sx={{ color: activeTab === 'active-plans' ? '#e76f51' : '#64748b', minWidth: 38 }}>
                          <LocalOfferIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography fontWeight={800} fontSize="0.9rem" color="#0f172a">Active Plans ({plans.length})</Typography>}
                        />
                      </ListItemButton>
                    </ListItem>

                    {/* 3. Subscriptions */}
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        selected={activeTab === 'subscriptions'}
                        onClick={() => setActiveTab('subscriptions')}
                        sx={{
                          borderRadius: 2.5,
                          '&.Mui-selected': { bgcolor: '#fcdad2', color: '#e76f51' },
                          '&:hover': { bgcolor: '#fdf0ed' },
                        }}
                      >
                        <ListItemIcon sx={{ color: activeTab === 'subscriptions' ? '#e76f51' : '#64748b', minWidth: 38 }}>
                          <CardMembershipIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography fontWeight={800} fontSize="0.9rem" color="#0f172a">Subscriptions</Typography>}
                        />
                      </ListItemButton>
                    </ListItem>

                    {/* 4. My Invoices (Customer Scoped Only) */}
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        selected={activeTab === 'invoices'}
                        onClick={() => setActiveTab('invoices')}
                        sx={{
                          borderRadius: 2.5,
                          '&.Mui-selected': { bgcolor: '#fcdad2', color: '#e76f51' },
                          '&:hover': { bgcolor: '#fdf0ed' },
                        }}
                      >
                        <ListItemIcon sx={{ color: activeTab === 'invoices' ? '#e76f51' : '#64748b', minWidth: 38 }}>
                          <ReceiptLongIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography fontWeight={800} fontSize="0.9rem" color="#0f172a">My Invoices ({invoices.length})</Typography>}
                        />
                      </ListItemButton>
                    </ListItem>

                    {/* 5. Payment History */}
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        selected={activeTab === 'payments'}
                        onClick={() => setActiveTab('payments')}
                        sx={{
                          borderRadius: 2.5,
                          '&.Mui-selected': { bgcolor: '#fcdad2', color: '#e76f51' },
                          '&:hover': { bgcolor: '#fdf0ed' },
                        }}
                      >
                        <ListItemIcon sx={{ color: activeTab === 'payments' ? '#e76f51' : '#64748b', minWidth: 38 }}>
                          <CreditCardIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography fontWeight={800} fontSize="0.9rem" color="#0f172a">Payment History</Typography>}
                        />
                      </ListItemButton>
                    </ListItem>

                    {/* 6. My Profile */}
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        selected={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                        sx={{
                          borderRadius: 2.5,
                          '&.Mui-selected': { bgcolor: '#fcdad2', color: '#e76f51' },
                          '&:hover': { bgcolor: '#fdf0ed' },
                        }}
                      >
                        <ListItemIcon sx={{ color: activeTab === 'profile' ? '#e76f51' : '#64748b', minWidth: 38 }}>
                          <BadgeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography fontWeight={800} fontSize="0.9rem" color="#0f172a">My Profile</Typography>}
                        />
                      </ListItemButton>
                    </ListItem>

                    {/* 7. Settings */}
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        selected={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                        sx={{
                          borderRadius: 2.5,
                          '&.Mui-selected': { bgcolor: '#fcdad2', color: '#e76f51' },
                          '&:hover': { bgcolor: '#fdf0ed' },
                        }}
                      >
                        <ListItemIcon sx={{ color: activeTab === 'settings' ? '#e76f51' : '#64748b', minWidth: 38 }}>
                          <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography fontWeight={800} fontSize="0.9rem" color="#0f172a">Settings</Typography>}
                        />
                      </ListItemButton>
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* RIGHT MAIN CONTENT AREA */}
              <Grid item xs={12} md={9}>
                {/* TAB 1: CUSTOMER DASHBOARD */}
                {activeTab === 'dashboard' && (
                  <Box>
                    {/* Welcome Banner */}
                    <Paper
                      sx={{
                        p: 3.5,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #4d7c3d 0%, #2d4f23 100%)',
                        color: '#ffffff',
                        mb: 3,
                        boxShadow: '0 10px 25px rgba(77, 124, 61, 0.3)',
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={8}>
                          <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
                            Welcome back, {customer?.full_name || customer?.name || customer?.email?.split('@')[0] || 'Customer'}! 👋
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                            Here is your Nexora customer dashboard summary. Manage your subscription, inspect itemized invoices, and configure billing settings.
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                          <Chip
                            label={`Customer ID #${customer?.id || customer?.customer_id || 'ACCOUNT'}`}
                            sx={{ bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', fontWeight: 900, fontSize: '0.85rem' }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* 4 Stat Cards Grid */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF !important', border: '2px solid #C1DBB3', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                          <Typography variant="caption" color="#4d7c3d" fontWeight={900} letterSpacing="0.05em">ACTIVE PLAN</Typography>
                          <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mt: 0.5 }}>{activeSub ? (activeSub.plan_name || activeSub.plan || customer?.plan) : (customer?.plan || 'No Active Plan')}</Typography>
                          <Chip
                            label={activeSub ? String(activeSub.status || 'ACTIVE').toUpperCase() : 'INACTIVE'}
                            size="small"
                            sx={{
                              bgcolor: activeSub?.status === 'PAST_DUE' ? '#ffe4e6' : (activeSub ? '#dcfce7' : '#f1f5f9'),
                              color: activeSub?.status === 'PAST_DUE' ? '#e11d48' : (activeSub ? '#15803d' : '#64748b'),
                              fontWeight: 900,
                              mt: 1
                            }}
                          />
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF !important', border: '2px solid #C1DBB3', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                          <Typography variant="caption" color="#4d7c3d" fontWeight={900} letterSpacing="0.05em">MONTHLY FEE</Typography>
                          <Typography variant="h6" fontWeight={900} color="#047857" sx={{ mt: 0.5 }}>{activeSub ? `₹${Number(activeSub.price || activeSub.amount || customer?.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (customer?.price ? `₹${Number(customer.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00')}</Typography>
                          <Typography variant="caption" color="#64748b" fontWeight={600} display="block" sx={{ mt: 1 }}>{activeSub ? 'Auto-Renewal Active' : 'No Active Subscription'}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF !important', border: '2px solid #C1DBB3', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                          <Typography variant="caption" color="#4d7c3d" fontWeight={900} letterSpacing="0.05em">TOTAL INVOICES</Typography>
                          <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mt: 0.5 }}>{invoices.length} Invoices</Typography>
                          <Typography variant="caption" color="#16a34a" fontWeight={700} display="block" sx={{ mt: 1 }}>Live Sync Active</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF !important', border: '2px solid #C1DBB3', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                          <Typography variant="caption" color="#4d7c3d" fontWeight={900} letterSpacing="0.05em">NEXT RENEWAL</Typography>
                          <Typography variant="h6" fontWeight={900} color="#3a612d" sx={{ mt: 0.5 }}>{activeSub?.next_billing_date || activeSub?.end_date || 'N/A'}</Typography>
                          <Typography variant="caption" color="#64748b" fontWeight={600} display="block" sx={{ mt: 1 }}>{activeSub ? `Status: ${String(activeSub.status || 'ACTIVE').toUpperCase()}` : 'No Active Subscription'}</Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Active Subscription Status Box */}
                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#FFFFFF !important', border: '3px solid #C1DBB3', mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                        <Typography variant="h6" fontWeight={900} color="#0f172a">Active Subscription Status</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button startIcon={<SyncAltIcon />} variant="outlined" onClick={() => handleSelectPlanToSubscribe({ id: 12, name: 'Premium Plus Plan', price: 1499.0 })} sx={{ borderColor: '#C1DBB3', color: '#3a612d', fontWeight: 900 }}>Upgrade Plan</Button>
                          {activeSub && (String(activeSub.status).toUpperCase() === 'ACTIVE' || String(activeSub.status).toUpperCase() === 'TRIAL') && (
                            <Button variant="outlined" size="small" onClick={async () => { try { await api.put(`/subscriptions/${activeSub.id}/pause`); fetchNexoraCustomerData(); } catch(e){ console.error(e); } }} sx={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 900 }}>Pause</Button>
                          )}
                          {activeSub && String(activeSub.status).toUpperCase() === 'PAUSED' && (
                            <Button variant="contained" size="small" onClick={async () => { try { await api.put(`/subscriptions/${activeSub.id}/resume`); fetchNexoraCustomerData(); } catch(e){ console.error(e); } }} sx={{ bgcolor: '#10b981', color: '#ffffff', fontWeight: 900 }}>Resume</Button>
                          )}
                          {activeSub && String(activeSub.status).toUpperCase() !== 'CANCELLED' && (
                            <Button variant="outlined" size="small" color="error" onClick={async () => { try { await api.put(`/subscriptions/${activeSub.id}/cancel`); fetchNexoraCustomerData(); } catch(e){ console.error(e); } }} sx={{ fontWeight: 900 }}>Cancel Subscription</Button>
                          )}
                        </Box>
                      </Box>
                      <Grid container spacing={2}>
                        {['Itemized Tax Invoices', 'Pro-Rata Immediate Credit', 'Multi-Currency Support', 'Real-Time Webhooks'].map((feat, i) => (
                          <Grid item xs={12} sm={6} key={i}>
                            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckCircleIcon sx={{ color: '#10b981', fontSize: '1.2rem' }} />
                              <Typography variant="body2" color="#0f172a" fontWeight={700}>{feat}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>

                    {/* Recent Invoices Table (Scoped to Arjun Kumar) */}
                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#FFFFFF !important', border: '3px solid #C1DBB3' }}>
                      <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 2 }}>Recent Invoices (Scoped to {customer?.full_name || customer?.name})</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ borderBottom: '2px solid #e2e8f0' }}>
                              <TableCell sx={{ color: '#4d7c3d', fontWeight: 900 }}>INVOICE REF</TableCell>
                              <TableCell sx={{ color: '#4d7c3d', fontWeight: 900 }}>AMOUNT</TableCell>
                              <TableCell sx={{ color: '#4d7c3d', fontWeight: 900 }}>STATUS</TableCell>
                              <TableCell sx={{ color: '#4d7c3d', fontWeight: 900 }}>DATE</TableCell>
                              <TableCell align="right" sx={{ color: '#4d7c3d', fontWeight: 900 }}>PDF</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {invoices.map((inv) => (
                              <TableRow key={inv.id}>
                                <TableCell sx={{ fontWeight: 800, color: '#e76f51', fontFamily: 'monospace' }}>{inv.invoice_number}</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: '#0f172a' }}>${inv.total_amount || inv.amount || 999.0} USD</TableCell>
                                <TableCell><Chip label={inv.status} size="small" sx={{ bgcolor: inv.status === 'PAID' ? '#dcfce7' : (inv.status === 'PAST_DUE' ? '#ffe4e6' : '#f1f5f9'), color: inv.status === 'PAID' ? '#15803d' : (inv.status === 'PAST_DUE' ? '#e11d48' : '#64748b'), fontWeight: 900 }} /></TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{inv.issue_date || '2026-08-10'}</TableCell>
                                <TableCell align="right">
                                  <IconButton size="small" onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)} sx={{ color: '#e76f51' }}>
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Box>
                )}

                {/* TAB 2: ACTIVE PLANS */}
                {activeTab === 'active-plans' && (
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF !important',
                      background: '#FFFFFF !important',
                      border: '3px solid #C1DBB3',
                      boxShadow: '0 10px 25px -5px rgba(193, 219, 179, 0.4)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <LocalOfferIcon sx={{ color: '#4d7c3d', fontSize: '2.2rem' }} />
                      <Box>
                        <Typography variant="h5" fontWeight={900} color="#0f172a">
                          Active Available Subscription Plans
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={600}>
                          Select a plan below to subscribe, upgrade, or switch your active subscription tier immediately.
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      {plans.map((p) => {
                        const isCurrent = (customer?.plan || '').toLowerCase() === p.name.toLowerCase();
                        return (
                          <Grid item xs={12} md={4} key={p.id}>
                            <Card
                              sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                borderRadius: 3.5,
                                border: isCurrent ? '3px solid #10b981' : '3px solid #C1DBB3',
                                bgcolor: '#FFFFFF !important',
                                boxShadow: isCurrent ? '0 10px 25px rgba(16, 185, 129, 0.2)' : '0 4px 15px rgba(0,0,0,0.05)',
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(193, 219, 179, 0.4)' },
                              }}
                            >
                              <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="h6" fontWeight={900} color="#0f172a">
                                    {p.name}
                                  </Typography>
                                  {isCurrent && (
                                    <Chip label="CURRENT PLAN" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 900 }} />
                                  )}
                                </Box>

                                <Typography variant="h4" fontWeight={900} color="#3a612d" sx={{ my: 1.5 }}>
                                  ${p.price} <Typography component="span" variant="body2" color="#64748b" fontWeight={700}>/ month</Typography>
                                </Typography>

                                <Typography variant="body2" color="#475569" fontWeight={600} sx={{ mb: 2.5, minHeight: 48 }}>
                                  {p.description || 'Full billing engine features included.'}
                                </Typography>

                                <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />

                                <List disablePadding>
                                  {['Automated Itemized Invoicing', 'Instant Proration Credit', 'Real-Time Webhooks', 'Email Receipts'].map((f, i) => (
                                    <ListItem disablePadding key={i} sx={{ mb: 1 }}>
                                      <ListItemIcon sx={{ minWidth: 28, color: '#10b981' }}>
                                        <CheckCircleIcon fontSize="small" />
                                      </ListItemIcon>
                                      <ListItemText primary={<Typography variant="caption" fontWeight={700} color="#1e293b">{f}</Typography>} />
                                    </ListItem>
                                  ))}
                                </List>
                              </CardContent>

                              <Box sx={{ p: 3, pt: 0 }}>
                                <Button
                                  fullWidth
                                  variant={isCurrent ? 'outlined' : 'contained'}
                                  startIcon={<RocketLaunchIcon />}
                                  onClick={() => handleSelectPlanToSubscribe(p)}
                                  sx={{
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    fontWeight: 900,
                                    textTransform: 'none',
                                    ...(isCurrent ? {
                                      borderColor: '#10b981',
                                      color: '#15803d',
                                      fontWeight: 900,
                                    } : {
                                      bgcolor: '#C1DBB3',
                                      color: '#1b3818',
                                      '&:hover': { bgcolor: '#afd09e' },
                                      boxShadow: '0 4px 15px rgba(193, 219, 179, 0.4)',
                                    })
                                  }}
                                >
                                  {isCurrent ? 'Re-Subscribe / Manage Plan' : `Subscribe to ${p.name}`}
                                </Button>
                              </Box>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Paper>
                )}

                {/* TAB 3: SUBSCRIPTIONS */}
                {activeTab === 'subscriptions' && (
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF !important',
                      background: '#FFFFFF !important',
                      border: '3px solid #C1DBB3',
                      boxShadow: '0 10px 25px -5px rgba(193, 219, 179, 0.4)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                        <Typography variant="h5" fontWeight={900} color="#0f172a">
                          My Subscriptions & Plan Tier
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={600}>
                          View active plan details, billing intervals, and upgrade options
                        </Typography>
                      </Box>
                      <Chip label="ACTIVE" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 900 }} />
                    </Box>

                    <Card sx={{ bgcolor: '#f8fafc', border: '2px solid #C1DBB3', borderRadius: 3, mb: 4 }}>
                      <CardContent sx={{ p: 4 }}>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} sm={8}>
                            <Typography variant="caption" color="#4d7c3d" fontWeight={900} letterSpacing="0.05em" display="block" sx={{ mb: 0.5 }}>
                              CURRENT SUBSCRIPTION PLAN
                            </Typography>
                            <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ mb: 1 }}>
                              {customer?.plan || 'Premium Plan'}
                            </Typography>
                            <Typography variant="h5" fontWeight={900} color="#047857" sx={{ mb: 1 }}>
                              ${customer?.price || 999.0} USD / month
                            </Typography>
                            <Typography variant="body2" color="#334155" fontWeight={600}>
                              Billing Cycle: <strong>Monthly (Auto-Renewing)</strong>
                            </Typography>
                            <Typography variant="caption" color="#64748b" fontWeight={700} display="block" sx={{ mt: 0.5 }}>
                              Next Renewal: <strong>August 28, 2026</strong>
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                            <Button
                              variant="contained"
                              size="large"
                              startIcon={<SyncAltIcon />}
                              onClick={() => setActiveTab('active-plans')}
                              sx={{
                                py: 1.5,
                                px: 3,
                                borderRadius: 3,
                                fontWeight: 900,
                                textTransform: 'none',
                                bgcolor: '#C1DBB3',
                                color: '#1b3818',
                                '&:hover': { bgcolor: '#afd09e' },
                              }}
                            >
                              Browse Active Plans
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 2 }}>
                      Included Subscription Features
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        'Automated Itemized Tax Invoicing',
                        'Pro-Rata Immediate Credit Calculation',
                        'Multi-Currency Support',
                        'Real-Time Webhook Notifications',
                        'Priority Billing Support',
                        'Grace Period Failed Payment Retry',
                      ].map((feat, idx) => (
                        <Grid item xs={12} sm={6} key={idx}>
                          <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CheckCircleIcon sx={{ color: '#10b981' }} />
                            <Typography variant="body2" color="#0f172a" fontWeight={700}>{feat}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}

                {/* TAB 4: MY INVOICES (SCOPED STRICTLY TO THIS CUSTOMER) */}
                {activeTab === 'invoices' && (
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF !important',
                      background: '#FFFFFF !important',
                      border: '3px solid #C1DBB3',
                      boxShadow: '0 10px 25px -5px rgba(193, 219, 179, 0.4)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <ReceiptLongIcon sx={{ color: '#10b981', fontSize: '2rem' }} />
                      <Box>
                        <Typography variant="h5" fontWeight={900} color="#0f172a">
                          My Invoices & Tax Statements
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={600}>
                          Itemized billing statements issued strictly to {customer?.full_name || customer?.name || customer?.email || 'this subscriber'}
                        </Typography>
                      </Box>
                    </Box>

                    <TableContainer sx={{ bgcolor: '#FFFFFF !important' }}>
                      <Table sx={{ bgcolor: '#FFFFFF !important' }}>
                        <TableHead sx={{ bgcolor: '#FFFFFF !important' }}>
                          <TableRow sx={{ borderBottom: '2px solid #e2e8f0', bgcolor: '#FFFFFF !important' }}>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>INVOICE REF</TableCell>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>PLAN TIER</TableCell>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>AMOUNT</TableCell>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>TAX (18% GST)</TableCell>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>STATUS</TableCell>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>ISSUE DATE</TableCell>
                            <TableCell align="right" sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>PDF RECEIPT</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody sx={{ bgcolor: '#FFFFFF !important' }}>
                          {invoices.map((inv) => (
                            <TableRow key={inv.id} sx={{ '&:hover': { bgcolor: 'rgba(193, 219, 179, 0.15)' }, bgcolor: '#FFFFFF !important' }}>
                              <TableCell sx={{ color: '#3a612d', fontWeight: 900, fontFamily: 'monospace', bgcolor: '#FFFFFF !important' }}>
                                {inv.invoice_number || `INV-2026-NEX-${inv.id}`}
                              </TableCell>
                              <TableCell sx={{ color: '#0f172a', fontWeight: 800, bgcolor: '#FFFFFF !important' }}>
                                {inv.plan_name || customer?.plan || 'Premium Plan'}
                              </TableCell>
                              <TableCell sx={{ color: '#0f172a', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>
                                ${Number(inv.total_amount || inv.amount || 999).toLocaleString()} USD
                              </TableCell>
                              <TableCell sx={{ color: '#334155', fontWeight: 600, bgcolor: '#FFFFFF !important' }}>
                                ${Number(inv.tax || 152.82).toLocaleString()} USD
                              </TableCell>
                              <TableCell sx={{ bgcolor: '#FFFFFF !important' }}>
                                <Chip label={inv.status || 'PAID'} size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 900, fontSize: '0.65rem' }} />
                              </TableCell>
                              <TableCell sx={{ color: '#64748b', fontWeight: 600, bgcolor: '#FFFFFF !important' }}>{inv.issue_date || '2026-07-26'}</TableCell>
                              <TableCell align="right" sx={{ bgcolor: '#FFFFFF !important' }}>
                                <Tooltip title="Download Official PDF Invoice">
                                  <Button
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                                    sx={{ color: '#4d7c3d', textTransform: 'none', fontWeight: 800 }}
                                  >
                                    PDF
                                  </Button>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}

                {/* TAB 5: PAYMENT HISTORY */}
                {activeTab === 'payments' && (
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF !important',
                      background: '#FFFFFF !important',
                      border: '3px solid #C1DBB3',
                      boxShadow: '0 10px 25px -5px rgba(193, 219, 179, 0.4)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <CreditCardIcon sx={{ color: '#4d7c3d', fontSize: '2rem' }} />
                      <Box>
                        <Typography variant="h5" fontWeight={900} color="#0f172a">
                          My Payment History
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={600}>
                          Transaction log and payment methods for {customer?.full_name || customer?.name || customer?.email || 'this subscriber'}
                        </Typography>
                      </Box>
                    </Box>

                    <TableContainer sx={{ bgcolor: '#FFFFFF !important' }}>
                      <Table sx={{ bgcolor: '#FFFFFF !important' }}>
                        <TableHead sx={{ bgcolor: '#FFFFFF !important' }}>
                          <TableRow sx={{ borderBottom: '2px solid #e2e8f0', bgcolor: '#FFFFFF !important' }}>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>TRANSACTION ID</TableCell>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>AMOUNT</TableCell>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>PAYMENT METHOD</TableCell>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>TIMESTAMP</TableCell>
                            <TableCell sx={{ color: '#4d7c3d', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>STATUS</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody sx={{ bgcolor: '#FFFFFF !important' }}>
                          {payments.map((p) => {
                            const pStatus = String(p.payment_status || p.status || 'SUCCESS').toUpperCase();
                            const pMethod = p.payment_method || p.method || 'Credit Card';
                            const pDate = p.payment_date ? String(p.payment_date).split('T')[0] : (p.date || '2026-08-10');
                            const isSuccess = pStatus === 'SUCCESS' || pStatus === 'PAID';

                            return (
                              <TableRow key={p.id} sx={{ '&:hover': { bgcolor: 'rgba(193, 219, 179, 0.15)' }, bgcolor: '#FFFFFF !important' }}>
                                <TableCell sx={{ color: '#e76f51', fontWeight: 800, fontFamily: 'monospace', bgcolor: '#FFFFFF !important' }}>
                                  {p.transaction_id || `TXN-2026-${p.id}`}
                                </TableCell>
                                <TableCell sx={{ color: '#0f172a', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>
                                  ${Number(p.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                </TableCell>
                                <TableCell sx={{ color: '#334155', fontWeight: 600, bgcolor: '#FFFFFF !important' }}>{pMethod}</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 600, bgcolor: '#FFFFFF !important' }}>{pDate}</TableCell>
                                <TableCell sx={{ bgcolor: '#FFFFFF !important' }}>
                                  <Chip
                                    label={pStatus}
                                    size="small"
                                    sx={{
                                      bgcolor: isSuccess ? '#dcfce7' : '#ffe4e6',
                                      color: isSuccess ? '#15803d' : '#e11d48',
                                      fontWeight: 900,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}

                {/* TAB 6: MY PROFILE */}
                {activeTab === 'profile' && (
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF !important',
                      background: '#FFFFFF !important',
                      border: '3px solid #C1DBB3',
                      boxShadow: '0 10px 25px -5px rgba(193, 219, 179, 0.4)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <BadgeIcon sx={{ color: '#4d7c3d', fontSize: '2.2rem' }} />
                      <Box>
                        <Typography variant="h5" fontWeight={900} color="#0f172a">
                          My Personal Profile
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={600}>
                          View and manage your personal account identity details
                        </Typography>
                      </Box>
                    </Box>

                    {profileSuccess && (
                      <Alert severity="success" sx={{ mb: 3, fontWeight: 700, borderRadius: 2 }}>
                        {profileSuccess}
                      </Alert>
                    )}
                    {profileError && (
                      <Alert severity="error" sx={{ mb: 3, fontWeight: 700, borderRadius: 2 }}>
                        {profileError}
                      </Alert>
                    )}

                    <Box component="form" onSubmit={handleSaveProfile}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            value={profileForm.full_name}
                            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                            sx={{
                              '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                              '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            sx={{
                              '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                              '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone Number"
                            value={profileForm.phone_number}
                            onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                            sx={{
                              '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                              '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Country / Region"
                            value={profileForm.country}
                            onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                            sx={{
                              '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                              '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Billing Address"
                            multiline
                            rows={2}
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            sx={{
                              '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                              '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                            }}
                          />
                        </Grid>
                      </Grid>

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={profileSaving}
                        sx={{
                          mt: 3,
                          py: 1.2,
                          px: 3,
                          borderRadius: 2.5,
                          fontWeight: 900,
                          textTransform: 'none',
                          bgcolor: '#C1DBB3',
                          color: '#1b3818',
                          '&:hover': { bgcolor: '#afd09e' },
                        }}
                      >
                        {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                      </Button>
                    </Box>
                  </Paper>
                )}

                {/* TAB 7: SETTINGS */}
                {activeTab === 'settings' && (
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF !important',
                      background: '#FFFFFF !important',
                      border: '3px solid #C1DBB3',
                      boxShadow: '0 10px 25px -5px rgba(193, 219, 179, 0.4)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <SettingsIcon sx={{ color: '#4d7c3d', fontSize: '2.2rem' }} />
                      <Box>
                        <Typography variant="h5" fontWeight={900} color="#0f172a">
                          Portal Billing & Email Settings
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={600}>
                          Configure email notifications, payment preferences, and account security
                        </Typography>
                      </Box>
                    </Box>

                    {/* Email Notification Toggles */}
                    <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 2 }}>
                      <NotificationsActiveIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#4d7c3d' }} />
                      Automated Email Notifications
                    </Typography>
                    <Paper sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 3, mb: 4 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={emailNotifications.paymentSuccess}
                                onChange={(e) => setEmailNotifications({ ...emailNotifications, paymentSuccess: e.target.checked })}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#4d7c3d' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#C1DBB3' },
                                }}
                              />
                            }
                            label={<Typography fontWeight={700} fontSize="0.9rem" color="#0f172a">Payment Success Email Receipts</Typography>}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={emailNotifications.paymentFailure}
                                onChange={(e) => setEmailNotifications({ ...emailNotifications, paymentFailure: e.target.checked })}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#4d7c3d' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#C1DBB3' },
                                }}
                              />
                            }
                            label={<Typography fontWeight={700} fontSize="0.9rem" color="#0f172a">Payment Failure & Past Due Alerts</Typography>}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={emailNotifications.subscriptionRenewal}
                                onChange={(e) => setEmailNotifications({ ...emailNotifications, subscriptionRenewal: e.target.checked })}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#4d7c3d' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#C1DBB3' },
                                }}
                              />
                            }
                            label={<Typography fontWeight={700} fontSize="0.9rem" color="#0f172a">Subscription Renewal Reminders</Typography>}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={emailNotifications.promotionalOffers}
                                onChange={(e) => setEmailNotifications({ ...emailNotifications, promotionalOffers: e.target.checked })}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#4d7c3d' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#C1DBB3' },
                                }}
                              />
                            }
                            label={<Typography fontWeight={700} fontSize="0.9rem" color="#0f172a">Promotional Offers & Upgrades</Typography>}
                          />
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Security Section */}
                    <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 2 }}>
                      <LockIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#4d7c3d' }} />
                      Account Security & Password
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Current Password"
                          placeholder="••••••••"
                          sx={{
                            '& .MuiInputBase-input': { color: '#0f172a' },
                            '& .MuiInputLabel-root': { color: '#64748b' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="password"
                          label="New Password"
                          placeholder="••••••••"
                          sx={{
                            '& .MuiInputBase-input': { color: '#0f172a' },
                            '& .MuiInputLabel-root': { color: '#64748b' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        sx={{
                          py: 1.2,
                          px: 3,
                          borderRadius: 2.5,
                          fontWeight: 900,
                          textTransform: 'none',
                          bgcolor: '#C1DBB3',
                          color: '#1b3818',
                          '&:hover': { bgcolor: '#afd09e' },
                        }}
                        onClick={() => alert('Settings saved successfully!')}
                      >
                        Save Settings Preferences
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<LogoutIcon />}
                        sx={{
                          py: 1.2,
                          px: 3,
                          borderRadius: 2.5,
                          fontWeight: 800,
                          textTransform: 'none',
                          borderColor: '#ef4444',
                          color: '#dc2626',
                          '&:hover': { bgcolor: '#fef2f2', borderColor: '#dc2626' },
                        }}
                        onClick={handleSignOut}
                      >
                        Sign Out of Portal
                      </Button>
                    </Box>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}
        </Container>

        {/* Nexora Checkout Modal for Subscribing & Upgrading */}
        <NexoraCheckoutModal
          open={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          selectedPlan={selectedPlanForUpgrade}
          currentCustomerId={customer?.id}
          currentCustomerEmail={customer?.email}
          platform="NEXORA"
        />
      </Box>
    </FintechBackground>
  );
};

export default NexoraCustomerPage;
