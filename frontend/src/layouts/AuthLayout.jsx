import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { Outlet } from 'react-router-dom';

// Randomly placed organic floating glass bubbles with fade-in / fade-out (appear & disappear) animation
const randomFloatingBubbles = [
  {
    type: 'debit_card',
    icon: CreditCardIcon,
    color: '#F59E0B',
    bubbleBg: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(245, 158, 11, 0.25) 60%, rgba(217, 119, 6, 0.5) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.7)',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    top: '8%',
    left: '14%',
    size: 84,
    animName: 'floatFade1',
    animationDuration: '8.5s',
  },
  {
    type: 'credit_card',
    icon: PaymentIcon,
    color: '#0ea5e9',
    bubbleBg: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(14, 165, 233, 0.25) 60%, rgba(2, 132, 199, 0.5) 100%)',
    borderColor: 'rgba(14, 165, 233, 0.7)',
    glowColor: 'rgba(14, 165, 233, 0.5)',
    top: '32%',
    right: '7%',
    size: 58,
    animName: 'floatFade2',
    animationDuration: '6.5s',
  },
  {
    type: 'upi_payment',
    icon: QrCode2Icon,
    color: '#10B981',
    bubbleBg: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(16, 185, 129, 0.25) 60%, rgba(5, 150, 105, 0.5) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.7)',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    bottom: '12%',
    left: '38%',
    size: 74,
    animName: 'floatFade3',
    animationDuration: '10s',
  },
  {
    type: 'subscriptions',
    icon: AutorenewIcon,
    color: '#38bdf8',
    bubbleBg: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(56, 189, 248, 0.25) 60%, rgba(14, 165, 233, 0.5) 100%)',
    borderColor: 'rgba(56, 189, 248, 0.7)',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    top: '72%',
    right: '15%',
    size: 90,
    animName: 'floatFade4',
    animationDuration: '7.8s',
  },
  {
    type: 'plans',
    icon: LoyaltyIcon,
    color: '#a855f7',
    bubbleBg: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(168, 85, 247, 0.25) 60%, rgba(126, 34, 206, 0.5) 100%)',
    borderColor: 'rgba(168, 85, 247, 0.7)',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    top: '22%',
    left: '26%',
    size: 52,
    animName: 'floatFade5',
    animationDuration: '7.2s',
  },
  {
    type: 'customers',
    icon: PeopleIcon,
    color: '#f43f5e',
    bubbleBg: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(244, 63, 94, 0.25) 60%, rgba(225, 29, 72, 0.5) 100%)',
    borderColor: 'rgba(244, 63, 94, 0.7)',
    glowColor: 'rgba(244, 63, 94, 0.5)',
    top: '12%',
    right: '30%',
    size: 78,
    animName: 'floatFade6',
    animationDuration: '9.5s',
  },
  {
    type: 'invoices',
    icon: ReceiptLongIcon,
    color: '#f97316',
    bubbleBg: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(249, 115, 22, 0.25) 60%, rgba(234, 88, 12, 0.5) 100%)',
    borderColor: 'rgba(249, 115, 22, 0.7)',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    bottom: '24%',
    left: '5%',
    size: 64,
    animName: 'floatFade7',
    animationDuration: '8.2s',
  },
  {
    type: 'billing_cycles',
    icon: EventRepeatIcon,
    color: '#6366f1',
    bubbleBg: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(99, 102, 241, 0.25) 60%, rgba(79, 70, 229, 0.5) 100%)',
    borderColor: 'rgba(99, 102, 241, 0.7)',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    top: '82%',
    right: '42%',
    size: 70,
    animName: 'floatFade8',
    animationDuration: '9s',
  },
];

