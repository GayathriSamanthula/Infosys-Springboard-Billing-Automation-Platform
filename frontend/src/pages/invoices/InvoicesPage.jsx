import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Drawer,
  Divider,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import AddTaskIcon from '@mui/icons-material/AddTask';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useNavigate } from 'react-router-dom';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { invoiceService } from '../../services/invoiceService';
import { useNotification } from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';

const InvoicesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer state for itemized invoice inspection
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getAll();
      setInvoices(data);
    } catch {
      showNotification('Failed to fetch invoices list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenDrawer = async (row) => {
    setSelectedInvoice(row);
    setDrawerOpen(true);
    try {
      const items = await invoiceService.getLineItems(row.id);
      setLineItems(items);
    } catch {
      setLineItems([]);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedInvoice(null);
    setLineItems([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (selectedInvoice) {
      window.open(invoiceService.downloadHtmlUrl(selectedInvoice.id), '_blank');
      showNotification(`Opening Tax Invoice ${selectedInvoice.invoice_number} for download/print`, 'success');
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const newInv = await invoiceService.generateItemizedInvoice(1);
      showNotification(`Itemized Invoice ${newInv.invoice_number} generated!`, 'success');
      fetchInvoices();
    } catch {
      showNotification('Failed to generate itemized invoice', 'error');
    }
  };

  const columns = [
    {
      id: 'invoice_number',
      label: 'Invoice #',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon fontSize="small" sx={{ color: '#0284c7' }} />
          <Typography fontWeight={700} color="#0284c7">
            {row.invoice_number}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'customer_name',
      label: 'Customer & Plan',
      render: (row) => (
        <Box>
          <Typography fontWeight={700} color="#0f172a">
            {row.customer_name || row.customerName || `Customer for Sub #${row.subscription_id}`}
          </Typography>
          {row.plan_name && (
            <Typography variant="caption" color="#0284c7" display="block">
              {row.plan_name} {row.product_name ? `(${row.product_name})` : ''}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'subscription_id',
      label: 'Subscription ID',
      render: (row) => `#${row.subscription_id}`,
    },

    {
      id: 'issue_date',
      label: 'Issue Date',
      render: (row) => formatDate(row.issue_date),
    },
    {
      id: 'due_date',
      label: 'Due Date',
      render: (row) => formatDate(row.due_date),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'amount',
      label: 'Total Amount',
      render: (row) => (
        <Typography fontWeight={800} color="#0f172a">
          {formatCurrency(row.amount)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View Invoice Drawer Details">
            <IconButton size="small" onClick={() => handleOpenDrawer(row)}>
              <VisibilityIcon fontSize="small" sx={{ color: '#0284c7' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download / Print Printable Invoice">
            <IconButton size="small" onClick={() => window.open(invoiceService.downloadHtmlUrl(row.id), '_blank')}>
              <DownloadIcon fontSize="small" sx={{ color: '#0284c7' }} />
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
          <Typography variant="h4" fontWeight={900} color="#0f172a" gutterBottom>
            Invoices & Billing Statements
          </Typography>
          <Typography variant="body2" color="#64748b" fontWeight={600}>
            Monitor itemized customer invoices, taxes, payment statuses, and print/export receipts.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddTaskIcon />}
          onClick={handleGenerateInvoice}
          sx={{ py: 1.2, px: 2.5, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
        >
          Generate Itemized Invoice
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        emptyTitle="No invoices found."
        emptyDescription="There are currently no invoice records in your database."
        filterField="status"
        filterOptions={[
          { label: 'Paid', value: 'paid' },
          { label: 'Pending', value: 'pending' },
          { label: 'Unpaid', value: 'unpaid' },
          { label: 'Overdue', value: 'overdue' },
          { label: 'Refunded', value: 'refunded' },
        ]}
        filterLabel="Invoice Status"
      />

      {/* Invoice Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 550 }, p: 3 } }}
      >
        {selectedInvoice && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Invoice Statement
                </Typography>
                <Typography variant="caption" color="#64748b">
                  {selectedInvoice.invoice_number}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDrawer}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b" display="block">
                    Invoice Status
                  </Typography>
                  <StatusBadge status={selectedInvoice.status} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b" display="block">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#0284c7">
                    {formatCurrency(selectedInvoice.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b" display="block">
                    Issue Date
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatDate(selectedInvoice.issue_date)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b" display="block">
                    Due Date
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatDate(selectedInvoice.due_date)}
                  </Typography>
                </Grid>
                {selectedInvoice.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="#64748b" display="block">
                      Billing Remarks / Transition Details
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                      {selectedInvoice.remarks}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
              Itemized Line Items
            </Typography>

            <Table size="small" sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 1 }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell><Typography variant="caption" fontWeight={800}>Description</Typography></TableCell>
                  <TableCell align="right"><Typography variant="caption" fontWeight={800}>Amount</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItems.length > 0 ? (
                  lineItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Typography variant="body2">{item.description}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={700}>{formatCurrency(item.amount)}</Typography></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      <Typography variant="caption" color="#64748b">
                        Standard subscription billing charge
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ borderRadius: 2 }}
              >
                Print Invoice
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ borderRadius: 2, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
              >
                Download PDF
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default InvoicesPage;
