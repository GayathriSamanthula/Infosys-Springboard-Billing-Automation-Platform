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
import { useTranslation } from 'react-i18next';

const PlansPage = () => {
  const { t } = useTranslation();
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
      const uniquePlans = Array.isArray(data)
        ? Array.from(
            new Map(
              data.map((p) => [
                p.name ? p.name.trim().toLowerCase() : p.id,
                p,
              ])
            ).values()
          )
        : [];
      setPlans(uniquePlans);
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
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
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
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
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
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch (err) {
      showNotification(String(err?.response?.data?.detail || 'Failed to archive plan in backend'), 'error');
    }
  };

  const columns = [
    {
      id: 'name',
      label: t('admin.plans.col_name', 'Plan Name'),
      render: (row) => {
        const rawName = String(row.name || '');
        const planKey = rawName.toLowerCase().replace(/\s+/g, '_');
        return (
          <Typography fontWeight={900} color="#0284c7">
            {t(`plans.${planKey}`, rawName)}
          </Typography>
        );
      },
    },
    {
      id: 'price',
      label: t('admin.plans.col_price', 'Price'),
      render: (row) => (
        <Typography fontWeight={900} color="#0f172a">
          {formatCurrency(row.price)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: t('admin.plans.col_actions', 'Actions'),
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title={t('admin.plans.tooltip_edit', 'Update Plan')}>
            <IconButton
              size="small"
              onClick={() => {
                setSelectedPlan(row);
                setFormOpen(true);
              }}
            >
              <EditIcon fontSize="small" sx={{ color: '#0284c7' }} />
            </IconButton>
          </Tooltip>
          {!row.is_archived && row.status !== 'ARCHIVED' && (
            <Tooltip title={t('admin.plans.tooltip_archive', 'Archive Plan')}>
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedPlan(row);
                  setArchiveOpen(true);
                }}
              >
                <ArchiveIcon fontSize="small" sx={{ color: '#64748b' }} />
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
          <Typography variant="h4" fontWeight={900} color="#000000" gutterBottom>
            {t('nav.plans', 'Subscription Plans')}
          </Typography>
          <Typography variant="body2" color="#64748b" fontWeight={700}>
            {t('admin.plans.subtitle', 'Configure pricing tiers, billing cycles (monthly/annual), and trial period entitlements')}
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
          {t('admin.plans.create_button', 'Create Plan')}
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
