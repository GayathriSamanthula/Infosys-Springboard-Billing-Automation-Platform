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
import PeopleIcon from '@mui/icons-material/People';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { NAV_ITEMS } from '../../constants/navigation';

const iconMap = {
  Dashboard: DashboardIcon,
  People: PeopleIcon,
  Loyalty: LoyaltyIcon,
  Autorenew: AutorenewIcon,
  EventRepeat: EventRepeatIcon,
  Receipt: ReceiptIcon,
  CreditCard: CreditCardIcon,
  MoneyOff: MoneyOffIcon,
  Notifications: NotificationsIcon,
  History: HistoryIcon,
};

const Sidebar = ({ mobileOpen, onDrawerToggle, drawerWidth = 260 }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#ffffff', color: '#0f172a' }}>
      {/* Brand Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 6px 16px rgba(14, 165, 233, 0.3)',
          }}
        >
          <AutoAwesomeIcon fontSize="small" />
        </Box>
        <Box>
          <Typography
            variant="h6"
            fontWeight={900}
            letterSpacing="-0.02em"
            sx={{
              color: '#0ea5e9',
              lineHeight: 1.1,
              fontSize: '1.25rem',
            }}
          >
            Nexora
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>
            SaaS Billing Platform
          </Typography>
        </Box>
        <Chip label="v2.0" size="small" sx={{ ml: 'auto', bgcolor: '#e0f2fe', color: '#0284c7', fontSize: '0.65rem', fontWeight: 700 }} />
      </Box>

      <Divider sx={{ borderColor: '#e2e8f0' }} />

      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Platform Navigation
        </Typography>
      </Box>

      <List sx={{ px: 1.5, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const IconComponent = iconMap[item.icon] || DashboardIcon;
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <ListItem disablePadding key={item.path} sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpen) onDrawerToggle();
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  bgcolor: isActive ? '#e0f2fe' : 'transparent',
                  color: isActive ? '#0284c7' : '#64748b',
                  borderLeft: isActive ? '3.5px solid #0ea5e9' : '3.5px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive ? '#e0f2fe' : '#f0f9ff',
                    color: '#0284c7',
                    '& .MuiListItemIcon-root': { color: '#0ea5e9' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#0ea5e9' : '#64748b' }}>
                  <IconComponent fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
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
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e2e8f0' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
