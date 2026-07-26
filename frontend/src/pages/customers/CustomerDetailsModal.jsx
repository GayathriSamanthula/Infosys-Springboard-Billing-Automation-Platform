import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import CustomModal from '../../components/common/CustomModal';
import StatusBadge from '../../components/common/StatusBadge';

const CustomerDetailsModal = ({ open, onClose, customer }) => {
  if (!customer) return null;

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Customer Profile & Billing Details"
      actions={
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      }
    >
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Customer ID</Typography>
          <Typography variant="body1" fontWeight={600}>#{customer.id}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Account Status</Typography>
          <Box sx={{ mt: 0.5 }}>
            <StatusBadge status={customer.customer_status} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">Full Name / Company</Typography>
          <Typography variant="body1" fontWeight={600}>{customer.full_name}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Billing Email</Typography>
          <Typography variant="body1" fontWeight={600}>{customer.email}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Phone Number</Typography>
          <Typography variant="body1" fontWeight={600}>{customer.phone_number}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Country</Typography>
          <Typography variant="body1" fontWeight={600}>{customer.country}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Address</Typography>
          <Typography variant="body1">{customer.address || 'N/A'}</Typography>
        </Grid>
      </Grid>
    </CustomModal>
  );
};

export default CustomerDetailsModal;
