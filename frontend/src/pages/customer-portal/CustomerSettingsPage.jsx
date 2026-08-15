import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotification } from '../../hooks/useNotification';
import { useTranslation } from 'react-i18next';

const CustomerSettingsPage = () => {
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showNotification('Please enter both old and new password.', 'warning');
      return;
    }
    showNotification('Password updated successfully!', 'success');
    setOldPassword('');
    setNewPassword('');
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#0f172a">
          {t('nav.settings')}
        </Typography>
        <Typography variant="body2" color="#e76f51" fontWeight={700} sx={{ mt: 0.5 }}>
          {t('customerPortal.manageSubSubtext')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Security & Password */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3.5, border: '3px solid #e76f51', bgcolor: '#FFFFFF !important', boxShadow: '0 10px 25px -5px rgba(231, 111, 81, 0.35)' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <LockIcon sx={{ color: '#e76f51' }} />
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  {t('auth.passwordLabel')}
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#fcdad2' }} />

              <form onSubmit={handlePasswordChange}>
                <TextField
                  fullWidth
                  label={t('auth.passwordLabel')}
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  margin="dense"
                  sx={{
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e76f51' },
                  }}
                />
                <TextField
                  fullWidth
                  label={t('auth.passwordLabel')}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  margin="dense"
                  sx={{
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e76f51' },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    mt: 2,
                    bgcolor: '#e76f51',
                    '&:hover': { bgcolor: '#d45d3f' },
                    fontWeight: 900,
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  {t('common.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Preferences */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3.5, border: '3px solid #e76f51', bgcolor: '#FFFFFF !important', boxShadow: '0 10px 25px -5px rgba(231, 111, 81, 0.35)' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <NotificationsIcon sx={{ color: '#e76f51' }} />
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Notification Alerts
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#fcdad2' }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#e76f51' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#e76f51' },
                    }}
                  />
                }
                label={
                  <Typography fontWeight={700} color="#0f172a">
                    Receive Email Statements & Payment Failure Retry Reminders
                  </Typography>
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerSettingsPage;
