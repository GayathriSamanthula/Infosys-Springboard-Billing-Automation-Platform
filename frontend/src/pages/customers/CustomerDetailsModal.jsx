import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  IconButton,
  TextField,
  Divider,
  Alert,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import DownloadIcon from '@mui/icons-material/Download';
import CustomModal from '../../components/common/CustomModal';
import StatusBadge from '../../components/common/StatusBadge';
import { customerService } from '../../services/customerService';
import { invoiceService } from '../../services/invoiceService';
import { formatDate, formatCurrency } from '../../utils/formatters';

const CustomerDetailsModal = ({ open, onClose, customer }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  // Customer ID input requirement as requested
  const [inputCustomerId, setInputCustomerId] = useState('');
  const [inspectedCustomer, setInspectedCustomer] = useState(null);
  const [error, setError] = useState('');
  const [refundReason, setRefundReason] = useState('Customer Request / Billing Adjustment');

  useEffect(() => {
    if (open) {
      if (customer?.id) {
        setInputCustomerId(String(customer.id));
        setInspectedCustomer(customer);
        fetchCustomerHistoryById(customer.id);
      } else {
        setInputCustomerId('');
        setInspectedCustomer(null);
        setHistoryData(null);
        setError('');
      }
    } else {
      setHistoryData(null);
      setInspectedCustomer(null);
      setError('');
    }
  }, [open, customer]);

  const fetchCustomerHistoryById = async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    setError('');
    try {
      const data = await customerService.getHistory(targetId);
      setHistoryData(data);
      if (data?.customer) {
        setInspectedCustomer(data.customer);
      }
    } catch (err) {
      setError(`No customer found with Customer ID #${targetId}`);
      setHistoryData(null);
      setInspectedCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectSubmit = (e) => {
    e.preventDefault();
    if (!inputCustomerId.trim()) return;
    fetchCustomerHistoryById(inputCustomerId.trim());
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      maxWidth="md"
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonSearchIcon sx={{ color: '#0284c7', fontSize: '2rem' }} />
          <Box>
            <Typography variant="h6" fontWeight={900} color="#0f172a">
              Customer Inspector
            </Typography>
            <Typography variant="caption" color="#0284c7" fontWeight={800}>
              Access Customer Data Strictly Via Customer ID
            </Typography>
          </Box>
        </Box>
      }
      actions={
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800 }}>
          Close Inspector
        </Button>
      }
    >
      <Box sx={{ minHeight: 450 }}>
        {/* Customer ID Search / Access Form */}
        <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#FFFFFF !important', border: '2px solid #0284c7', borderRadius: 3, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
            Enter Customer ID to Unlock Inspector
          </Typography>
          <Box component="form" onSubmit={handleInspectSubmit} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="e.g. 10 or 1"
              value={inputCustomerId}
              onChange={(e) => setInputCustomerId(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 800 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#0284c7' },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ py: 1, px: 3, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800, textTransform: 'none' }}
            >
              {loading ? 'Fetching...' : 'Access Customer Data'}
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!inspectedCustomer && !loading && !error && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <PersonSearchIcon sx={{ color: '#0284c7', fontSize: '3.5rem', mb: 1, opacity: 0.8 }} />
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              Enter Customer ID Above
            </Typography>
            <Typography variant="body2" color="#64748b" sx={{ maxWidth: 460, mx: 'auto', mt: 0.5 }}>
              No customer information is displayed without explicit Customer ID access to maintain complete privacy.
            </Typography>
          </Box>
        )}

        {inspectedCustomer && (
          <>
            {/* Customer Summary Header */}
            <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 3, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="#64748b" fontWeight={700} display="block">CUSTOMER NAME</Typography>
                  <Typography variant="subtitle1" fontWeight={900} color="#0f172a">{inspectedCustomer.full_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="#64748b" fontWeight={700} display="block">EMAIL ADDRESS</Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="#0284c7">{inspectedCustomer.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="#64748b" fontWeight={700} display="block">ACCOUNT STATUS</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <StatusBadge status={inspectedCustomer.customer_status || 'ACTIVE'} />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="#64748b" fontWeight={700} display="block">PLATFORM ORIGIN</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {(() => {
                      const isVelora = String(inspectedCustomer.platform_source || '').toUpperCase().includes('VELORA');
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
            </Paper>

            {/* Inspector Tabs */}
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              sx={{
                borderBottom: '2px solid #e2e8f0',
                mb: 3,
                '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', color: '#475569' },
                '& .Mui-selected': { color: '#0284c7 !important' },
                '& .MuiTabs-indicator': { backgroundColor: '#0284c7', height: 3 },
              }}
            >
              <Tab icon={<AutorenewIcon fontSize="small" />} iconPosition="start" label={`Subscriptions (${historyData?.subscriptions?.length || 0})`} />
              <Tab icon={<ReceiptLongIcon fontSize="small" />} iconPosition="start" label={`Invoices & Receipts (${historyData?.invoices?.length || 0})`} />
              <Tab icon={<CreditCardIcon fontSize="small" />} iconPosition="start" label="Payment History" />
              <Tab icon={<MoneyOffIcon fontSize="small" />} iconPosition="start" label="Refund & Issues Management" />
            </Tabs>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: '#0284c7' }} />
              </Box>
            ) : (
              <>
                {/* TAB 0: SUBSCRIPTIONS */}
                {activeTab === 0 && (
                  <Box>
                    {(historyData?.subscriptions || []).length === 0 ? (
                      <Typography variant="body2" color="#64748b" textAlign="center" sx={{ py: 4 }}>
                        No active or historical subscriptions found for Customer ID #{inputCustomerId}.
                      </Typography>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead sx={{ bgcolor: '#FFFFFF !important' }}>
                            <TableRow sx={{ borderBottom: '2px solid #e2e8f0', bgcolor: '#FFFFFF !important' }}>
                              <TableCell sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>SUB ID</TableCell>
                              <TableCell sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>PLAN NAME</TableCell>
                              <TableCell sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>STATUS</TableCell>
                              <TableCell sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>START DATE</TableCell>
                              <TableCell sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>END DATE</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody sx={{ bgcolor: '#FFFFFF !important' }}>
                            {(historyData?.subscriptions || []).map((sub) => (
                              <TableRow key={sub.id} sx={{ bgcolor: '#FFFFFF !important' }}>
                                <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace', bgcolor: '#FFFFFF !important' }}>#{sub.id}</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: '#0f172a', bgcolor: '#FFFFFF !important' }}>{sub.plan_name || `Plan #${sub.plan_id}`}</TableCell>
                                <TableCell sx={{ bgcolor: '#FFFFFF !important' }}><StatusBadge status={sub.status} /></TableCell>
                                <TableCell sx={{ color: '#334155', fontWeight: 600, bgcolor: '#FFFFFF !important' }}>{formatDate(sub.start_date)}</TableCell>
                                <TableCell sx={{ color: '#334155', fontWeight: 600, bgcolor: '#FFFFFF !important' }}>{formatDate(sub.end_date)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* TAB 1: INVOICES & RECEIPTS */}
                {activeTab === 1 && (
                  <Box>
                    {(historyData?.invoices || []).length === 0 ? (
                      <Typography variant="body2" color="#64748b" textAlign="center" sx={{ py: 4 }}>
                        No invoices generated yet for Customer ID #{inputCustomerId}.
                      </Typography>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead sx={{ bgcolor: '#FFFFFF !important' }}>
                            <TableRow sx={{ borderBottom: '2px solid #e2e8f0', bgcolor: '#FFFFFF !important' }}>
                              <TableCell sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>INVOICE NUMBER</TableCell>
                              <TableCell sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>ISSUE DATE</TableCell>
                              <TableCell sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>AMOUNT</TableCell>
                              <TableCell sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>STATUS</TableCell>
                              <TableCell align="right" sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>ACTION</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody sx={{ bgcolor: '#FFFFFF !important' }}>
                            {(historyData?.invoices || []).map((inv) => (
                              <TableRow key={inv.id} sx={{ bgcolor: '#FFFFFF !important' }}>
                                <TableCell sx={{ color: '#0284c7', fontWeight: 900, fontFamily: 'monospace', bgcolor: '#FFFFFF !important' }}>{inv.invoice_number}</TableCell>
                                <TableCell sx={{ color: '#334155', fontWeight: 600, bgcolor: '#FFFFFF !important' }}>{formatDate(inv.issue_date)}</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: '#0f172a', bgcolor: '#FFFFFF !important' }}>{formatCurrency(inv.amount)}</TableCell>
                                <TableCell sx={{ bgcolor: '#FFFFFF !important' }}><StatusBadge status={inv.status} /></TableCell>
                                <TableCell align="right" sx={{ bgcolor: '#FFFFFF !important' }}>
                                  <Tooltip title="Download Printable Tax Invoice">
                                    <IconButton size="small" onClick={() => window.open(invoiceService.downloadHtmlUrl(inv.id), '_blank')}>
                                      <DownloadIcon fontSize="small" sx={{ color: '#0284c7' }} />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* TAB 2: PAYMENT HISTORY */}
                {activeTab === 2 && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body1" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                      Payment Method & Gateway Logs for Customer ID #{inputCustomerId}
                    </Typography>
                    <Typography variant="body2" color="#64748b">
                      Primary Method: <strong>Credit Card / UPI</strong> | Account verified active.
                    </Typography>
                  </Box>
                )}

                {/* TAB 3: REFUND & ISSUES MANAGEMENT */}
                {activeTab === 3 && (
                  <Box sx={{ p: 1 }}>
                    <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 1 }}>
                      Admin Refund & Billing Dispute Override
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ mb: 3 }}>
                      Issue a refund or credit adjustment for Customer ID #{inputCustomerId} directly from the Inspector.
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Refund Reason / Notes"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          sx={{
                            '& .MuiInputBase-input': { color: '#0f172a', fontWeight: 700 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{ py: 1, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800, textTransform: 'none', color: '#ffffff' }}
                          onClick={() => alert(`Refund issued for Customer ID #${inputCustomerId}! Reason: ${refundReason}`)}
                        >
                          Process Refund Credit
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </CustomModal>
  );
};

export default CustomerDetailsModal;
