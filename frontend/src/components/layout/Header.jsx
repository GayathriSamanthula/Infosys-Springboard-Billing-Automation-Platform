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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Header = ({ onDrawerToggle, sidebarWidth = 260 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
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
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        color: 'rgba(15, 23, 42, 0.85)',
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
            <MenuIcon sx={{ color: '#0ea5e9' }} />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight={800} color="rgba(15, 23, 42, 0.85)" sx={{ lineHeight: 1.2 }}>
              Nexora Subscription & Billing Platform
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={() => navigate('/notifications')}>
              <Badge badgeContent={3} color="primary">
                <NotificationsIcon sx={{ color: '#0ea5e9' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, cursor: 'pointer' }} onClick={handleMenuOpen}>
            <Avatar sx={{ bgcolor: '#0ea5e9', color: '#ffffff', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700 }}>
              G
            </Avatar>
            <Box sx={{ ml: 1.5, display: { xs: 'none', md: 'block' } }}>
              <Typography variant="subtitle2" fontWeight={700} color="rgba(15, 23, 42, 0.85)" style={{ lineHeight: 1.1 }}>
                Gayatri Samanthula
              </Typography>
              <Typography variant="caption" color="rgba(71, 85, 105, 0.85)">
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
            <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="subtitle2" fontWeight={700} color="rgba(15, 23, 42, 0.85)">
                Gayatri Samanthula
              </Typography>
              <Typography variant="caption" color="rgba(71, 85, 105, 0.85)">
                gayatri.samanthula@nexora.com
              </Typography>
            </Box>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
              <ListItemIcon><AccountCircleIcon fontSize="small" color="primary" /></ListItemIcon>
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
