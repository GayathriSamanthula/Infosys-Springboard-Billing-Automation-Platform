import React from 'react';
import { Box } from '@mui/material';

// High-resolution digital payment, credit card & subscription billing artwork (0 cubes, 0 blockchain, 0 crypto, 0 office)
export const FINTECH_BG_IMAGES = {
  login: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1920&auto=format&fit=crop', // Dark Navy & Black Digital Payment Gateway & Secure Authentication Network
  dashboard: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1920&auto=format&fit=crop', // Revenue analytics & financial dashboard grid
  customers: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1920&auto=format&fit=crop', // Connected subscriber financial nodes
  plans: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1920&auto=format&fit=crop', // Tier pricing & analytics growth artwork
  subscriptions: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1920&auto=format&fit=crop', // Recurring billing lifecycle & calendar statement flow
  payments: 'https://images.unsplash.com/photo-1556742049-0a67daf4095c?q=80&w=1920&auto=format&fit=crop', // Secure payment gateway & credit card authorization
  invoices: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1920&auto=format&fit=crop', // Itemized invoice & statement vector artwork
  default: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1920&auto=format&fit=crop',
};

const FintechBackground = ({ children, overlayOpacity = 0.55, bgImage }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#FFFFFF',
      }}
    >
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
              zIndex: 1,
              pointerEvents: 'none',
              opacity: 0.4,
            }}
          >
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="goldBlueGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path d="M-50,150 Q400,50 800,250 T1800,100" fill="none" stroke="url(#goldBlueGlow)" strokeWidth="1.2" strokeDasharray="6,4" />
              <path d="M100,650 Q600,350 1100,750 T1900,450" fill="none" stroke="url(#goldBlueGlow)" strokeWidth="1" strokeDasharray="4,4" />

              <circle cx="400" cy="120" r="4" fill="#F59E0B" style={{ filter: 'drop-shadow(0 0 8px #F59E0B)' }} />
              <circle cx="800" cy="250" r="5" fill="#0ea5e9" style={{ filter: 'drop-shadow(0 0 10px #0ea5e9)' }} />
              <circle cx="1100" cy="450" r="4" fill="#F59E0B" style={{ filter: 'drop-shadow(0 0 8px #F59E0B)' }} />
              <circle cx="600" cy="350" r="5" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 8px #38bdf8)' }} />
            </svg>
          </Box>

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

          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 3,
              pointerEvents: 'none',
              backgroundImage: `
                radial-gradient(circle at 20% 25%, rgba(245, 158, 11, 0.15) 0%, transparent 45%),
                radial-gradient(circle at 80% 75%, rgba(14, 165, 233, 0.18) 0%, transparent 50%)
              `,
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
