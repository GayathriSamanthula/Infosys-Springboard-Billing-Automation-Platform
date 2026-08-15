import React, { useState, useEffect } from 'react';
import {
  Button,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';

const PwaInstallButton = ({ variant = "contained", color = "primary", sx = {} }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setOpenModal(true);
    }
  };

  if (isInstalled) {
    return (
      <Tooltip title="Nexora App is installed on this device">
        <Chip
          icon={<CheckCircleIcon style={{ color: '#10b981' }} />}
          label="App Installed"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 800, borderColor: '#10b981', color: '#0f172a', ...sx }}
        />
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        size="small"
        variant={variant}
        color={color}
        startIcon={<GetAppIcon />}
        onClick={handleInstallClick}
        sx={{
          textTransform: 'none',
          fontWeight: 800,
          borderRadius: 2,
          px: 2.5,
          py: 0.8,
          bgcolor: '#7c3aed',
          color: '#ffffff',
          '&:hover': { bgcolor: '#6d28d9' },
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
          ...sx,
        }}
      >
        Install App
      </Button>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, color: '#0f172a' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GetAppIcon sx={{ color: '#7c3aed' }} />
            Install Nexora Progressive Web App
          </Box>
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph fontWeight={500}>
            Install <strong>Nexora Billing Platform</strong> directly onto your computer or mobile home screen for fast offline access and app shortcuts.
          </Typography>

          <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DesktopWindowsIcon sx={{ color: '#0284c7' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                Desktop (Chrome / Edge / Brave)
              </Typography>
            </Box>
            <Typography variant="body2" color="#334155">
              1. Look at the right side of your browser address bar (top right corner).<br />
              2. Click the <strong>Install Icon</strong> <OpenInBrowserIcon fontSize="small" sx={{ verticalAlign: 'middle', color: '#0284c7' }} /> or click the 3-dots menu &gt; <strong>Cast, save and share</strong> &gt; <strong>Install Nexora...</strong>
            </Typography>
          </Box>

          <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PhoneIphoneIcon sx={{ color: '#e76f51' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                Mobile (iOS Safari & Android Chrome)
              </Typography>
            </Box>
            <Typography variant="body2" color="#334155">
              • <strong>iPhone / iPad (Safari)</strong>: Tap the Share button in Safari toolbar &gt; select <strong>Add to Home Screen</strong>.<br />
              • <strong>Android (Chrome)</strong>: Tap the 3 dots menu &gt; select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="contained" sx={{ bgcolor: '#7c3aed', color: '#ffffff', fontWeight: 800 }}>
            Got It
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PwaInstallButton;
