import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Alert,
  Link,
  Divider,
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { customerPortalService } from '../../services/customerPortalService';
import { useNotification } from '../../hooks/useNotification';

const CustomerRegisterPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    country: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        username: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        country: formData.country || '',
        address: formData.address || '',
        platform_source: 'NEXORA_DIRECT',
      };
      await customerPortalService.register(payload);
      showNotification('Customer account created successfully! Please sign in.', 'success');
      navigate('/customer/login');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed. Email or phone number might already exist.');
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
        bgcolor: '#fdf0ed', // Soft Sky Blue Tinted Background Canvas
        p: 2,
      }}
    >
      <Box sx={{ maxWidth: 460, width: '100%', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customer/login')}
          sx={{ color: '#e76f51', textTransform: 'none', fontWeight: 800, '&:hover': { color: '#d45d3f' } }}
        >
          Back to Customer Sign In
        </Button>
      </Box>

      <Card
        elevation={0}
        sx={{
          maxWidth: 460,
          width: '100%',
          borderRadius: 4,
          bgcolor: '#FFFFFF !important',
          border: '3px solid #e76f51', // Sky Blue Accent Border
          boxShadow: '0 20px 40px -15px rgba(231, 111, 81, 0.45)',
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
            CUSTOMER ACCOUNT REGISTRATION
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
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
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
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
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              margin="normal"
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
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
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
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              margin="normal"
              sx={{
                '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e76f51' },
              }}
            />
            <TextField
              fullWidth
              label="Billing Address (Optional)"
              name="address"
              value={formData.address}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
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
                boxShadow: '0 4px 15px rgba(231, 111, 81, 0.45)',
              }}
            >
              {loading ? 'Creating Account...' : 'Register Customer Account'}
            </Button>
          </form>

          <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="#64748b" fontWeight={600}>
              Already registered?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/customer/login')}
                sx={{ fontWeight: 800, color: '#e76f51', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerRegisterPage;
