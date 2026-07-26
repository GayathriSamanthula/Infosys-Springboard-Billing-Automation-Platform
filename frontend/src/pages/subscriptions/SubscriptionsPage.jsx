import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import CreateSubscriptionModal from './CreateSubscriptionModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { subscriptionService } from '../../services/subscriptionService';
import { useNotification } from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [selectedSub, setSelectedSub] = useState(null);
  const [actionType, setActionType] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getAll();
      setSubscriptions(data);
    } catch {
      showNotification('Failed to fetch subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCreate = async (data) => {
    try {
      await subscriptionService.create(data);
      showNotification('Subscription activated successfully', 'success');
      fetchSubscriptions();
    } catch {
      showNotification('Failed to create subscription', 'error');
    }
  };

  const handleActionConfirm = async () => {
    if (!selectedSub || !actionType) return;
    try {
      if (actionType === 'pause') {
        await subscriptionService.pause(selectedSub.id);
        showNotification('Subscription paused', 'info');
      } else if (actionType === 'resume') {
        await subscriptionService.resume(selectedSub.id);
        showNotification('Subscription resumed', 'success');
      } else if (actionType === 'cancel') {
        await subscriptionService.cancel(selectedSub.id);
        showNotification('Subscription cancelled', 'warning');
      }
      setConfirmOpen(false);
      fetchSubscriptions();
    } catch {
      showNotification(`Failed to ${actionType} subscription`, 'error');
    }
  };

  const columns = [
    { id: 'id', label: 'Sub ID', render: (row) => `#${row.id}`, width: '90px' },
    {
      id: 'customer_name',
      label: 'Customer',
      render: (row) => (
        <Box>
          <Typography fontWeight={700} color="#0f172a">
            {row.customer_name || row.customerName || `Customer #${row.customer_id}`}
          </Typography>
          {row.customer_email && (
            <Typography variant="caption" color="#64748b" display="block">
              {row.customer_email}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'plan_name',
      label: 'Plan & Product',
      render: (row) => (
        <Box>
          <Typography fontWeight={700} color="#0284c7">
            {row.plan_name || row.planName || `Plan #${row.plan_id}`}
          </Typography>
          {row.product_name && (
            <Typography variant="caption" color="#64748b" display="block">
              {row.product_name}
            </Typography>
          )}
        </Box>
      ),
    },

    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { id: 'start_date', label: 'Start Date', render: (row) => formatDate(row.start_date) },
    { id: 'next_billing_date', label: 'Next Renewal', render: (row) => formatDate(row.next_billing_date || row.end_date) },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedSub(row);
                setDetailsOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" sx={{ color: '#4B5563' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Change Plan (Module 2 Proration)">
            <IconButton
              size="small"
              onClick={() => navigate(`/subscriptions/change-plan/${row.id}`)}
            >
              <SwapHorizIcon fontSize="small" sx={{ color: '#F59E0B' }} />
            </IconButton>
          </Tooltip>

          {(row.status?.toLowerCase() === 'active' || row.status?.toLowerCase() === 'trial') && (
            <Tooltip title="Pause Subscription">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedSub(row);
                  setActionType('pause');
                  setConfirmOpen(true);
                }}
              >
                <PauseCircleIcon fontSize="small" sx={{ color: '#F97316' }} />
              </IconButton>
            </Tooltip>
          )}

          {String(row.status).toUpperCase() === 'PAUSED' && (
            <Tooltip title="Resume Subscription">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedSub(row);
                  setActionType('resume');
                  setConfirmOpen(true);
                }}
              >
                <PlayCircleIcon fontSize="small" sx={{ color: '#10B981' }} />
              </IconButton>
            </Tooltip>
          )}

          {String(row.status).toUpperCase() !== 'CANCELLED' && (
            <Tooltip title="Cancel Subscription">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedSub(row);
                  setActionType('cancel');
                  setConfirmOpen(true);
                }}
              >
                <CancelIcon fontSize="small" sx={{ color: '#EF4444' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#F9FAFB" gutterBottom>
            Subscriptions Engine
          </Typography>
          <Typography variant="body2" color="#F59E0B" fontWeight={600}>
            Manage subscriber billing lifecycles, plans, and renewals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ py: 1.2, px: 2.5 }}
        >
          Create Subscription
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        emptyTitle="No subscriptions found."
        emptyDescription="There are currently no active subscriptions in your FastAPI backend database. Click below to activate a subscription!"
        filterField="status"
        filterOptions={[
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Trial', value: 'TRIAL' },
          { label: 'Past Due', value: 'PAST_DUE' },
          { label: 'Paused', value: 'PAUSED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ]}
        filterLabel="Subscription Status"
        addLabel="Create Subscription"
        onAddClick={() => setCreateOpen(true)}
      />

      <CreateSubscriptionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleActionConfirm}
        title={`${actionType.toUpperCase()} Subscription`}
        content={`Are you sure you want to ${actionType} subscription #${selectedSub?.id}?`}
        confirmText={`${actionType.toUpperCase()} Subscription`}
        confirmColor={actionType === 'cancel' ? 'error' : actionType === 'pause' ? 'warning' : 'success'}
      />

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Subscription State Machine Details (#{selectedSub?.id})</DialogTitle>
        <DialogContent dividers>
          {selectedSub && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Customer ID</Typography>
                <Typography variant="body1" fontWeight={600}>#{selectedSub.customer_id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">State Machine Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusBadge status={selectedSub.status} />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Plan ID</Typography>
                <Typography variant="body1" fontWeight={600}>#{selectedSub.plan_id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Auto Renew</Typography>
                <Typography variant="body1" fontWeight={600}>{selectedSub.auto_renew ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Start Date</Typography>
                <Typography variant="body1">{formatDate(selectedSub.start_date)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">End Date</Typography>
                <Typography variant="body1">{formatDate(selectedSub.end_date)}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailsOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionsPage;
