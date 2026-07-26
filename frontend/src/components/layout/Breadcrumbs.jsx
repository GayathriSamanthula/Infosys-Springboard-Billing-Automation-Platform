import React from 'react';
import { Breadcrumbs as MUIBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || pathnames[0] === 'login') return null;

  return (
    <Box sx={{ mb: 2 }}>
      <MUIBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: '#94a3b8' }} />}
        aria-label="breadcrumb"
      >
        <Link
          component={RouterLink}
          to="/dashboard"
          sx={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', '&:hover': { color: '#6366f1' } }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Home
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const formattedName = value.replace(/-/g, ' ').toUpperCase();

          return last ? (
            <Typography key={to} color="text.primary" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {formattedName}
            </Typography>
          ) : (
            <Link
              component={RouterLink}
              to={to}
              key={to}
              sx={{ color: '#64748b', fontSize: '0.85rem', '&:hover': { color: '#6366f1' } }}
            >
              {formattedName}
            </Link>
          );
        })}
      </MUIBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
