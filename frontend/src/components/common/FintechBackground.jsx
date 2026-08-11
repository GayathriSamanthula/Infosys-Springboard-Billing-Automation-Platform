import React from 'react';
import { Box } from '@mui/material';

// High-resolution digital payment artwork
export const FINTECH_BG_IMAGES = {
  login: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1920&auto=format&fit=crop',
  dashboard: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1920&auto=format&fit=crop',
  customers: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1920&auto=format&fit=crop',
  plans: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1920&auto=format&fit=crop',
  subscriptions: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1920&auto=format&fit=crop',
  payments: 'https://images.unsplash.com/photo-1556742049-0a67daf4095c?q=80&w=1920&auto=format&fit=crop',
  invoices: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1920&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1920&auto=format&fit=crop',
};

// Premium Glassmorphic Floating Bubbles with Fintech & Billing Symbols (Nexora Landing Page Only)
const BUBBLE_ITEMS = [
  { symbol: '₹', top: '10%', left: '8%', duration: '6.5s', delay: '0s', size: 54, border: '#C1DBB3', glow: '#C1DBB3' },
  { symbol: '$', top: '18%', left: '85%', duration: '8s', delay: '1s', size: 62, border: '#0284c7', glow: '#0284c7' },
  { symbol: '🧾', top: '70%', left: '10%', duration: '7.5s', delay: '0.5s', size: 48, border: '#C1DBB3', glow: '#C1DBB3' },
  { symbol: '💳', top: '78%', left: '84%', duration: '8.5s', delay: '2s', size: 58, border: '#818cf8', glow: '#818cf8' },
  { symbol: '⚡', top: '45%', left: '6%', duration: '6.8s', delay: '1.5s', size: 50, border: '#0284c7', glow: '#0284c7' },
  { symbol: '🔒', top: '14%', left: '46%', duration: '9s', delay: '0.8s', size: 46, border: '#C1DBB3', glow: '#C1DBB3' },
  { symbol: '€', top: '85%', left: '48%', duration: '7.8s', delay: '3s', size: 48, border: '#38bdf8', glow: '#38bdf8' },
  { symbol: '%', top: '52%', left: '90%', duration: '7.2s', delay: '2.2s', size: 52, border: '#C1DBB3', glow: '#C1DBB3' },
  { symbol: '📊', top: '32%', left: '26%', duration: '9.5s', delay: '1.2s', size: 56, border: '#a855f7', glow: '#a855f7' },
  { symbol: '✓', top: '62%', left: '76%', duration: '6.4s', delay: '0.3s', size: 44, border: '#10b981', glow: '#10b981' },
  { symbol: '💎', top: '28%', left: '72%', duration: '8.2s', delay: '1.8s', size: 50, border: '#34d399', glow: '#34d399' },
  { symbol: '📈', top: '76%', left: '28%', duration: '7.6s', delay: '2.6s', size: 48, border: '#C1DBB3', glow: '#C1DBB3' },
];

const FintechBackground = ({ children, overlayOpacity = 0.55, bgImage, enableBubbles = false }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
        '@keyframes floatDynamicOrbit': {
          '0%': {
            transform: 'translate(0px, 0px) rotate(0deg) scale(0.9)',
            opacity: 0.45,
            boxShadow: '0 8px 20px rgba(193, 219, 179, 0.3)',
          },
          '25%': {
            transform: 'translate(38px, -55px) rotate(14deg) scale(1.15)',
            opacity: 0.95,
            boxShadow: '0 16px 40px rgba(193, 219, 179, 0.7), 0 0 20px rgba(255, 255, 255, 0.9)',
          },
          '50%': {
            transform: 'translate(-42px, -105px) rotate(-12deg) scale(1.05)',
            opacity: 0.8,
            boxShadow: '0 12px 30px rgba(2, 132, 199, 0.5)',
          },
          '75%': {
            transform: 'translate(-55px, -48px) rotate(18deg) scale(1.18)',
            opacity: 0.92,
            boxShadow: '0 16px 35px rgba(99, 102, 241, 0.6)',
          },
          '100%': {
            transform: 'translate(0px, 0px) rotate(0deg) scale(0.9)',
            opacity: 0.45,
            boxShadow: '0 8px 20px rgba(193, 219, 179, 0.3)',
          },
        },
      }}
    >
      {/* Enhanced Glassmorphic Floating Bubbles (Rendered ONLY on Nexora Landing Page) */}
      {enableBubbles && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          {BUBBLE_ITEMS.map((b, idx) => (
            <Box
              key={idx}
              sx={{
                position: 'absolute',
                top: b.top,
                left: b.left,
                width: b.size,
                height: b.size,
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 235, 0.75) 70%, ${b.border}33 100%)`,
                backdropFilter: 'blur(8px)',
                border: `2.5px solid ${b.border}`,
                boxShadow: `0 10px 30px ${b.glow}66, inset 0 2px 6px rgba(255, 255, 255, 0.9)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${b.size * 0.46}px`,
                fontWeight: 900,
                color: '#0f172a',
                animation: `floatDynamicOrbit ${b.duration} infinite ease-in-out`,
                animationDelay: b.delay,
                transition: 'all 0.3s ease',
              }}
            >
              {b.symbol}
            </Box>
          ))}
        </Box>
      )}

      {bgImage && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
              pointerEvents: 'none',
              backgroundImage: `url("${bgImage}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />

          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2,
              backgroundColor: `rgba(9, 13, 22, ${overlayOpacity})`,
              backdropFilter: 'brightness(0.82)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      <Box sx={{ position: 'relative', zIndex: 4 }}>
        {children}
      </Box>
    </Box>
  );
};

export default FintechBackground;
