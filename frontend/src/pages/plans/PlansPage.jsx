import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import PlanFormModal from './PlanFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { planService } from '../../services/planService';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency } from '../../utils/formatters';

const PlansPage = () => {
  const { showNotification } = useNotification();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await planService.getAll();
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      showNotification('Failed to fetch subscription plans from backend API', 'error');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreate = async (data) => {
    try {
      await planService.create(data);
      showNotification('Subscription plan created in database', 'success');
      fetchPlans();
    } catch (err) {
      showNotification(String(err?.response?.data?.detail || 'Failed to create plan in backend'), 'error');
    }
  };

  const handleUpdate = async (data) => {
    if (!selectedPlan) return;
    try {
      await planService.update(selectedPlan.id, data);
      showNotification('Subscription plan updated in database', 'success');
      fetchPlans();
    } catch (err) {
      showNotification(String(err?.response?.data?.detail || 'Failed to update plan in backend'), 'error');
    }
  };

  const handleArchive = async () => {
    if (!selectedPlan) return;
    try {
      await planService.archive(selectedPlan.id);
      showNotification('Plan archived in database', 'success');
      setArchiveOpen(false);
      fetchPlans();
    } catch (err) {
      showNotification(String(err?.response?.data?.detail || 'Failed to archive plan in backend'), 'error');
    }
  };

  const columns = [
    { id: 'id', label: 'ID', render: (row) => `#${row.id}`, width: '80px' },
    {
      id: 'name',
      label: 'Plan Name',
      render: (row) => (
        <Box>
          <Typography fontWeight={700} color="#0f172a">{row.name}</Typography>
          {row.description && (
            <Typography variant="caption" color="#64748b" display="block">
              {row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'price',
      label: 'Price',
      render: (row) => (
        <Typography fontWeight={700} color="#F59E0B">
          {formatCurrency(row.price)}
        </Typography>
      ),
    },

    {
      id: 'billing_cycle',
      label: 'Billing Cycle',
      render: (row) => (
        <Chip
          label={row.billing_cycle || 'monthly'}
          size="small"
          variant="outlined"
          sx={{ textTransform: 'capitalize', fontWeight: 600, borderColor: '#D1D5DB', color: '#111827' }}
        />
      ),
    },
    {
      id: 'trial_period_days',
      label: 'Trial Period',
      render: (row) => `${row.trial_period_days ?? 0} Days`,
    },
    {
      id: 'features',
      label: 'Features',
      render: (row) => (
        <Typography variant="body2" color="#4B5563" noWrap sx={{ maxWidth: 200 }}>
          {row.features || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status || (row.is_archived ? 'ARCHIVED' : 'ACTIVE')} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Update Plan">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedPlan(row);
                setFormOpen(true);
              }}
            >
              <EditIcon fontSize="small" sx={{ color: '#F59E0B' }} />
            </IconButton>
          </Tooltip>
          {!row.is_archived && row.status !== 'ARCHIVED' && (
            <Tooltip title="Archive Plan">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedPlan(row);
                  setArchiveOpen(true);
                }}
              >
                <ArchiveIcon fontSize="small" sx={{ color: '#F97316' }} />
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
            Subscription Plans
          </Typography>
          <Typography variant="body2" color="#F59E0B" fontWeight={600}>
            Configure pricing tiers, billing cycles (monthly/annual), and trial period entitlements
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedPlan(null);
            setFormOpen(true);
          }}
          sx={{ py: 1.2, px: 2.5 }}
        >
          Create Plan
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        searchPlaceholder="Search plan by name, features..."
        filterField="status"
        filterOptions={[
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Archived', value: 'ARCHIVED' },
        ]}
        filterLabel="Plan Status"
        emptyTitle="No subscription plans found."
        emptyDescription="There are currently no subscription plans in your FastAPI backend database. Click below to add a plan!"
        addLabel="Create Plan"
        onAddClick={() => {
          setSelectedPlan(null);
          setFormOpen(true);
        }}
      />

      <PlanFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={selectedPlan ? handleUpdate : handleCreate}
        initialData={selectedPlan}
      />

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title="Archive Subscription Plan"
        content={`Are you sure you want to archive plan "${selectedPlan?.name}" (ID #${selectedPlan?.id}) in the database?`}
        confirmText="Archive Plan"
        confirmColor="warning"
      />
    </Box>
  );
};

export default PlansPage;
