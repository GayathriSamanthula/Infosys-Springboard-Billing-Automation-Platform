import React, { useState } from 'react';
import { Box, Toolbar, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import BusinessHeader from '../components/velora/BusinessHeader';
import BusinessSidebar from '../components/velora/BusinessSidebar';
import VeloraBreadcrumbs from '../components/velora/VeloraBreadcrumbs';

const SIDEBAR_WIDTH = 260;

const VeloraBusinessLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <BusinessHeader onDrawerToggle={handleDrawerToggle} sidebarWidth={SIDEBAR_WIDTH} />
      <BusinessSidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} drawerWidth={SIDEBAR_WIDTH} />
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
        <VeloraBreadcrumbs />
        <Container maxWidth="xl" disableGutters sx={{ flex: 1 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default VeloraBusinessLayout;
