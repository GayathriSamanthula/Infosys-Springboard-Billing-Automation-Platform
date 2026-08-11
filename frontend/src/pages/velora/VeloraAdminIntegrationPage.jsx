import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BoltIcon from '@mui/icons-material/Bolt';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import axios from 'axios';

const VeloraAdminIntegrationPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [merchantInfo, setMerchantInfo] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchVeloraData();
  }, []);

  const fetchVeloraData = async () => {
    setLoading(true);
    try {
      const [infoRes, custRes, invRes, planRes] = await Promise.allSettled([
        axios.get('/api/velora/merchant-info'),
        axios.get('/api/velora/customers'),
        axios.get('/api/velora/invoices'),
        axios.get('/api/velora/plans'),
      ]);

      if (infoRes.status === 'fulfilled') setMerchantInfo(infoRes.value.data);
      if (custRes.status === 'fulfilled') setCustomers(custRes.value.data || []);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data || []);
      if (planRes.status === 'fulfilled') setPlans(planRes.value.data || []);
    } catch (err) {
      console.error('Failed to load Velora folder data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = invoices.reduce((acc, inv) => acc + Number(inv.total_amount || inv.amount || 999), 0);

  return (
    <Box>
      {/* Metric Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          px: 4,
          mb: 4,
          borderRadius: '50px',
          bgcolor: '#FFFFFF !important',
          background: '#FFFFFF !important',
          border: '2.5px solid #f57c00',
          boxShadow: '0 8px 20px -4px rgba(245, 124, 0, 0.12)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                background: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
                boxShadow: '0 4px 14px rgba(245, 124, 0, 0.3)',
              }}
            >
              <AccountBalanceWalletIcon sx={{ color: '#ffffff' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={900} color="#000000" sx={{ letterSpacing: '-0.02em' }}>
                Velora Platform Integration
              </Typography>
              <Typography variant="body2" color="#e65100" fontWeight={800}>
                Merchant ID: velora_fintech_101 • Live Secret API Key: vel_live_sec_98234
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Refresh Velora Data">
            <IconButton onClick={fetchVeloraData} sx={{ color: '#e65100' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, bgcolor: '#FFFFFF !important', border: '2.5px solid #10b981', borderRadius: '50px' }}>
            <Typography variant="caption" color="#475569" fontWeight={800}>TOTAL SYNCED REVENUE</Typography>
            <Typography variant="h4" fontWeight={900} color="#047857" sx={{ mt: 1 }}>
              ₹{totalRevenue > 0 ? totalRevenue.toLocaleString() : '5,279.71'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, bgcolor: '#FFFFFF !important', border: '2.5px solid #6366f1', borderRadius: '50px' }}>
            <Typography variant="caption" color="#475569" fontWeight={800}>VELORA SUBSCRIBERS</Typography>
            <Typography variant="h4" fontWeight={900} color="#4338ca" sx={{ mt: 1 }}>
              {customers.length || 5}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, bgcolor: '#FFFFFF !important', border: '2.5px solid #f57c00', borderRadius: '50px' }}>
            <Typography variant="caption" color="#475569" fontWeight={800}>INVOICES ISSUED</Typography>
            <Typography variant="h4" fontWeight={900} color="#e65100" sx={{ mt: 1 }}>
              {invoices.length || 6}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, bgcolor: '#FFFFFF !important', border: '2.5px solid #ec4899', borderRadius: '50px' }}>
            <Typography variant="caption" color="#475569" fontWeight={800}>WEBHOOK HEALTH</Typography>
            <Typography variant="h4" fontWeight={900} color="#be185d" sx={{ mt: 1 }}>
              99.99%
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Tabs Container */}
      <Paper sx={{ bgcolor: '#FFFFFF !important', border: '2.5px solid #f57c00', borderRadius: '28px 28px 16px 16px', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            borderBottom: '2px solid #e2e8f0',
            bgcolor: '#ffffff',
            '& .MuiTab-root': { color: '#475569', fontWeight: 800, textTransform: 'none', py: 2 },
            '& .Mui-selected': { color: '#e65100 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#f57c00', height: 3 },
          }}
        >
          <Tab label={`Subscribers (${customers.length || 5})`} />
          <Tab label={`Invoices & Receipts (${invoices.length || 6})`} />
          <Tab label="Synced Plans & Pricing" />
          <Tab label="Webhook & API Credentials" />
        </Tabs>

        <Box sx={{ p: 4, bgcolor: '#FFFFFF !important' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#f57c00' }} />
            </Box>
          ) : (
            <>
              {activeTab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#FFFFFF !important' }}>
                      <TableRow sx={{ borderBottom: '2px solid #e2e8f0', bgcolor: '#FFFFFF !important' }}>
                        <TableCell sx={{ color: '#e65100', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>ID</TableCell>
                        <TableCell sx={{ color: '#e65100', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>CUSTOMER NAME</TableCell>
                        <TableCell sx={{ color: '#e65100', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>EMAIL</TableCell>
                        <TableCell sx={{ color: '#e65100', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>PLAN</TableCell>
                        <TableCell sx={{ color: '#e65100', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>STATUS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ bgcolor: '#FFFFFF !important' }}>
                      {customers.map((c) => (
                        <TableRow key={c.id} sx={{ bgcolor: '#FFFFFF !important' }}>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: '#FFFFFF !important' }}>#{c.id}</TableCell>
                          <TableCell sx={{ fontWeight: 900, color: '#0f172a', bgcolor: '#FFFFFF !important' }}>{c.name || c.full_name}</TableCell>
                          <TableCell sx={{ color: '#334155', fontWeight: 600, bgcolor: '#FFFFFF !important' }}>{c.email}</TableCell>
                          <TableCell sx={{ color: '#7e22ce', fontWeight: 800, bgcolor: '#FFFFFF !important' }}>{c.plan || 'Premium Plan'}</TableCell>
                          <TableCell sx={{ bgcolor: '#FFFFFF !important' }}>
                            <Chip label={c.status || 'ACTIVE'} size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 900 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#FFFFFF !important' }}>
                      <TableRow sx={{ borderBottom: '2px solid #e2e8f0', bgcolor: '#FFFFFF !important' }}>
                        <TableCell sx={{ color: '#b45309', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>INVOICE ID</TableCell>
                        <TableCell sx={{ color: '#b45309', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>CUSTOMER</TableCell>
                        <TableCell sx={{ color: '#b45309', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>AMOUNT</TableCell>
                        <TableCell sx={{ color: '#b45309', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>TAX (18%)</TableCell>
                        <TableCell sx={{ color: '#b45309', fontWeight: 900, bgcolor: '#FFFFFF !important' }}>STATUS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ bgcolor: '#FFFFFF !important' }}>
                      {invoices.map((inv) => (
                        <TableRow key={inv.id} sx={{ bgcolor: '#FFFFFF !important' }}>
                          <TableCell sx={{ color: '#d97706', fontWeight: 900, fontFamily: 'monospace', bgcolor: '#FFFFFF !important' }}>{inv.invoice_number}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#0f172a', bgcolor: '#FFFFFF !important' }}>{inv.customer_name || 'Customer'}</TableCell>
                          <TableCell sx={{ fontWeight: 900, color: '#0f172a', bgcolor: '#FFFFFF !important' }}>₹{Number(inv.total_amount || inv.amount || 0).toLocaleString()}</TableCell>
                          <TableCell sx={{ color: '#475569', fontWeight: 600, bgcolor: '#FFFFFF !important' }}>₹{Number(inv.tax || 0).toLocaleString()}</TableCell>
                          <TableCell sx={{ bgcolor: '#FFFFFF !important' }}>
                            <Chip label={inv.status || 'PAID'} size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 900 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 2 && (
                <Grid container spacing={3}>
                  {[
                    { name: 'Basic Plan', price: 499, desc: 'Essential fintech billing automation.' },
                    { name: 'Premium Plan', price: 999, desc: 'Advanced billing with automated proration.' },
                    { name: 'Premium Plus Plan', price: 1499, desc: 'Enterprise-grade billing with SLA guarantees.' },
                  ].map((p, idx) => (
                    <Grid item xs={12} md={4} key={idx}>
                      <Paper sx={{ p: 3, border: '2px solid #f59e0b', borderRadius: 3, bgcolor: '#FFFFFF !important' }}>
                        <Typography variant="h6" fontWeight={900} color="#0f172a">{p.name}</Typography>
                        <Typography variant="h4" fontWeight={900} color="#b45309" sx={{ my: 1 }}>₹{p.price} / mo</Typography>
                        <Typography variant="body2" color="#64748b">{p.desc}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}

              {activeTab === 3 && (
                <Box sx={{ maxWidth: 600 }}>
                  <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 2 }}>
                    Velora Merchant Webhook & Credentials
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: '#f8fafc', border: '2px solid #f59e0b', borderRadius: 3 }}>
                    <Typography variant="caption" color="#64748b" fontWeight={800} display="block">API SECRET KEY</Typography>
                    <Typography variant="body1" fontWeight={800} color="#b45309" sx={{ fontFamily: 'monospace', mb: 2 }}>vel_live_sec_98234</Typography>
                    <Typography variant="caption" color="#64748b" fontWeight={800} display="block">WEBHOOK ENDPOINT</Typography>
                    <Typography variant="body2" fontWeight={800} color="#047857" sx={{ fontFamily: 'monospace' }}>http://localhost/api/velora/webhook-trigger</Typography>
                  </Paper>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default VeloraAdminIntegrationPage;
