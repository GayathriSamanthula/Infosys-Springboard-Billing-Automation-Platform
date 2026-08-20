import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PublicIcon from '@mui/icons-material/Public';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EditIcon from '@mui/icons-material/Edit';
import api from '../../services/api';

import { customerPortalService } from '../../services/customerPortalService';
import { useTranslation } from 'react-i18next';

const CustomerProfilePage = () => {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    country: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currentCustomer = customerPortalService.getCurrentCustomer() || { customer_id: Date.now(), full_name: 'Customer Account', email: '' };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const loggedUser = customerPortalService.getCurrentCustomer();
        const loggedEmail = loggedUser?.email || localStorage.getItem('customer_email') || '';

        const res = await api.get('/customers').then(r => r.data).catch(() => []);
        const custs = Array.isArray(res) ? res : [];
        const matched = custs.find(c =>
          (loggedEmail && String(c.email || '').toLowerCase() === String(loggedEmail).toLowerCase()) ||
          (loggedUser?.id && Number(c.id) === Number(loggedUser.id))
        );

        if (matched) {
          setCustomer(matched);
        } else {
          setCustomer(loggedUser || currentCustomer);
        }
      } catch (err) {
        console.error('Failed to load customer profile:', err);
        setCustomer(currentCustomer);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const profile = customer || currentCustomer;

  const handleOpenEdit = () => {
    setForm({
      full_name: profile.full_name || profile.name || '',
      email: profile.email || '',
      phone_number: profile.phone_number || profile.phone || '',
      country: profile.country || 'India',
      address: profile.address || '',
    });
    setEditOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone_number: form.phone_number,
        country: form.country,
        address: form.address,
      };
      const res = await api.put(`/customers/${profile.id}`, payload);
      const updated = { ...profile, ...res.data };
      setCustomer(updated);
      localStorage.setItem('customer_user', JSON.stringify(updated));
      localStorage.setItem('customer_info', JSON.stringify(updated));
      if (updated.email) localStorage.setItem('customer_email', updated.email);
      
      setMessage({ type: 'success', text: 'Profile updated successfully in database!' });
      setEditOpen(false);
    } catch (err) {
      console.error('Profile update error:', err);
      setMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to update profile changes.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#0f172a">
          {t('customerPortal.myProfile')}
        </Typography>
        <Typography variant="body2" color="#e76f51" fontWeight={700} sx={{ mt: 0.5 }}>
          {t('customerPortal.manageSubSubtext')}
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type || 'info'} sx={{ mb: 3, fontWeight: 700, borderRadius: 2 }}>
          {message.text}
        </Alert>
      )}

      {loading ? (
        <CircularProgress color="primary" />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3.5, border: '3px solid #e76f51', bgcolor: '#FFFFFF !important', boxShadow: '0 10px 25px -5px rgba(231, 111, 81, 0.35)' }}>
              <Avatar
                sx={{
                  width: 90,
                  height: 90,
                  bgcolor: '#e76f51',
                  color: '#ffffff',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  mx: 'auto',
                  mb: 2,
                  border: '3px solid #e76f51',
                }}
              >
                {profile.full_name ? profile.full_name[0].toUpperCase() : (profile.name ? profile.name[0].toUpperCase() : (profile.email ? profile.email[0].toUpperCase() : 'C'))}
              </Avatar>
              <Typography variant="h5" fontWeight={800} color="#0f172a">
                {profile.full_name || profile.name || profile.email?.split('@')[0] || 'Customer Account'}
              </Typography>
              <Typography variant="body2" color="#e76f51" fontWeight={800} sx={{ mb: 2 }}>
                Customer ID: #{profile.id || profile.customer_id || 'ACCOUNT'}
              </Typography>
              <Chip
                icon={<VerifiedUserIcon fontSize="small" sx={{ color: '#e76f51 !important' }} />}
                label={profile.customer_status || profile.status || 'ACTIVE SUBSCRIBER'}
                size="small"
                sx={{ fontWeight: 800, bgcolor: '#fcdad2', color: '#e76f51', border: '1px solid #e76f51' }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3.5, borderRadius: 3.5, border: '3px solid #e76f51', bgcolor: '#FFFFFF !important', boxShadow: '0 10px 25px -5px rgba(231, 111, 81, 0.35)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  {t('customerPortal.accountDetails')}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={handleOpenEdit}
                  sx={{ bgcolor: '#e76f51', '&:hover': { bgcolor: '#d45d3f' }, textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                >
                  Edit Profile
                </Button>
              </Box>

              <Divider sx={{ mb: 3, borderColor: '#fcdad2' }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonIcon sx={{ color: '#e76f51' }} />
                    <Box>
                      <Typography variant="caption" color="#64748b" fontWeight={700}>{t('customerPortal.fullName')}</Typography>
                      <Typography variant="body1" color="#0f172a" fontWeight={800}>{profile.full_name || profile.name || profile.email?.split('@')[0] || 'Customer Account'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EmailIcon sx={{ color: '#e76f51' }} />
                    <Box>
                      <Typography variant="caption" color="#64748b" fontWeight={700}>{t('customerPortal.email')}</Typography>
                      <Typography variant="body1" color="#0f172a" fontWeight={800}>{profile.email || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PhoneIcon sx={{ color: '#e76f51' }} />
                    <Box>
                      <Typography variant="caption" color="#64748b" fontWeight={700}>{t('customerPortal.phone')}</Typography>
                      <Typography variant="body1" color="#0f172a" fontWeight={800}>{profile.phone_number || profile.phone || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PublicIcon sx={{ color: '#e76f51' }} />
                    <Box>
                      <Typography variant="caption" color="#64748b" fontWeight={700}>{t('customerPortal.country')}</Typography>
                      <Typography variant="body1" color="#0f172a" fontWeight={800}>{profile.country || 'India'}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

        </Grid>
      )}

      {/* Edit Profile Dialog Modal */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: '#0f172a' }}>Edit Personal Profile</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Billing Address"
                  multiline
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setEditOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: '#e76f51', '&:hover': { bgcolor: '#d45d3f' }, fontWeight: 800 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default CustomerProfilePage;
