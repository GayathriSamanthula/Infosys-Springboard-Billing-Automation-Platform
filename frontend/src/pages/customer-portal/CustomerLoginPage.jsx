import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Alert,
  Link,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { customerPortalService } from '../../services/customerPortalService';
import { useNotification } from '../../hooks/useNotification';

const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await customerPortalService.login({ email, password });
      const custObj = res?.user || res?.customer || { email, full_name: res?.full_name || email };
      localStorage.setItem('customer_user', JSON.stringify(custObj));
      localStorage.setItem('customer_email', email);

      const custName = custObj?.full_name || custObj?.name || email;
      showNotification(`Welcome back, ${custName}!`, 'success');
      navigate('/customer/dashboard');
    } catch (err) {
      console.warn('Customer login error:', err);
      const errMsg = err?.response?.data?.detail || err?.message || 'No customer found with the provided details.';
      setError(errMsg);
      showNotification(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc', // Neutral Page Background
        p: 2,
      }}
    >
      <Box sx={{ maxWidth: 440, width: '100%', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ color: '#e76f51', textTransform: 'none', fontWeight: 800, '&:hover': { color: '#d45d3f' } }}
        >
          Back to Nexora Gateway
        </Button>
      </Box>

      <Card
        elevation={0}
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 4,
          bgcolor: '#ffffff !important', // Clean White Box Content
          border: '3px solid #e76f51', // #e76f51 Box Border
          boxShadow: '0 20px 40px -15px rgba(231, 111, 81, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Header with #e76f51 Background and Custom Logo Symbol */}
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#e76f51', color: '#ffffff' }}>
          <Box
            component="img"
            src="/nexora-logo.png"
            alt="Nexora Logo"
            sx={{
              width: 58,
              height: 58,
              borderRadius: 3,
              bgcolor: '#ffffff',
              p: 0.8,
              mx: 'auto',
              mb: 1.5,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
              objectFit: 'contain',
            }}
          />
          <Typography variant="h4" fontWeight={900} color="#ffffff" letterSpacing="-0.02em">
            Nexora
          </Typography>
          <Typography variant="caption" color="#ffffff" fontWeight={800} letterSpacing="0.05em" display="block" sx={{ mt: 0.5, opacity: 0.95 }}>
            CUSTOMER PORTAL
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              sx={{
                '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e76f51' },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
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
                '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e76f51' },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.4,
                bgcolor: '#e76f51',
                '&:hover': { bgcolor: '#d45d3f' },
                fontWeight: 900,
                fontSize: '1rem',
                textTransform: 'none',
                color: '#ffffff',
                borderRadius: 2.5,
                boxShadow: '0 4px 15px rgba(231, 111, 81, 0.4)',
              }}
            >
              {loading ? 'Authenticating Customer...' : 'Sign In to Customer Portal'}
            </Button>
          </form>

          <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="#64748b" fontWeight={600}>
              Don't have a customer account yet?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/customer/register')}
                sx={{ fontWeight: 800, color: '#e76f51', textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#d45d3f' } }}
              >
                Create Account
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerLoginPage;
