import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Link,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../../hooks/useNotification';

const AdminRegisterPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [fullName, setFullName] = useState('');
  const [workingId, setWorkingId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    document.title = 'Nexora Platform | Register Admin Account';
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validKeys = ['NEXORA_ADMIN_2026', 'VELORA_ADMIN_2026', 'ADMIN_2026'];
    if (!validKeys.includes((adminSecretKey || '').trim().toUpperCase())) {
      setError('Invalid Admin Security Key. Access denied.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/admin/register', {
        username: fullName || (email || 'admin').split('@')[0],
        email: email,
        password: password,
        working_id: workingId,
        admin_secret_key: adminSecretKey,
      });

      showNotification(`Admin account created successfully for ${fullName || email}!`, 'success');
      setTimeout(() => {
        setLoading(false);
        navigate('/login');
      }, 600);
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Failed to register admin account';
      setError(errMsg);
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleRegister} noValidate>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" gutterBottom>
          Register Admin Account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new administrator account to manage Nexora subscriptions and billing operations.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Working ID / Admin Employee ID"
        value={workingId}
        onChange={(e) => setWorkingId(e.target.value)}
        margin="normal"
        required
        placeholder="e.g. ADM-9941"
        sx={{
          '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0284c7' },
        }}
      />

      <TextField
        fullWidth
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        margin="normal"
        required
        sx={{
          '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0284c7' },
        }}
      />

      <TextField
        fullWidth
        label="Admin Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        required
        sx={{
          '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0284c7' },
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
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0284c7' },
        }}
      />

      <TextField
        fullWidth
        label="Admin Security Key"
        type="password"
        value={adminSecretKey}
        onChange={(e) => setAdminSecretKey(e.target.value)}
        margin="normal"
        required
        placeholder="Enter secret authorization key"
        sx={{
          '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0284c7' },
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        startIcon={<AdminPanelSettingsIcon />}
        sx={{
          py: 1.5,
          mt: 3,
          fontSize: '0.95rem',
          bgcolor: '#0284c7',
          '&:hover': { bgcolor: '#0369a1' },
          fontWeight: 800,
          borderRadius: 2,
        }}
      >
        {loading ? 'Creating Admin Account...' : 'Register Admin Account'}
      </Button>

      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an admin account?{' '}
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => navigate('/login')}
            sx={{ fontWeight: 800, color: '#0284c7', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Sign In Here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminRegisterPage;
