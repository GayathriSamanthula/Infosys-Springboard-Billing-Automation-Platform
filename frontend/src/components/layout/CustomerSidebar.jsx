import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { customerPortalService } from '../../services/customerPortalService';

export const CUSTOMER_NAV_ITEMS = [
  { title: 'Customer Dashboard', path: '/customer/dashboard', icon: DashboardIcon },
  { title: 'Available Plans', path: '/customer/plans', icon: LocalOfferIcon },
  { title: 'Subscriptions', path: '/customer/subscriptions', icon: CardMembershipIcon },
  { title: 'My Invoices', path: '/customer/invoices', icon: ReceiptIcon },
  { title: 'Payment History', path: '/customer/payments', icon: CreditCardIcon },
  { title: 'My Profile', path: '/customer/profile', icon: PersonIcon },
  { title: 'Settings', path: '/customer/settings', icon: SettingsIcon },
];

const CustomerSidebar = ({ mobileOpen, onDrawerToggle, drawerWidth = 260, activePlanName: propPlanName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [livePlanName, setLivePlanName] = React.useState(propPlanName || '');

  const currentCust = customerPortalService.getCurrentCustomer() || {};

  React.useEffect(() => {
    if (propPlanName) {
      setLivePlanName(propPlanName);
      return;
    }
    const fetchLivePlan = async () => {
      try {
        const custId = currentCust.customer_id || currentCust.id;
        if (custId) {
          const portalData = await customerPortalService.getDashboardData(custId);
          const activePlan = portalData?.active_subscription?.plan_name || portalData?.summary?.active_plan_name;
          if (activePlan) {
            setLivePlanName(activePlan);
          }
        }
      } catch (err) {
        console.error('Error fetching live sidebar plan:', err);
      }
    };
    fetchLivePlan();
  }, [propPlanName, currentCust.customer_id, currentCust.id]);

  const displayPlanName = livePlanName || currentCust.plan || 'No Active Plan';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#ffffff', color: '#0f172a', borderRight: '1.5px solid #fcdad2' }}>
      {/* Nexora Customer Brand Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/nexora-logo.png"
          alt="Nexora Logo"
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            objectFit: 'contain',
            boxShadow: '0 4px 12px rgba(231, 111, 81, 0.3)',
          }}
        />
        <Box>
          <Typography
            variant="h6"
            fontWeight={900}
            letterSpacing="-0.02em"
            sx={{
              color: '#e76f51',
              lineHeight: 1.1,
              fontSize: '1.2rem',
            }}
          >
            Nexora
          </Typography>
          <Typography variant="caption" sx={{ color: '#d45d3f', fontSize: '0.7rem', fontWeight: 800 }}>
            Customer Portal • Active
          </Typography>
        </Box>
        <Chip label={displayPlanName} size="small" sx={{ ml: 'auto', bgcolor: '#fcdad2', color: '#e76f51', border: '1px solid #e76f51', fontSize: '0.65rem', fontWeight: 900 }} />
      </Box>

      <Divider sx={{ borderColor: '#fcdad2' }} />

      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Customer Navigation
        </Typography>
      </Box>

      <List sx={{ px: 1.5, flex: 1 }}>
        {CUSTOMER_NAV_ITEMS.map((item, idx) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <ListItem disablePadding key={idx} sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpen) onDrawerToggle();
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  bgcolor: isActive ? '#fcdad2' : 'transparent',
                  color: isActive ? '#e76f51' : '#64748b',
                  borderLeft: isActive ? '3.5px solid #e76f51' : '3.5px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive ? '#fcdad2' : '#fdf0ed',
                    color: '#e76f51',
                    '& .MuiListItemIcon-root': { color: '#e76f51' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#e76f51' : '#64748b' }}>
                  <IconComponent fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 800 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none', bgcolor: '#ffffff' },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e0f2fe', bgcolor: '#ffffff' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default CustomerSidebar;
