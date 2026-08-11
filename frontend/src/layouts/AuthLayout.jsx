import React from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Outlet, useNavigate } from 'react-router-dom';

const AuthLayout = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#FFFFFF', // Pure White Background as requested
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background Radial Subtle Accents */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(circle at 25% 15%, rgba(245, 158, 11, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 75% 85%, rgba(14, 165, 233, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 45% 60%, rgba(168, 85, 247, 0.06) 0%, transparent 60%)
          `,
        }}
      />

      {/* Main Admin Auth Container */}
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 3 }}>
        <Box sx={{ mb: 2.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ color: '#0284c7', textTransform: 'none', fontWeight: 800, '&:hover': { color: '#0369a1' } }}
          >
            Back to Nexora Gateway
          </Button>
        </Box>
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 58,
              height: 58,
              borderRadius: 3.5,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              mb: 1.5,
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography
            variant="h3"
            fontWeight={900}
            letterSpacing="-0.03em"
            sx={{
              color: '#000000', // Solid Black Title
              mb: 0.5,
            }}
          >
            Nexora
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700, letterSpacing: '0.02em' }}>
            Automated Subscription Billing & Compliance Platform
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            backgroundColor: '#FFFFFF', // Pure White Box Background
            border: '2.5px solid #0284c7',
            boxShadow: '0 20px 40px -15px rgba(2, 132, 199, 0.25)',
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
