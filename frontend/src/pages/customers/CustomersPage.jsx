import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import LockIcon from '@mui/icons-material/Lock';
import { useSearchParams } from 'react-router-dom';
import CustomerDetailsModal from './CustomerDetailsModal';
import CustomerFormModal from './CustomerFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { customerService } from '../../services/customerService';
import { useNotification } from '../../hooks/useNotification';

const CustomersPage = () => {
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchedCustomer, setSearchedCustomer] = useState(null);
  const [error, setError] = useState('');

  // Modals state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) {
      setSearchId(urlId);
      performLookup(urlId);
    }
  }, [searchParams]);

  const performLookup = async (targetId) => {
    const cleanId = String(targetId).trim();
    if (!cleanId) return;

    setLoading(true);
    setError('');
    try {
      const data = await customerService.getHistory(cleanId);
      if (data && data.customer) {
        setSearchedCustomer(data.customer);
      } else {
        const cust = await customerService.getById(cleanId);
        setSearchedCustomer(cust);
      }
    } catch (err) {
      setError(`No customer account found with Customer ID #${cleanId}. Please verify the ID.`);
      setSearchedCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) {
      setError('Please enter a valid Customer ID.');
      setSearchedCustomer(null);
      return;
    }
    performLookup(searchId.trim());
  };

  const handleCreate = async (data) => {
    try {
      const newCust = await customerService.create(data);
      showNotification(`Customer #${newCust.id} (${newCust.full_name}) created successfully`, 'success');
      setSearchId(String(newCust.id));
      setSearchedCustomer(newCust);
      setFormOpen(false);
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch {
      showNotification('Failed to create customer', 'error');
    }
  };

  const handleUpdate = async (data) => {
    if (!searchedCustomer) return;
    try {
      const updated = await customerService.update(searchedCustomer.id, data);
      showNotification(`Customer #${searchedCustomer.id} updated successfully`, 'success');
      setSearchedCustomer(updated);
      setFormOpen(false);
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch {
      showNotification('Failed to update customer', 'error');
    }
  };

  const handleDelete = async () => {
    if (!searchedCustomer) return;
    try {
      await customerService.delete(searchedCustomer.id);
      showNotification(`Customer #${searchedCustomer.id} deleted successfully`, 'success');
      setDeleteOpen(false);
      setSearchedCustomer(null);
      setSearchId('');
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch {
      showNotification('Failed to delete customer', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a" gutterBottom>
            Customer Inspector Directory
          </Typography>
          <Typography variant="body2" color="#0284c7" fontWeight={700}>
            Protected Privacy Access: Customer details are accessible strictly by entering a Customer ID
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            setSearchedCustomer(null);
            setFormOpen(true);
          }}
          sx={{ py: 1.2, px: 2.5, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800 }}
        >
          Add New Customer
        </Button>
      </Box>

      {/* Customer ID Entry & Search Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          mb: 4,
          borderRadius: 4,
          bgcolor: '#FFFFFF !important',
          background: '#FFFFFF !important',
          border: '2.5px solid #0284c7',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.15)',
        }}
      >
        <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 1 }}>
          🔒 Enter Customer ID to Access Details
        </Typography>
        <Typography variant="body2" color="#64748b" sx={{ mb: 3, fontWeight: 600 }}>
          To protect customer privacy, no customer list is displayed without entering a Customer ID.
        </Typography>

        <Box component="form" onSubmit={handleLookup} sx={{ display: 'flex', gap: 2, alignItems: 'center', maxWidth: 600 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter Customer ID (e.g. 10 or 1)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            sx={{
              '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 800, fontSize: '1rem' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#0284c7', borderWidth: 2 },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={<PersonSearchIcon />}
            sx={{ py: 1, px: 3, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800, textTransform: 'none', whitespace: 'nowrap' }}
          >
            {loading ? 'Searching...' : 'Access Customer Data'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2.5, borderRadius: 2 }}>{error}</Alert>}
      </Paper>

      {/* Default Gated Privacy View when no Customer ID is searched */}
      {!searchedCustomer && !loading && !error && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            bgcolor: '#FFFFFF !important',
            border: '2px dashed #cbd5e1',
          }}
        >
          <LockIcon sx={{ fontSize: '3.5rem', color: '#0284c7', mb: 1.5, opacity: 0.8 }} />
          <Typography variant="h5" fontWeight={900} color="#0f172a" sx={{ mb: 1 }}>
            Customer Data Privacy Locked
          </Typography>
          <Typography variant="body1" color="#64748b" sx={{ maxWidth: 520, mx: 'auto', fontWeight: 600 }}>
            No customer profiles are displayed openly. Enter a Customer ID above to retrieve and inspect that specific customer's account, subscriptions, invoices, and billing history.
          </Typography>
        </Paper>
      )}

      {/* Customer Record Box (Only shown after valid Customer ID entry) */}
      {searchedCustomer && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: '#FFFFFF !important',
            border: '2.5px solid #0284c7',
            boxShadow: '0 15px 35px -10px rgba(2, 132, 199, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: '2px solid #e2e8f0', pb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={900} color="#0f172a">
                Customer Record #{searchedCustomer.id}
              </Typography>
              <Typography variant="body2" color="#0284c7" fontWeight={800}>
                Unlocked for Administrative Inspection
              </Typography>
            </Box>
            <StatusBadge status={searchedCustomer.customer_status || searchedCustomer.status || 'ACTIVE'} />
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>FULL NAME</Typography>
              <Typography variant="body1" fontWeight={900} color="#0f172a">{searchedCustomer.full_name || searchedCustomer.name || 'Customer'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>EMAIL ADDRESS</Typography>
              <Typography variant="body1" fontWeight={800} color="#0284c7">{searchedCustomer.email || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>PHONE NUMBER</Typography>
              <Typography variant="body1" fontWeight={700} color="#334155">{searchedCustomer.phone_number || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>COUNTRY</Typography>
              <Typography variant="body1" fontWeight={700} color="#334155">{searchedCustomer.country || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>PLATFORM ORIGIN</Typography>
              <Box sx={{ mt: 0.5 }}>
                {(() => {
                  const isVelora = String(searchedCustomer.platform_source || '').toUpperCase().includes('VELORA');
                  return (
                    <Chip
                      size="small"
                      label={isVelora ? 'Velora Gateway' : 'Nexora Direct'}
                      sx={{
                        bgcolor: isVelora ? '#fff7ed' : '#e0f2fe',
                        color: isVelora ? '#e65100' : '#0284c7',
                        border: `1.5px solid ${isVelora ? '#f57c00' : '#0284c7'}`,
                        fontWeight: 900,
                      }}
                    />
                  );
                })()}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PersonSearchIcon />}
              onClick={() => setDetailsOpen(true)}
              sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800, textTransform: 'none', py: 1.2, px: 3 }}
            >
              Open Complete Inspector (Subscriptions, Invoices, Refunds)
            </Button>
            <Button
              variant="outlined"
              onClick={() => setFormOpen(true)}
              sx={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 800, textTransform: 'none', py: 1.2, px: 3, '&:hover': { borderColor: '#0369a1', bgcolor: '#f0f9ff' } }}
            >
              Edit Account
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteOpen(true)}
              sx={{ fontWeight: 800, textTransform: 'none', py: 1.2, px: 3 }}
            >
              Delete Account
            </Button>
          </Box>
        </Paper>
      )}

      {/* Inspector Modal */}
      {detailsOpen && (
        <CustomerDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          customer={searchedCustomer}
        />
      )}

      {/* Edit Form Modal */}
      {formOpen && (
        <CustomerFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={searchedCustomer ? handleUpdate : handleCreate}
          initialData={searchedCustomer}
        />
      )}

      {/* Delete Confirmation */}
      {deleteOpen && (
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Customer Account"
          content={`Are you sure you want to delete Customer #${searchedCustomer?.id} (${searchedCustomer?.full_name})?`}
          confirmText="Delete Account"
        />
      )}
    </Box>
  );
};

export default CustomersPage;
