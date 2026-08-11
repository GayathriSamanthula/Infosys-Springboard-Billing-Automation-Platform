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
  IconButton,
  InputAdornment,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FintechBackground from '../../components/common/FintechBackground';

const VeloraCustomerLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    document.title = 'Velora Fintech Platform | Customer Login';
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/customer/login', { email, password });
      const custObj = {
        id: res.data?.customer_id,
        email: res.data?.email || email,
        full_name: res.data?.full_name || email.split('@')[0],
        platform_source: res.data?.platform_source || 'VELORA_DIRECT',
        access_token: res.data?.access_token,
      };
      localStorage.setItem('customer_token', res.data?.access_token || '');
      localStorage.setItem('customer_user', JSON.stringify(custObj));
      localStorage.setItem('customer_info', JSON.stringify(custObj));
      localStorage.setItem('customer_email', email);
      navigate('/velora/customer');
    } catch (err) {
      console.warn('Velora API Login error:', err);
      const errMsg = err?.response?.data?.detail || 'No customer found with the provided details.';
      setError(errMsg);
      showNotification(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FintechBackground overlayOpacity={0.88}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
        <Container maxWidth="xs">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/velora')}
            sx={{ color: '#4338ca', mb: 3, textTransform: 'none', fontWeight: 800, '&:hover': { color: '#6366f1' } }}
          >
            Back to Velora Platform
          </Button>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: '#FFFFFF', // Pure White Box Background as requested
              border: '2px solid #6366f1',
              boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.25)',
              textAlign: 'center',
            }}
          >
            {/* Header Branding with Solid Black Font */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                }}
              >
                <PersonOutlineIcon sx={{ color: '#ffffff' }} />
              </Avatar>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h5" fontWeight={900} letterSpacing="-0.02em" sx={{ color: '#000000', lineHeight: 1 }}>
                  Velora
                </Typography>
                <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 800, letterSpacing: '0.05em' }}>
                  CUSTOMER PORTAL
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 0.5 }}>
              Velora Customer Sign In
            </Typography>
            <Typography variant="body2" color="#64748b" sx={{ mb: 3, fontWeight: 500 }}>
              Sign in to manage your active subscription & view tax invoices
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, bgcolor: '#fef2f2', color: '#dc2626' }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Customer Email Address"
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
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#64748b' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                  '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<PersonOutlineIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: 'none',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                  '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)' },
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Customer Portal'}
              </Button>
            </Box>

            <Divider sx={{ my: 3, borderColor: '#e2e8f0' }} />

            <Typography variant="body2" color="#64748b" fontWeight={600}>
              New to Velora?{' '}
              <MuiLink
                component="button"
                onClick={() => navigate('/velora/customer/register')}
                sx={{ color: '#6366f1', fontWeight: 800, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Create Customer Account
              </MuiLink>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </FintechBackground>
  );
};

export default VeloraCustomerLoginPage;
