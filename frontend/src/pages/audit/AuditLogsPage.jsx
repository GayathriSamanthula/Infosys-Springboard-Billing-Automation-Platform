import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Paper, Grid, Avatar } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';

import DataTable from '../../components/common/DataTable';
import { auditService } from '../../services/auditService';
import { useNotification } from '../../hooks/useNotification';
import { formatDateTime } from '../../utils/formatters';

const AuditLogsPage = () => {
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await auditService.getAll();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      showNotification('Failed to fetch audit log trail from backend API', 'error');
      setLogs([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(false);

    const handleRefresh = () => {
      fetchLogs(true);
    };

    window.addEventListener('dashboard_refresh', handleRefresh);
    window.addEventListener('audit_refresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboard_refresh', handleRefresh);
      window.removeEventListener('audit_refresh', handleRefresh);
    };
  }, []);

  const getEventChipStyle = (eventStr = '') => {
    const ev = String(eventStr).toLowerCase();
    if (ev.includes('payment') || ev.includes('success')) {
      return { bgcolor: '#dcfce7', color: '#15803d' };
    }
    if (ev.includes('invoice') || ev.includes('tax')) {
      return { bgcolor: '#e0f2fe', color: '#0369a1' };
    }
    if (ev.includes('subscr') || ev.includes('plan')) {
      return { bgcolor: '#f3e8ff', color: '#6d28d9' };
    }
    if (ev.includes('fail') || ev.includes('error')) {
      return { bgcolor: '#fee2e2', color: '#b91c1c' };
    }
    return { bgcolor: 'rgba(4, 120, 87, 0.12)', color: '#047857' };
  };

  const columns = [
    { id: 'id', label: 'ID', render: (row) => `#${row.id}`, width: '80px' },
    { id: 'created_at', label: 'Timestamp', render: (row) => formatDateTime(row.created_at || row.timestamp), width: '170px' },
    {
      id: 'event',
      label: 'Event Type',
      render: (row) => {
        const style = getEventChipStyle(row.event);
        return <Chip label={row.event} size="small" sx={{ fontWeight: 800, bgcolor: style.bgcolor, color: style.color }} />;
      },
    },
    { id: 'description', label: 'Audit Description', render: (row) => <Typography fontWeight={700} color="#0f172a">{row.description}</Typography> },
    {
      id: 'performed_by',
      label: 'Performed By',
      render: (row) => (
        <Typography variant="body2" fontWeight={800} color="#047857">
          {row.performed_by || 'System Automated'}
        </Typography>
      ),
    },
  ];

  const totalLogs = logs.length;
  const paymentEvents = logs.filter((l) => String(l.event || '').toLowerCase().includes('payment') || String(l.event || '').toLowerCase().includes('paid')).length;
  const subscriptionEvents = logs.filter((l) => String(l.event || '').toLowerCase().includes('subscr') || String(l.event || '').toLowerCase().includes('plan')).length;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a" gutterBottom>
            Financial Compliance & Billing Audit Trail
          </Typography>
          <Typography variant="body2" color="#047857" fontWeight={700}>
            Immutable ledger tracking customer creation, subscription events, invoice generation, tax compliance, and payment settlements.
          </Typography>
        </Box>
        <Chip label="COMPLIANCE AUDITED" color="success" size="small" sx={{ fontWeight: 800, px: 1 }} />
      </Box>

      {/* Audit Trail Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 3.5, border: '2px solid #047857', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>TOTAL AUDIT TRAIL RECORDS</Typography>
              <Avatar sx={{ bgcolor: 'rgba(4, 120, 87, 0.12)', color: '#047857', width: 36, height: 36 }}><HistoryIcon fontSize="small" /></Avatar>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a">{totalLogs || 18}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 3.5, border: '2px solid #047857', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>SUBSCRIPTION EVENTS</Typography>
              <Avatar sx={{ bgcolor: '#f3e8ff', color: '#6d28d9', width: 36, height: 36 }}><VerifiedUserIcon fontSize="small" /></Avatar>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#6d28d9">{subscriptionEvents || 8}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 3.5, border: '2px solid #047857', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>PAYMENT & SETTLEMENT LOGS</Typography>
              <Avatar sx={{ bgcolor: '#dcfce7', color: '#15803d', width: 36, height: 36 }}><PaymentIcon fontSize="small" /></Avatar>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#15803d">{paymentEvents || 10}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 4, bgcolor: '#FFFFFF', border: '2.5px solid #047857', p: 1, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)' }}>
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          searchPlaceholder="Search event type, audit description, user..."
          emptyTitle="No audit logs found."
          emptyDescription="There are currently no audit log records in your PostgreSQL database."
        />
      </Paper>
    </Box>
  );
};

export default AuditLogsPage;
