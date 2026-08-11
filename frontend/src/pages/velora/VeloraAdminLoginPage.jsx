import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import FintechBackground from '../../components/common/FintechBackground';

const VeloraAdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@velora.com');
  const [password, setPassword] = useState('VeloraMerchantAdmin#98234!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    document.title = 'Velora Fintech Platform | Merchant Admin Login';
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('velora_admin_token', 'velora_token_' + Date.now());
      localStorage.setItem('velora_admin_user', JSON.stringify({ email, role: 'ADMIN' }));
      navigate('/velora/admin');
    }, 600);
  };

  return (
    <FintechBackground overlayOpacity={0.88}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
        <Container maxWidth="xs">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/velora')}
            sx={{ color: '#d97706', mb: 3, textTransform: 'none', fontWeight: 800, '&:hover': { color: '#b45309' } }}
          >
            Back to Velora Platform
          </Button>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: '#FFFFFF', // Pure White Box Background as requested
              border: '2px solid #f59e0b',
              boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25)',
              textAlign: 'center',
            }}
          >
            {/* Header Branding with Solid Black Font */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                }}
              >
                <AdminPanelSettingsIcon sx={{ color: '#ffffff' }} />
              </Avatar>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h5" fontWeight={900} letterSpacing="-0.02em" sx={{ color: '#000000', lineHeight: 1 }}>
                  Velora
                </Typography>
                <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 800, letterSpacing: '0.05em' }}>
                  MERCHANT ADMIN PORTAL
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 0.5 }}>
              Velora Merchant Admin Sign In
            </Typography>
            <Typography variant="body2" color="#64748b" sx={{ mb: 3, fontWeight: 500 }}>
              Access Velora merchant dashboard, subscriber logs & revenue metrics
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, bgcolor: '#fef2f2', color: '#dc2626' }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Merchant Admin Email"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{
                  mb: 2.5,
                  '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                  '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f59e0b' },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{
                  mb: 3,
                  '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                  '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f59e0b' },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<AdminPanelSettingsIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: 'none',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                  '&:hover': { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' },
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In as Velora Admin'}
              </Button>
            </Box>

            <Divider sx={{ my: 3, borderColor: '#e2e8f0' }} />

            <Typography variant="body2" color="#64748b" fontWeight={600}>
              Don't have a merchant account?{' '}
              <MuiLink
                component="button"
                variant="body2"
                onClick={() => navigate('/velora/admin/register')}
                sx={{ color: '#d97706', fontWeight: 800, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Register Merchant Account
              </MuiLink>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </FintechBackground>
  );
};

export default VeloraAdminLoginPage;
