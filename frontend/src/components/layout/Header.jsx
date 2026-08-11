import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Badge,
  Tooltip,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';

const Header = ({ onDrawerToggle, sidebarWidth = 260 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const notifs = await notificationService.getAll();
      if (Array.isArray(notifs)) {
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      }
    } catch {
      setUnreadCount(0);
    }
  };

  React.useEffect(() => {
    fetchUnreadCount();

    const handleRefresh = () => {
      fetchUnreadCount();
    };

    window.addEventListener('dashboard_refresh', handleRefresh);
    window.addEventListener('notifications_refresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboard_refresh', handleRefresh);
      window.removeEventListener('notifications_refresh', handleRefresh);
    };
  }, []);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${sidebarWidth}px)` },
        ml: { sm: `${sidebarWidth}px` },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '2px solid #e0f2fe',
        color: '#0f172a',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon sx={{ color: '#0284c7' }} />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ lineHeight: 1.2 }}>
              Nexora Subscription & Billing Platform
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ textTransform: 'none', fontWeight: 800, borderColor: '#0284c7', color: '#0284c7', '&:hover': { bgcolor: '#f0f9ff' }, borderRadius: 2 }}
          >
            Back to Nexora Gateway
          </Button>
          {/* Customer Inspector Button in Sky Blue */}
          <Button
            size="small"
            variant="contained"
            startIcon={<PersonSearchIcon />}
            onClick={() => navigate('/customers')}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: '#0284c7',
              '&:hover': { bgcolor: '#0369a1' },
              color: '#ffffff',
              borderRadius: 2,
              px: 2,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            Customer Inspector
          </Button>

          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={() => navigate('/notifications')}>
              <Badge badgeContent={unreadCount} color="primary">
                <NotificationsIcon sx={{ color: '#0284c7' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, cursor: 'pointer' }} onClick={handleMenuOpen}>
            <Avatar sx={{ bgcolor: '#0284c7', color: '#ffffff', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 800 }}>
              G
            </Avatar>
            <Box sx={{ ml: 1.5, display: { xs: 'none', md: 'block' } }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a" style={{ lineHeight: 1.1 }}>
                Gayatri Samanthula
              </Typography>
              <Typography variant="caption" color="#0284c7" fontWeight={700}>
                System Administrator
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{ sx: { width: 230, mt: 1.5, borderRadius: 2 } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #e0f2fe' }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                Gayatri Samanthula
              </Typography>
              <Typography variant="caption" color="#64748b">
                gayatri.samanthula@nexora.com
              </Typography>
            </Box>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
              <ListItemIcon><AccountCircleIcon fontSize="small" sx={{ color: '#0284c7' }} /></ListItemIcon>
              Profile Overview
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
