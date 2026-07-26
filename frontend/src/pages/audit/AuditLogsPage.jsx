import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';

import DataTable from '../../components/common/DataTable';
import { auditService } from '../../services/auditService';
import { useNotification } from '../../hooks/useNotification';
import { formatDateTime } from '../../utils/formatters';

const AuditLogsPage = () => {
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await auditService.getAll();
        setLogs(Array.isArray(data) ? data : []);
      } catch {
        showNotification('Failed to fetch audit log trail from backend API', 'error');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns = [
    { id: 'id', label: 'ID', render: (row) => `#${row.id}`, width: '80px' },
    { id: 'created_at', label: 'Timestamp', render: (row) => formatDateTime(row.created_at || row.timestamp), width: '170px' },
    {
      id: 'event',
      label: 'Event Type',
      render: (row) => <Chip label={row.event} size="small" sx={{ fontWeight: 700, bgcolor: '#FEF3C7', color: '#D97706' }} />,
    },
    { id: 'description', label: 'Description', render: (row) => <Typography fontWeight={600} color="#111827">{row.description}</Typography> },
    {
      id: 'performed_by',
      label: 'Performed By',
      render: (row) => (
        <Typography variant="body2" fontWeight={700} color="#111827">
          {row.performed_by || 'System'}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={900} color="#F9FAFB" gutterBottom>
          Financial Compliance Audit Trail
        </Typography>
        <Typography variant="body2" color="#F59E0B" fontWeight={600}>
          Dynamically fetched from FastAPI backend (`GET /audit-logs`)
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchPlaceholder="Search event, description, user..."
        emptyTitle="No audit logs found."
        emptyDescription="There are currently no audit log records in your FastAPI backend database."
      />
    </Box>
  );
};

export default AuditLogsPage;
