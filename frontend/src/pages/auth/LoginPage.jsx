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
import { EMAIL_REGEX } from '../../utils/validators';

const LoginPage = () => {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      email: 'gayatri.samanthula@nexora.com',
      password: 'password123',
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
        sx={{ py: 1.5, mt: 2, fontSize: '0.95rem' }}
      >
        {isSubmitting ? 'Authenticating...' : 'Sign In'}
      </Button>

      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Password reset is managed via FastAPI Auth endpoint (/auth/login). Contact your administrator to issue a reset link.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setForgotOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;
