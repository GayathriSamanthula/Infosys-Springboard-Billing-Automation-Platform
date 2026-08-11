import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

export const NexoraAdminProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const token = localStorage.getItem('nexora_jwt_token') || localStorage.getItem('token') || localStorage.getItem('nexora_user') || localStorage.getItem('user');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#0284c7' }} />
      </Box>
    );
  }

  return (isAuthenticated || token) ? <Outlet /> : <Navigate to="/login" replace />;
};

export const VeloraAdminProtectedRoute = () => {
  const adminUser = localStorage.getItem('velora_admin_user') || localStorage.getItem('velora_admin_token');
  return adminUser ? <Outlet /> : <Navigate to="/velora/admin/login" replace />;
};

export const CustomerProtectedRoute = () => {
  const customerUser = localStorage.getItem('customer_user') || localStorage.getItem('customer_info') || localStorage.getItem('customer_token');
  return customerUser ? <Outlet /> : <Navigate to="/customer/login" replace />;
};

export const VeloraCustomerProtectedRoute = () => {
  const customerUser = localStorage.getItem('customer_user') || localStorage.getItem('customer_info') || localStorage.getItem('customer_token');
  return customerUser ? <Outlet /> : <Navigate to="/velora/customer/login" replace />;
};

const ProtectedRoute = NexoraAdminProtectedRoute;
export default ProtectedRoute;
