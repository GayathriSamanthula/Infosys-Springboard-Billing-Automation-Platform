import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Grid,
  Paper,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DownloadIcon from '@mui/icons-material/Download';
import { customerPortalService } from '../../services/customerPortalService';
import { invoiceService } from '../../services/invoiceService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CustomerInvoicesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentCustomer = customerPortalService.getCurrentCustomer() || {};
  const customerId = currentCustomer?.id || currentCustomer?.customer_id;

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        if (customerId) {
          const portalPayload = await customerPortalService.getDashboardData(customerId);
          setData(portalPayload);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error('Failed to fetch customer invoices:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [customerId]);

  const invoices = data?.invoices || [];
  const totalSpent = data?.summary?.total_spent || 0;
  const totalCount = invoices.length;

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#0f172a">
          Invoices & Tax Receipts
        </Typography>
        <Typography variant="body2" color="#e76f51" fontWeight={700} sx={{ mt: 0.5 }}>
          View itemized billing statements, payment status, and download official tax receipts.
        </Typography>
      </Box>

      {/* Summary Metric Cards: SKY BLUE PALETTE */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, borderRadius: 3.5, border: '2.5px solid #e76f51', bgcolor: '#FFFFFF !important', boxShadow: '0 4px 15px rgba(231, 111, 81, 0.2)' }}>
            <Typography variant="caption" color="#e76f51" fontWeight={900}>
              TOTAL PAID VOLUME
            </Typography>
            <Typography variant="h4" fontWeight={900} color="#e76f51" sx={{ mt: 0.5 }}>
              {formatCurrency(totalSpent)}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, borderRadius: 3.5, border: '2.5px solid #e76f51', bgcolor: '#FFFFFF !important', boxShadow: '0 4px 15px rgba(231, 111, 81, 0.2)' }}>
            <Typography variant="caption" color="#e76f51" fontWeight={900}>
              TOTAL INVOICES ISSUED
            </Typography>
            <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ mt: 0.5 }}>
              {totalCount} Statements
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Table Container */}
      <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#FFFFFF !important', border: '3px solid #e76f51', boxShadow: '0 10px 25px -5px rgba(231, 111, 81, 0.35)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#fdf0ed' }}>
              <TableRow sx={{ borderBottom: '2px solid #f8b4a5' }}>
                <TableCell sx={{ color: '#e76f51', fontWeight: 900 }}>INVOICE REF</TableCell>
                <TableCell sx={{ color: '#e76f51', fontWeight: 900 }}>ISSUE DATE</TableCell>
                <TableCell sx={{ color: '#e76f51', fontWeight: 900 }}>AMOUNT</TableCell>
                <TableCell sx={{ color: '#e76f51', fontWeight: 900 }}>STATUS</TableCell>
                <TableCell align="right" sx={{ color: '#e76f51', fontWeight: 900 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} sx={{ '&:hover': { bgcolor: 'rgba(231, 111, 81, 0.1)' } }}>
                  <TableCell sx={{ fontWeight: 800, color: '#e76f51', fontFamily: 'monospace' }}>
                    {inv.invoice_number}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                    {formatDate(inv.issue_date)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, color: '#0f172a' }}>
                    {formatCurrency(inv.total_amount || inv.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inv.status}
                      size="small"
                      sx={{
                        fontWeight: 900,
                        bgcolor: String(inv.status).toUpperCase() === 'PAID' ? '#fcdad2' : '#fff7ed',
                        color: String(inv.status).toUpperCase() === 'PAID' ? '#e76f51' : '#ea580c',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DownloadIcon />}
                      component="a"
                      href={invoiceService.downloadPdfUrl(inv.id, 'NEXORA')}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ bgcolor: '#e76f51', '&:hover': { bgcolor: '#d45d3f' }, textTransform: 'none', fontWeight: 800 }}
                    >
                      Download PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CustomerInvoicesPage;
