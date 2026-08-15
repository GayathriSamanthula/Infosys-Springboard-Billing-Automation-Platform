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
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { useNavigate } from 'react-router-dom';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { invoiceService } from '../../services/invoiceService';
import { useNotification } from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const InvoicesPage = () => {
  const { t } = useTranslation();
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
      window.dispatchEvent(new CustomEvent('dashboard_refresh'));
    } catch {
      showNotification('Failed to generate itemized invoice', 'error');
    }
  };

  const columns = [
    {
      id: 'invoice_number',
      label: t('admin.invoices.col_invoice_no', 'Invoice #'),
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
      label: t('admin.invoices.col_customer', 'Customer & Customer ID'),
      render: (row) => {
        const custId = row.customer_id || (row.subscription_id ? row.subscription_id : 1);
        return (
          <Box>
            <Typography fontWeight={700} color="#0f172a">
              {row.customer_name || row.customerName || `Customer #${custId}`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
              <Chip
                size="small"
                label={`${t('admin.invoices.customer_id_label', 'Customer ID')}: #${custId}`}
                onClick={() => navigate(`/customers?id=${custId}`)}
                sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 800, cursor: 'pointer', fontSize: '0.72rem' }}
              />
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'subscription_id',
      label: t('admin.invoices.col_sub_id', 'Sub ID'),
      render: (row) => `#${row.subscription_id}`,
    },
    {
      id: 'platform_source',
      label: t('admin.invoices.col_channel', 'Origin Channel'),
      render: (row) => {
        const isVelora = String(row.platform_source || '').toUpperCase().includes('VELORA') || String(row.invoice_number || '').includes('VEL');
        return (
          <Chip
            size="small"
            label={isVelora ? t('admin.subscriptions.velora_gateway', 'Velora Gateway') : t('admin.subscriptions.nexora_direct', 'Nexora Direct')}
            sx={{
              bgcolor: isVelora ? '#fff7ed' : '#e0f2fe',
              color: isVelora ? '#e65100' : '#0284c7',
              border: `1.5px solid ${isVelora ? '#f57c00' : '#0284c7'}`,
              fontWeight: 800,
              fontSize: '0.72rem',
            }}
          />
        );
      },
    },
    {
      id: 'issue_date',
      label: t('admin.invoices.col_issue_date', 'Issue Date'),
      render: (row) => formatDate(row.issue_date),
    },
    {
      id: 'due_date',
      label: t('admin.invoices.col_due_date', 'Due Date'),
      render: (row) => formatDate(row.due_date),
    },
    {
      id: 'status',
      label: t('admin.invoices.col_status', 'Status'),
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'amount',
      label: t('admin.invoices.col_amount', 'Total Amount'),
      render: (row) => (
        <Typography fontWeight={800} color="#0f172a">
          {formatCurrency(row.amount)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: t('admin.invoices.col_actions', 'Actions'),
      align: 'right',
      render: (row) => {
        const custId = row.customer_id || 1;
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title={t('admin.invoices.tooltip_inspect', 'Inspect Customer (Method A)')}>
              <IconButton size="small" onClick={() => navigate(`/customers?id=${custId}`)}>
                <PersonSearchIcon fontSize="small" sx={{ color: '#0284c7' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('admin.invoices.tooltip_view_drawer', 'View Invoice Drawer Details')}>
              <IconButton size="small" onClick={() => handleOpenDrawer(row)}>
                <VisibilityIcon fontSize="small" sx={{ color: '#0284c7' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('admin.invoices.tooltip_download_print', 'Download / Print Printable Invoice')}>
              <IconButton size="small" onClick={() => window.open(invoiceService.downloadHtmlUrl(row.id), '_blank')}>
                <DownloadIcon fontSize="small" sx={{ color: '#0284c7' }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a" gutterBottom>
            {t('nav.invoices', 'Invoices & Billing Statements')}
          </Typography>
          <Typography variant="body2" color="#0284c7" fontWeight={600}>
            {t('admin.invoices.subtitle', 'Itemized tax invoice generation, payment statuses, and printable PDF compliance statements')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddTaskIcon />}
          onClick={handleGenerateInvoice}
          sx={{ py: 1.2, px: 2.5, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800 }}
        >
          {t('admin.invoices.generate_button', 'Generate Itemized Invoice')}
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        emptyTitle={t('admin.invoices.empty_title', 'No invoices found.')}
        emptyDescription={t('admin.invoices.empty_desc', 'There are currently no invoice records in your database.')}
        filterField="status"
        filterOptions={[
          { label: t('status.paid', 'Paid'), value: 'paid' },
          { label: t('status.pending', 'Pending'), value: 'pending' },
          { label: t('status.unpaid', 'Unpaid'), value: 'unpaid' },
          { label: t('status.overdue', 'Overdue'), value: 'overdue' },
          { label: t('status.refunded', 'Refunded'), value: 'refunded' },
        ]}
        filterLabel={t('admin.invoices.filter_label', 'Invoice Status')}
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
                  {t('admin.invoices.drawer_title', 'Invoice Statement')}
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
                    {t('admin.invoices.drawer_status', 'Invoice Status')}
                  </Typography>
                  <StatusBadge status={selectedInvoice.status} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b" display="block">
                    {t('admin.invoices.drawer_total_amount', 'Total Amount')}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#0284c7">
                    {formatCurrency(selectedInvoice.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b" display="block">
                    {t('admin.invoices.drawer_issue_date', 'Issue Date')}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatDate(selectedInvoice.issue_date)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b" display="block">
                    {t('admin.invoices.drawer_due_date', 'Due Date')}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatDate(selectedInvoice.due_date)}
                  </Typography>
                </Grid>
                {selectedInvoice.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="#64748b" display="block">
                      {t('admin.invoices.drawer_remarks', 'Billing Remarks / Transition Details')}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                      {selectedInvoice.remarks}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
              {t('admin.invoices.drawer_line_items_title', 'Itemized Line Items')}
            </Typography>

            <Table size="small" sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 1 }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell><Typography variant="caption" fontWeight={800}>{t('admin.invoices.drawer_col_description', 'Description')}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="caption" fontWeight={800}>{t('admin.invoices.drawer_col_amount', 'Amount')}</Typography></TableCell>
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
                        {t('admin.invoices.drawer_default_item', 'Standard subscription billing charge')}
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
                {t('admin.invoices.btn_print', 'Print Invoice')}
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ borderRadius: 2, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
              >
                {t('admin.invoices.btn_download_pdf', 'Download PDF')}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default InvoicesPage;
