import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import CustomerFormModal from './CustomerFormModal';
import CustomerDetailsModal from './CustomerDetailsModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { customerService } from '../../services/customerService';
import { useNotification } from '../../hooks/useNotification';

const CustomersPage = () => {
  const { showNotification } = useNotification();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch {
      showNotification('Failed to fetch customer list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = async (data) => {
    try {
      await customerService.create(data);
      showNotification('Customer created successfully', 'success');
      fetchCustomers();
    } catch {
      showNotification('Failed to create customer', 'error');
    }
  };

  const handleUpdate = async (data) => {
    if (!selectedCustomer) return;
    try {
      await customerService.update(selectedCustomer.id, data);
      showNotification('Customer updated successfully', 'success');
      fetchCustomers();
    } catch {
      showNotification('Failed to update customer', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await customerService.delete(selectedCustomer.id);
      showNotification('Customer deleted successfully', 'success');
      setDeleteOpen(false);
      fetchCustomers();
    } catch {
      showNotification('Failed to delete customer', 'error');
    }
  };

  const columns = [
    { id: 'id', label: 'ID', render: (row) => `#${row.id}`, width: '80px' },
    { id: 'full_name', label: 'Customer Name', render: (row) => <Typography fontWeight={700} color="#0f172a">{row.full_name}</Typography> },
    { id: 'email', label: 'Email Address' },
    {
      id: 'business_name',
      label: 'Business Tenant',
      render: (row) => (
        <Typography fontWeight={600} color="#0284c7">
          {row.business_name || (row.business_id ? `Business #${row.business_id}` : 'Default Business')}
        </Typography>
      ),
    },

    { id: 'phone_number', label: 'Phone' },
    { id: 'country', label: 'Country' },
    { id: 'customer_status', label: 'Status', render: (row) => <StatusBadge status={row.customer_status} /> },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View Profile">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedCustomer(row);
                setDetailsOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" sx={{ color: '#4B5563' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Account">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedCustomer(row);
                setFormOpen(true);
              }}
            >
              <EditIcon fontSize="small" sx={{ color: '#F59E0B' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Account">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedCustomer(row);
                setDeleteOpen(true);
              }}
            >
              <DeleteIcon fontSize="small" sx={{ color: '#EF4444' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#F9FAFB" gutterBottom>
            Customer Directory
          </Typography>
          <Typography variant="body2" color="#F59E0B" fontWeight={600}>
            Manage subscriber accounts, contact emails, countries, and status configurations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedCustomer(null);
            setFormOpen(true);
          }}
          sx={{ py: 1.2, px: 2.5 }}
        >
          Add Customer
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search customer ID, name, email..."
        emptyTitle="No customers found."
        emptyDescription="There are currently no customer accounts in your FastAPI backend database. Click below to add a new customer!"
        filterField="customer_status"
        filterOptions={[
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
        ]}
        filterLabel="Account Status"
        addLabel="Add Customer"
        onAddClick={() => {
          setSelectedCustomer(null);
          setFormOpen(true);
        }}
      />

      <CustomerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={selectedCustomer ? handleUpdate : handleCreate}
        initialData={selectedCustomer}
      />

      <CustomerDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        customer={selectedCustomer}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer Account"
        content={`Are you sure you want to delete ${selectedCustomer?.full_name}?`}
        confirmText="Delete Account"
      />
    </Box>
  );
};

export default CustomersPage;
