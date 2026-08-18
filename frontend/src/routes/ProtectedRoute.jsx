import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

export const NexoraAdminProtectedRoute = () => {
  const { isAuthenticated, loading, token } = useAuth();
  const storedToken = localStorage.getItem('nexora_jwt_token') || localStorage.getItem('token');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#0284c7' }} />
      </Box>
    );
  }

  return (isAuthenticated && (token || storedToken)) ? <Outlet /> : <Navigate to="/login" replace />;
};

export const VeloraAdminProtectedRoute = () => {
  const adminToken = localStorage.getItem('velora_admin_token');
  return adminToken ? <Outlet /> : <Navigate to="/velora/admin/login" replace />;
};

export const CustomerProtectedRoute = () => {
  const customerToken = localStorage.getItem('customer_token');
  return customerToken ? <Outlet /> : <Navigate to="/customer/login" replace />;
};

export const VeloraCustomerProtectedRoute = () => {
  const customerToken = localStorage.getItem('customer_token');
  return customerToken ? <Outlet /> : <Navigate to="/velora/customer/login" replace />;
};

const ProtectedRoute = NexoraAdminProtectedRoute;
export default ProtectedRoute;
