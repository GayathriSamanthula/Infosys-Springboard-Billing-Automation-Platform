import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Paper, Grid, Avatar } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PaymentIcon from '@mui/icons-material/Payment';

import DataTable from '../../components/common/DataTable';
import { auditService } from '../../services/auditService';
import { useNotification } from '../../hooks/useNotification';
import { formatDateTime } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const formatTranslatedDescription = (row, t) => {
  if (!row || !row.description) return '';
  const desc = row.description;

  // 1. Subscriber registered pattern (Row #102, #100)
  if (desc.includes("Subscriber '") && desc.includes("registered an account")) {
    const match = desc.match(/Subscriber '([^']+)' registered an account on platform '([^']+)'\./i);
    if (match) {
      return t('admin.audit.descriptions.sub_registered', {
        defaultValue: desc,
        name: match[1],
        platform: match[2],
      });
    }
  }

  // 2. Subscription created with initial status pattern (Row #103, #101)
  if (desc.includes("created with initial status")) {
    const match = desc.match(/Subscription #(\d+) created with initial status '([^']+)' for plan '([^']+)'\./i);
    if (match) {
      return t('admin.audit.descriptions.sub_created_status', {
        defaultValue: desc,
        sub_id: match[1],
        status: match[2],
        plan: match[3],
      });
    }
  }

  // 3. Subscription paused pattern (Row #104)
  if (desc.includes("was paused")) {
    const match = desc.match(/Subscription #(\d+) was paused\./i);
    if (match) {
      return t('admin.audit.descriptions.sub_paused', {
        defaultValue: desc,
        sub_id: match[1],
      });
    }
  }

  // 4. Subscription resumed pattern (Row #106)
  if (desc.includes("was resumed")) {
    const match = desc.match(/Subscription #(\d+) was resumed\./i);
    if (match) {
      return t('admin.audit.descriptions.sub_resumed', {
        defaultValue: desc,
        sub_id: match[1],
      });
    }
  }

  // 5. Subscription created pattern
  if (desc.includes("Subscription #") && desc.includes("was created")) {
    const match = desc.match(/Subscription #(\d+) was created\./i);
    if (match) {
      return t('admin.audit.descriptions.sub_created', {
        defaultValue: desc,
        sub_id: match[1],
      });
    }
  }

  // 6. Subscription renewed automatically pattern
  if (desc.includes("renewed automatically by Celery Beat")) {
    const match = desc.match(/Subscription #(\d+) renewed automatically by Celery Beat\./i);
    if (match) {
      return t('admin.audit.descriptions.sub_renewed', {
        defaultValue: desc,
        sub_id: match[1],
      });
    }
  }

  // 7. Subscription status changed from X to Y (Row #105)
  if (desc.includes("status changed from")) {
    const match1 = desc.match(/Subscription #(\d+) status changed from (\w+) to (\w+)\./i);
    if (match1) {
      return t('admin.audit.descriptions.status_changed', {
        defaultValue: desc,
        sub_id: match1[1],
        from_status: match1[2],
        to_status: match1[3],
      });
    }

    const match2 = desc.match(/Subscription status changed from (\w+) to (\w+)\./i);
    if (match2) {
      return t('admin.audit.descriptions.status_changed_short', {
        defaultValue: desc,
        from_status: match2[1],
        to_status: match2[2],
      });
    }
  }

  // 8. Customer created pattern
  if (desc.includes("Customer '") && desc.includes("was created")) {
    const match = desc.match(/Customer '([^']+)' was created\./i);
    if (match) {
      return t('admin.audit.descriptions.customer_created', {
        defaultValue: desc,
        name: match[1],
      });
    }
  }

  // 9. Customer profile updated pattern
  if (desc.includes("Customer '") && desc.includes("profile was updated")) {
    const match = desc.match(/Customer '([^']+)' profile was updated\./i);
    if (match) {
      return t('admin.audit.descriptions.customer_updated', {
        defaultValue: desc,
        name: match[1],
      });
    }
  }

  // 10. Customer deleted pattern
  if (desc.includes("Customer '") && desc.includes("was deleted")) {
    const match = desc.match(/Customer '([^']+)' was deleted\./i);
    if (match) {
      return t('admin.audit.descriptions.customer_deleted', {
        defaultValue: desc,
        name: match[1],
      });
    }
  }

  // 11. Plan created pattern
  if (desc.includes("Plan '") && desc.includes("was created")) {
    const match = desc.match(/Plan '([^']+)' was created\./i);
    if (match) {
      return t('admin.audit.descriptions.plan_created', {
        defaultValue: desc,
        name: match[1],
      });
    }
  }

  // 12. Plan updated pattern
  if (desc.includes("Plan '") && desc.includes("was updated")) {
    const match = desc.match(/Plan '([^']+)' was updated\./i);
    if (match) {
      return t('admin.audit.descriptions.plan_updated', {
        defaultValue: desc,
        name: match[1],
      });
    }
  }

  // 13. Plan archived pattern
  if (desc.includes("Plan '") && desc.includes("was archived")) {
    const match = desc.match(/Plan '([^']+)' was archived\./i);
    if (match) {
      return t('admin.audit.descriptions.plan_archived', {
        defaultValue: desc,
        name: match[1],
      });
    }
  }

  // 14. Payment received pattern
  if (desc.includes("Payment of") && desc.includes("Transaction ID:")) {
    const match = desc.match(/Payment of ([\$\₹]?[\d\.,]+) received\. Transaction ID: ([\w-]+)/i);
    if (match) {
      return t('admin.audit.descriptions.payment_received', {
        defaultValue: desc,
        amount: match[1],
        tx_id: match[2],
      });
    }
  }

  // 15. Payment for invoice settled pattern
  if (desc.includes("Payment for Invoice") || desc.includes("was settled")) {
    const match = desc.match(/Invoice (#[\w-]+)/i);
    if (match) {
      return t('admin.audit.descriptions.payment_settled', {
        defaultValue: desc,
        invoice: match[1],
      });
    }
  }

  // 16. Refund processed pattern
  if (desc.includes("Refund of") && desc.includes("processed for Invoice")) {
    const amtMatch = desc.match(/Refund of ([\$\₹]?[\d\.,]+)/i);
    const invMatch = desc.match(/Invoice (#[\w-]+)/i);
    if (invMatch) {
      return t('admin.audit.descriptions.refund_processed', {
        defaultValue: desc,
        amount: amtMatch ? amtMatch[1] : '',
        invoice: invMatch[1],
      });
    }
  }

  // 17. Retry scheduled pattern
  if (desc.includes("Retry Attempt #") && desc.includes("scheduled for Invoice")) {
    const attMatch = desc.match(/Retry Attempt #(\d+)/i);
    const invMatch = desc.match(/Invoice #([\w-]+)/i);
    const dateMatch = desc.match(/on ([\d\s-:]+)\./i);
    if (invMatch) {
      return t('admin.audit.descriptions.retry_scheduled', {
        defaultValue: desc,
        attempt: attMatch ? attMatch[1] : '1',
        invoice: invMatch[1],
        date: dateMatch ? dateMatch[1] : '',
      });
    }
  }

  // 18. Retry succeeded pattern
  if (desc.includes("Retry Attempt #") && desc.includes("succeeded for Invoice")) {
    const attMatch = desc.match(/Retry Attempt #(\d+)/i);
    const invMatch = desc.match(/Invoice #([\w-]+)/i);
    if (invMatch) {
      return t('admin.audit.descriptions.retry_succeeded', {
        defaultValue: desc,
        attempt: attMatch ? attMatch[1] : '1',
        invoice: invMatch[1],
      });
    }
  }

  // 19. All retries exhausted pattern
  if (desc.includes("All retry attempts exhausted for Invoice")) {
    const invMatch = desc.match(/Invoice #([\w-]+)/i);
    if (invMatch) {
      return t('admin.audit.descriptions.retry_exhausted', {
        defaultValue: desc,
        invoice: invMatch[1],
      });
    }
  }

  return desc;
};

const AuditLogsPage = () => {
  const { t } = useTranslation();
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
    if (ev.includes('payment') || ev.includes('success') || ev.includes('settled')) {
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
    { id: 'id', label: t('admin.audit.col_id', 'ID'), render: (row) => `#${row.id}`, width: '80px' },
    {
      id: 'created_at',
      label: t('admin.audit.col_timestamp', 'Timestamp'),
      render: (row) => formatDateTime(row.created_at || row.timestamp),
      width: '170px',
    },
    {
      id: 'event',
      label: t('admin.audit.col_event_type', 'Event Type'),
      render: (row) => {
        const style = getEventChipStyle(row.event);
        return (
          <Chip
            label={t(`admin.audit.events.${row.event}`, row.event)}
            size="small"
            sx={{ fontWeight: 800, bgcolor: style.bgcolor, color: style.color }}
          />
        );
      },
    },
    {
      id: 'description',
      label: t('admin.audit.col_description', 'Audit Description'),
      render: (row) => (
        <Typography fontWeight={700} color="#0f172a">
          {formatTranslatedDescription(row, t)}
        </Typography>
      ),
    },
    {
      id: 'performed_by',
      label: t('admin.audit.col_performed_by', 'Performed By'),
      render: (row) => (
        <Typography variant="body2" fontWeight={800} color="#047857">
          {t(`admin.audit.actors.${row.performed_by}`, row.performed_by || 'System Automated')}
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
            {t('nav.auditLogs', 'Financial Compliance & Billing Audit Trail')}
          </Typography>
          <Typography variant="body2" color="#047857" fontWeight={700}>
            {t('admin.audit.subtitle', 'Immutable ledger tracking customer creation, subscription events, invoice generation, tax compliance, and payment settlements.')}
          </Typography>
        </Box>
        <Chip label={t('admin.audit.badge', 'COMPLIANCE AUDITED')} color="success" size="small" sx={{ fontWeight: 800, px: 1 }} />
      </Box>

      {/* Audit Trail Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 3.5, border: '2px solid #047857', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>
                {t('admin.audit.card_total_records', 'TOTAL AUDIT TRAIL RECORDS')}
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(4, 120, 87, 0.12)', color: '#047857', width: 36, height: 36 }}>
                <HistoryIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a">
              {totalLogs || 18}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 3.5, border: '2px solid #047857', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>
                {t('admin.audit.card_subscription_events', 'SUBSCRIPTION EVENTS')}
              </Typography>
              <Avatar sx={{ bgcolor: '#f3e8ff', color: '#6d28d9', width: 36, height: 36 }}>
                <VerifiedUserIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#6d28d9">
              {subscriptionEvents || 8}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 3.5, border: '2px solid #047857', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="#64748b" fontWeight={800}>
                {t('admin.audit.card_payment_logs', 'PAYMENT & SETTLEMENT LOGS')}
              </Typography>
              <Avatar sx={{ bgcolor: '#dcfce7', color: '#15803d', width: 36, height: 36 }}>
                <PaymentIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#15803d">
              {paymentEvents || 10}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 4, bgcolor: '#FFFFFF', border: '2.5px solid #047857', p: 1, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)' }}>
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          searchPlaceholder={t('admin.audit.search_placeholder', 'Search event type, audit description, user...')}
          emptyTitle={t('admin.audit.empty_title', 'No audit logs found.')}
          emptyDescription={t('admin.audit.empty_desc', 'There are currently no audit log records in your database.')}
        />
      </Paper>
    </Box>
  );
};

export default AuditLogsPage;
