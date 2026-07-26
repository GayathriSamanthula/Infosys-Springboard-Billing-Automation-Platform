import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
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
import { billingCycleService } from '../../services/billingCycleService';
import { useNotification } from '../../hooks/useNotification';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';

const BillingCyclesPage = () => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const { showNotification } = useNotification();

  const fetchBillingCycles = async () => {
    setLoading(true);
    try {
      const data = await billingCycleService.getAll();
      setCycles(Array.isArray(data) ? data : []);
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
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#F9FAFB" gutterBottom>
            Billing Cycles Engine
          </Typography>
          <Typography variant="body2" color="#9CA3AF">
            Automated subscription cycle calculations, renewal schedules, and date maintenance
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={running ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
          onClick={handleRunEngine}
          disabled={running}
          sx={{ py: 1.2, px: 3, fontWeight: 700, borderRadius: 2 }}
        >
          {running ? 'Executing Engine...' : 'Run Billing Engine'}
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Cycle ID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Renewal Date</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Next Billing Date</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress color="primary" />
                  </TableCell>
                </TableRow>
              ) : cycles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <EmptyState
                      icon={EventRepeatIcon}
                      title="No billing cycles recorded yet."
                      description="Click 'Run Billing Engine' above to process active subscriptions due for renewal."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                cycles.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#1E293B' }}>#{row.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                      {row.customer_name || `Sub #${row.subscription_id}`}
                    </TableCell>
                    <TableCell sx={{ color: '#475569' }}>{row.plan_name || '-'}</TableCell>
                    <TableCell sx={{ color: '#475569' }}>{formatDate(row.billing_start_date)}</TableCell>
                    <TableCell sx={{ color: '#475569' }}>{formatDate(row.billing_end_date)}</TableCell>
                    <TableCell sx={{ color: '#475569' }}>{formatDate(row.renewal_date)}</TableCell>
                    <TableCell sx={{ color: '#475569' }}>{formatDate(row.next_billing_date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.cycle_status || 'PROCESSED'}
                        size="small"
                        sx={{
                          bgcolor: '#DEF7EC',
                          color: '#03543F',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default BillingCyclesPage;
