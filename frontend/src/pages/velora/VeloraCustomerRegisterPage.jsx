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
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FintechBackground from '../../components/common/FintechBackground';
import { CustomerLanguageScope } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const VeloraCustomerRegisterContent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        username: fullName,
        email: email,
        phone_number: phone,
        password: password,
        country: country || '',
        address: address || '',
        platform_source: 'VELORA_DIRECT',
      };

      const res = await axios.post('/api/auth/customer/register', payload);
      // Mandatory 6-Digit Security OTP Verification (No auto-login bypass)
      setRegisteredEmail(email);
      setOtpStep(true);
    } catch (err) {
      if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. Please check your details or phone format.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your email inbox.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/customer/verify-otp', { email: registeredEmail, otp_code: otpCode.trim() });
      const custData = {
        id: res.data?.customer_id,
        full_name: res.data?.full_name || fullName,
        email: res.data?.email || email,
        platform_source: res.data?.platform_source || 'VELORA_DIRECT',
      };
      if (res.data?.access_token) {
        localStorage.setItem('customer_token', res.data.access_token);
      }
      localStorage.setItem('customer_user', JSON.stringify(custData));
      localStorage.setItem('customer_info', JSON.stringify(custData));
      localStorage.setItem('customer_email', registeredEmail);
      navigate('/velora/customer');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid or expired OTP code. Please check your email inbox.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FintechBackground overlayOpacity={0.88}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
        <Container maxWidth="xs">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/velora')}
              sx={{ color: '#4338ca', textTransform: 'none', fontWeight: 800, '&:hover': { color: '#6366f1' } }}
            >
              {t('landing.backToGateway', 'Back to Platform')}
            </Button>
            <LanguageSwitcher />
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: '#FFFFFF',
              border: '2px solid #6366f1',
              boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.25)',
              textAlign: 'center',
            }}
          >
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
                  {t('nav.customerPortal', 'CUSTOMER PORTAL')}
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 0.5 }}>
              {t('auth.customerRegistrationHeader', 'Register Customer Account')}
            </Typography>
            <Typography variant="body2" color="#64748b" sx={{ mb: 3, fontWeight: 500 }}>
              {t('landing.customerSubtitle', 'Set up your Velora Customer Portal profile & billing credentials')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, bgcolor: '#fef2f2', color: '#dc2626' }}>
                {error}
              </Alert>
            )}

            {otpStep ? (
              <form onSubmit={handleVerifyOTP}>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}>
                  🔒 Velora Security OTP sent to <strong>{registeredEmail}</strong>.<br />
                  Code is valid for <strong>10 minutes</strong>.
                </Alert>

                <TextField
                  fullWidth
                  label="ENTER 6-DIGIT SECURITY OTP"
                  placeholder="e.g. 584920"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  margin="normal"
                  required
                  inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.3em', fontWeight: 900 } }}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputBase-input': { color: '#0f172a' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: 2 },
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
                    py: 1.5,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    textTransform: 'none',
                    boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {loading ? 'Verifying OTP...' : 'Verify OTP & Activate Velora Account'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label={t('customerPortal.fullName', 'Full Name')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  margin="normal"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                  }}
                />
                <TextField
                  fullWidth
                  label={t('customerPortal.email', 'Email Address')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                  }}
                />
                <TextField
                  fullWidth
                  label={t('customerPortal.phone', 'Phone Number')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  margin="normal"
                  required
                  helperText="Include country code"
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                    '& .MuiFormHelperText-root': { color: '#6366f1', fontWeight: 600 },
                  }}
                />
                <TextField
                  fullWidth
                  label={t('auth.passwordLabel', 'Password')}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#6366f1' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                  }}
                />
                <TextField
                  fullWidth
                  label={t('customerPortal.country', 'Country')}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  margin="normal"
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                  }}
                />
                <TextField
                  fullWidth
                  label={t('customerPortal.address', 'Billing Address')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
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
                    py: 1.5,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    textTransform: 'none',
                    boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {loading ? t('common.loading', 'Creating Account...') : t('auth.signUpButton', 'Create Account & Sign In')}
                </Button>
              </form>
            )}

            <Divider sx={{ my: 2.5 }} />

            <Typography variant="body2" color="#64748b" fontWeight={600}>
              {t('auth.alreadyRegistered', 'Already have an account?')}{' '}
              <MuiLink
                component="button"
                variant="body2"
                onClick={() => navigate('/velora/customer/login')}
                sx={{ color: '#6366f1', fontWeight: 800, textDecoration: 'none' }}
              >
                {t('common.login', 'Sign In')}
              </MuiLink>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </FintechBackground>
  );
};

const VeloraCustomerRegisterPage = () => {
  return (
    <CustomerLanguageScope>
      <VeloraCustomerRegisterContent />
    </CustomerLanguageScope>
  );
};

export default VeloraCustomerRegisterPage;
