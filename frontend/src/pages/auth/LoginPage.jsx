import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useForm } from 'react-hook-form';
import FormInput from '../../components/common/FormInput';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { EMAIL_REGEX } from '../../utils/validators';

const LoginPage = () => {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Reset Modal States
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  const { control, handleSubmit } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      showNotification('Signed in successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      showNotification(String(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!resetEmail || !newPassword || !confirmPassword) {
      setResetError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: resetEmail,
        new_password: newPassword,
      });
      showNotification(res.data?.message || 'Password reset successfully!', 'success');
      setForgotOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      let msg = 'Failed to reset password. Please check your email address.';
      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg || JSON.stringify(detail) : String(detail));
      } else if (err?.message) {
        msg = err.message;
      }
      setResetError(msg);
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" fontWeight={700} color="text.primary" align="center" gutterBottom>
        Sign In to Portal
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Enter your credentials to access the platform.
      </Typography>

      <FormInput
        name="email"
        control={control}
        label="Email Address"
        rules={{
          required: 'Email is required',
          pattern: { value: EMAIL_REGEX, message: 'Enter a valid email address' },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailOutlinedIcon sx={{ color: '#94a3b8' }} />
            </InputAdornment>
          ),
        }}
      />

      <FormInput
        name="password"
        control={control}
        label="Password"
        type={showPassword ? 'text' : 'password'}
        rules={{ required: 'Password is required' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlinedIcon sx={{ color: '#94a3b8' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 1.5 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
        />
        <Link
          component="button"
          type="button"
          variant="body2"
          onClick={() => setForgotOpen(true)}
          sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none' }}
        >
          Forgot password?
        </Link>
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isSubmitting}
        sx={{ py: 1.5, mt: 2, fontSize: '0.95rem', bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
      >
        {isSubmitting ? 'Authenticating...' : 'Sign In'}
      </Button>

      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an admin account?{' '}
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => navigate('/register')}
            sx={{ fontWeight: 800, color: '#0284c7', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Register Admin Account
          </Link>
        </Typography>
      </Box>

      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleResetSubmit}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>Reset Admin Password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your admin email address and your new password below.
            </Typography>

            {resetError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {resetError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Admin Email Address"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              margin="normal"
              required
              sx={{
                '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              type={showResetNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowResetNewPassword(!showResetNewPassword)} edge="end">
                      {showResetNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type={showResetConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)} edge="end">
                      {showResetConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setForgotOpen(false)} variant="outlined" sx={{ color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={resetSubmitting}
              sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800 }}
            >
              {resetSubmitting ? 'Updating...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default LoginPage;
