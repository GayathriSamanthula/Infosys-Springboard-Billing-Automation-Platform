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
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { customerPortalService } from '../../services/customerPortalService';
import { useNotification } from '../../hooks/useNotification';
import { CustomerLanguageScope } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const CustomerRegisterPageContent = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
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

  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

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
      const res = await customerPortalService.register(payload);
      // Mandatory 6-Digit Security OTP Verification (No auto-login bypass)
      setRegisteredEmail(formData.email);
      setOtpStep(true);
      showNotification('Security OTP sent to your email inbox (Valid for 10 minutes).', 'info');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed. Email or phone number might already exist or domain is invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the valid 6-digit OTP code sent to your email inbox.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await customerPortalService.verifyOTP(registeredEmail, otpCode.trim());
      showNotification('Account verified successfully! Welcome to Nexora Customer Portal.', 'success');
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid or expired OTP code. Please check your email inbox.');
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
        bgcolor: '#fdf0ed',
        p: 2,
      }}
    >
      <Box sx={{ maxWidth: 460, width: '100%', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customer/login')}
          sx={{ color: '#e76f51', textTransform: 'none', fontWeight: 800, '&:hover': { color: '#d45d3f' } }}
        >
          {t('auth.backToSignIn', 'Back to Customer Sign In')}
        </Button>
        <LanguageSwitcher />
      </Box>

      <Card
        elevation={0}
        sx={{
          maxWidth: 460,
          width: '100%',
          borderRadius: 4,
          bgcolor: '#FFFFFF !important',
          border: '3px solid #e76f51',
          boxShadow: '0 20px 40px -15px rgba(231, 111, 81, 0.45)',
          overflow: 'hidden',
        }}
      >
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
            {t('auth.customerRegistrationHeader', 'CUSTOMER ACCOUNT REGISTRATION')}
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {otpStep ? (
            <form onSubmit={handleVerifyOTP}>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}>
                🔒 Security OTP sent to <strong>{registeredEmail}</strong>.<br />
                Code is valid for <strong>10 minutes</strong>.
              </Alert>

              <TextField
                fullWidth
                label="ENTER 6-DIGIT VERIFICATION OTP"
                name="otpCode"
                placeholder="e.g. 584920"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                margin="normal"
                required
                inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.3em', fontWeight: 900 } }}
                sx={{
                  '& .MuiInputBase-input': { color: '#0f172a' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e76f51', borderWidth: 2 },
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
                {loading ? 'Verifying OTP...' : 'Verify OTP & Activate Account'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <TextField
                fullWidth
                label={t('customerPortal.fullName', 'FULL NAME')}
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
                label={t('customerPortal.email', 'EMAIL ADDRESS')}
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
                label={t('customerPortal.phone', 'PHONE NUMBER')}
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                margin="normal"
                required
                helperText="Include country code"
                sx={{
                  '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                  '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 600 },
                  '& .MuiFormHelperText-root': { color: '#e76f51', fontWeight: 600 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e76f51' },
                }}
              />
              <TextField
                fullWidth
                label={t('auth.passwordLabel', 'Password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#e76f51' }}
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
              <TextField
                fullWidth
                label={t('customerPortal.country', 'COUNTRY')}
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
                label={t('customerPortal.address', 'Billing Address (Optional)')}
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
                {loading ? t('common.loading', 'Loading...') : t('auth.signUpButton', 'Register Customer Account')}
              </Button>
            </form>
          )}

          <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="#64748b" fontWeight={600}>
              {t('auth.alreadyRegistered', 'Already registered?')}{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/customer/login')}
                sx={{ fontWeight: 800, color: '#e76f51', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {t('common.login', 'Sign In')}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

const CustomerRegisterPage = () => {
  return (
    <CustomerLanguageScope>
      <CustomerRegisterPageContent />
    </CustomerLanguageScope>
  );
};

export default CustomerRegisterPage;