const AuthLayout = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background Radial Glow Canvas */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(circle at 25% 15%, rgba(245, 158, 11, 0.15) 0%, transparent 45%),
            radial-gradient(circle at 75% 85%, rgba(14, 165, 233, 0.18) 0%, transparent 50%),
            radial-gradient(circle at 45% 60%, rgba(168, 85, 247, 0.12) 0%, transparent 60%)
          `,
        }}
      />

      {/* Floating Glass Bubbles with Appear & Disappear (Fade In / Fade Out) Physics */}
      {randomFloatingBubbles.map((bubble, idx) => {
        const Icon = bubble.icon;
        return (
          <Box
            key={idx}
            sx={{
              position: 'absolute',
              top: bubble.top,
              bottom: bubble.bottom,
              left: bubble.left,
              right: bubble.right,
              zIndex: 1,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              width: bubble.size,
              height: bubble.size,
              borderRadius: '50%',
              background: bubble.bubbleBg,
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${bubble.borderColor}`,
              boxShadow: `0 12px 35px ${bubble.glowColor}, inset 0 3px 10px rgba(255, 255, 255, 0.5)`,
              animation: `${bubble.animName} ${bubble.animationDuration} ease-in-out infinite alternate`,
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '12%',
                left: '20%',
                width: '35%',
                height: '25%',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.55)',
                filter: 'blur(1px)',
                pointerEvents: 'none',
              },
              '@keyframes floatFade1': {
                '0%': { opacity: 0.1, transform: 'translate(0px, 0px) scale(0.6)' },
                '50%': { opacity: 1, transform: 'translate(-20px, -25px) scale(1.08)' },
                '100%': { opacity: 0.15, transform: 'translate(-35px, -45px) scale(0.65)' },
              },
              '@keyframes floatFade2': {
                '0%': { opacity: 0.15, transform: 'translate(0px, 0px) scale(0.65)' },
                '50%': { opacity: 1, transform: 'translate(25px, -15px) scale(1.06)' },
                '100%': { opacity: 0.1, transform: 'translate(40px, -30px) scale(0.6)' },
              },
              '@keyframes floatFade3': {
                '0%': { opacity: 0.1, transform: 'translate(0px, 0px) scale(0.6)' },
                '50%': { opacity: 1, transform: 'translate(-12px, -30px) scale(1.05)' },
                '100%': { opacity: 0.2, transform: 'translate(-20px, -50px) scale(0.7)' },
              },
              '@keyframes floatFade4': {
                '0%': { opacity: 0.2, transform: 'translate(0px, 0px) scale(0.7)' },
                '50%': { opacity: 1, transform: 'translate(25px, 20px) scale(1.08)' },
                '100%': { opacity: 0.1, transform: 'translate(45px, 35px) scale(0.6)' },
              },
              '@keyframes floatFade5': {
                '0%': { opacity: 0.1, transform: 'translate(0px, 0px) scale(0.6)' },
                '50%': { opacity: 1, transform: 'translate(18px, -22px) scale(1.1)' },
                '100%': { opacity: 0.15, transform: 'translate(30px, -40px) scale(0.65)' },
              },
              '@keyframes floatFade6': {
                '0%': { opacity: 0.15, transform: 'translate(0px, 0px) scale(0.65)' },
                '50%': { opacity: 1, transform: 'translate(-22px, 15px) scale(1.07)' },
                '100%': { opacity: 0.1, transform: 'translate(-40px, 30px) scale(0.6)' },
              },
              '@keyframes floatFade7': {
                '0%': { opacity: 0.1, transform: 'translate(0px, 0px) scale(0.6)' },
                '50%': { opacity: 1, transform: 'translate(20px, -25px) scale(1.06)' },
                '100%': { opacity: 0.2, transform: 'translate(35px, -45px) scale(0.7)' },
              },
              '@keyframes floatFade8': {
                '0%': { opacity: 0.15, transform: 'translate(0px, 0px) scale(0.65)' },
                '50%': { opacity: 1, transform: 'translate(-18px, -20px) scale(1.09)' },
                '100%': { opacity: 0.1, transform: 'translate(-32px, -35px) scale(0.6)' },
              },
            }}
          >
            <Icon sx={{ fontSize: Math.round(bubble.size * 0.44), color: '#FFFFFF', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
          </Box>
        );
      })}

      {/* Main Login Card Container */}
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 58,
              height: 58,
              borderRadius: 3.5,
              backgroundColor: '#F59E0B',
              color: '#111827',
              mb: 1.5,
              boxShadow: '0 12px 30px rgba(245, 158, 11, 0.45)',
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography
            variant="h3"
            fontWeight={900}
            letterSpacing="-0.03em"
            sx={{
              color: '#F59E0B',
              textShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
              mb: 0.5,
            }}
          >
            Nexora
          </Typography>
          <Typography variant="body2" sx={{ color: '#F9FAFB', fontWeight: 600, letterSpacing: '0.02em' }}>
            The future of recurring payment and subscription management
          </Typography>
        </Box>

        <Paper
          elevation={16}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
