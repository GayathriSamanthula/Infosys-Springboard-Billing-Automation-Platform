import React, { useState, useEffect } from 'react';
import { Box, Toolbar, Container } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import FintechBackground, { FINTECH_BG_IMAGES } from '../components/common/FintechBackground';
import { Outlet } from 'react-router-dom';
import { AdminLanguageScope } from '../context/LanguageContext';

const SIDEBAR_WIDTH = 260;

const getRouteBgImage = () => null;

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthOnBack = () => {
      const token = localStorage.getItem('nexora_jwt_token') || localStorage.getItem('token') || localStorage.getItem('nexora_user') || localStorage.getItem('user');
      if (!token) {
        navigate('/login', { replace: true });
      }
    };
    checkAuthOnBack();
    window.addEventListener('popstate', checkAuthOnBack);
    window.addEventListener('pageshow', checkAuthOnBack);
    return () => {
      window.removeEventListener('popstate', checkAuthOnBack);
      window.removeEventListener('pageshow', checkAuthOnBack);
    };
  }, [navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const bgImage = getRouteBgImage(location.pathname);

  return (
    <AdminLanguageScope>
      <FintechBackground overlayOpacity={0.5} bgImage={bgImage}>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Header onDrawerToggle={handleDrawerToggle} sidebarWidth={SIDEBAR_WIDTH} />
          <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} drawerWidth={SIDEBAR_WIDTH} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2.5, sm: 4 },
              width: { sm: `calc(100% - ${SIDEBAR_WIDTH}px)` },
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Toolbar />
            <Breadcrumbs />
            <Container maxWidth="xl" disableGutters sx={{ flex: 1 }}>
              <Outlet />
            </Container>
          </Box>
        </Box>
      </FintechBackground>
    </AdminLanguageScope>
  );
};

export default MainLayout;
