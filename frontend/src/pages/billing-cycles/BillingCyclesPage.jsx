import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { billingCycleService } from '../../services/billingCycleService';
import { useNotification } from '../../hooks/useNotification';
import { formatDate } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const BillingCyclesPage = () => {
  const { t } = useTranslation();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const { showNotification } = useNotification();

  const fetchBillingCycles = async () => {
    setLoading(true);
    try {
      const data = await billingCycleService.getAll();
      const rawList = Array.isArray(data) ? data : [];
      const uniqueCycles = Array.from(
        new Map(rawList.map((item) => [item.subscription_id || item.id, item])).values()
      );
      setCycles(uniqueCycles);
    } catch (err) {
      showNotification('Failed to fetch billing cycles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingCycles();
  }, []);

  const handleRunEngine = async () => {
    setRunning(true);
    try {
      const res = await billingCycleService.runBillingEngine();
      showNotification(res.message || 'Billing cycle engine executed successfully', 'success');
      await fetchBillingCycles();
    } catch (err) {
      showNotification('Failed to execute billing engine', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a" gutterBottom>
            {t('nav.billingCycles', 'Nexora Billing Cycles Engine')}
          </Typography>
          <Typography variant="body2" color="#64748b" fontWeight={600}>
            {t('admin.billing_cycles.subtitle', 'Automated subscription cycle calculations, renewal schedules, and date maintenance')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={running ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
          onClick={handleRunEngine}
          disabled={running}
          sx={{
            py: 1.2,
            px: 3,
            fontWeight: 800,
            borderRadius: 2.5,
            bgcolor: '#0284c7',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
            '&:hover': { bgcolor: '#0369a1' },
          }}
        >
          {running ? t('common.loading', 'Executing Engine...') : t('admin.billing_cycles.run_button', 'Run Billing Engine')}
        </Button>
      </Box>

      {/* Engine Overview Metrics */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <AutorenewIcon sx={{ color: '#10b981' }} />
              <Typography variant="caption" fontWeight={800} color="#64748b">{t('admin.billing_cycles.card_monthly', 'MONTHLY ENGINE')}</Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#047857">{t('admin.billing_cycles.30_days', '30 Days')}</Typography>
            <Typography variant="caption" color="#10b981" fontWeight={700}>{t('admin.billing_cycles.auto_renewal_30d', 'Auto-Renewal (+30d)')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <CalendarMonthIcon sx={{ color: '#0284c7' }} />
              <Typography variant="caption" fontWeight={800} color="#64748b">{t('admin.billing_cycles.card_quarterly', 'QUARTERLY ENGINE')}</Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#0369a1">{t('admin.billing_cycles.90_days', '90 Days')}</Typography>
            <Typography variant="caption" color="#0284c7" fontWeight={700}>{t('admin.billing_cycles.quarterly_90d', 'Quarterly Cycle (+90d)')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <EventRepeatIcon sx={{ color: '#f57c00' }} />
              <Typography variant="caption" fontWeight={800} color="#64748b">{t('admin.billing_cycles.card_semi_annual', 'SEMI-ANNUAL ENGINE')}</Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#e65100">{t('admin.billing_cycles.182_days', '182 Days')}</Typography>
            <Typography variant="caption" color="#f57c00" fontWeight={700}>{t('admin.billing_cycles.semi_annual_182d', 'Semi-Annual Cycle (+182d)')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <CheckCircleOutlineIcon sx={{ color: '#6366f1' }} />
              <Typography variant="caption" fontWeight={800} color="#64748b">{t('admin.billing_cycles.card_yearly', 'YEARLY ENGINE')}</Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#4338ca">{t('admin.billing_cycles.365_days', '365 Days')}</Typography>
            <Typography variant="caption" color="#6366f1" fontWeight={700}>{t('admin.billing_cycles.annual_365d', 'Annual Cycle (+365d)')}</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Billing Cycles Table */}
      <Card sx={{ borderRadius: 3.5, bgcolor: '#FFFFFF', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 20px -2px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2.5, borderBottom: '1.5px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Typography variant="h6" fontWeight={900} color="#0f172a">
            {t('admin.billing_cycles.table_title', 'Live Synchronized Billing Cycles Table')}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>{t('admin.billing_cycles.col_cycle_id', 'Cycle ID')}</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>{t('admin.billing_cycles.col_customer_id', 'Customer ID')}</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>{t('admin.billing_cycles.col_customer', 'Customer')}</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>{t('admin.billing_cycles.col_plan', 'Plan')}</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>{t('admin.billing_cycles.col_start_date', 'Start Date')}</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>{t('admin.billing_cycles.col_end_date', 'End Date')}</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>{t('admin.billing_cycles.col_renewal_date', 'Renewal Date')}</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>{t('admin.billing_cycles.col_next_billing', 'Next Billing Date')}</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>{t('admin.billing_cycles.col_status', 'Status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress sx={{ color: '#0284c7' }} />
                  </TableCell>
                </TableRow>
              ) : cycles.length > 0 ? (
                cycles.map((row, idx) => {
                  const rawPlanName = String(row.plan_name || '');
                  const planKey = rawPlanName.toLowerCase().replace(/\s+/g, '_');
                  const statusKey = String(row.cycle_status || 'PROCESSED').toLowerCase();
                  return (
                    <TableRow key={row.id || idx} hover sx={{ '&:hover': { bgcolor: '#f0f9ff' } }}>
                      <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#0284c7' }}>#{row.id}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#475569' }}>
                        #{row.customer_id || row.user_id || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {row.customer_name || `Sub #${row.subscription_id}`}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#7e22ce' }}>
                        {t(`plans.${planKey}`, rawPlanName || 'Standard Plan')}
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontWeight: 600 }}>{formatDate(row.billing_start_date)}</TableCell>
                      <TableCell sx={{ color: '#475569', fontWeight: 600 }}>{formatDate(row.billing_end_date)}</TableCell>
                      <TableCell sx={{ color: '#047857', fontWeight: 700 }}>{formatDate(row.renewal_date)}</TableCell>
                      <TableCell sx={{ color: '#0369a1', fontWeight: 700 }}>{formatDate(row.next_billing_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={t(`status.${statusKey}`, row.cycle_status || 'PROCESSED')}
                          size="small"
                          sx={{
                            bgcolor: '#dcfce7',
                            color: '#15803d',
                            fontWeight: 900,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#64748b', fontWeight: 700 }}>
                    {t('admin.billing_cycles.empty_message', 'No active billing cycles recorded in the database.')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default BillingCyclesPage;
