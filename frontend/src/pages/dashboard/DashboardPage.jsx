import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

import { MetricCardsSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { customerService } from '../../services/customerService';
import { planService } from '../../services/planService';
import { subscriptionService } from '../../services/subscriptionService';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { refundService } from '../../services/refundService';
import { notificationService } from '../../services/notificationService';
import { auditService } from '../../services/auditService';
import { formatDateTime } from '../../utils/formatters';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalPlans: 0,
    activeSubscriptions: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    failedPayments: 0,
    refundCount: 0,
  });

  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [custs, plans, subs, invs, payments, refunds, notifs, logs] = await Promise.all([
          customerService.getAll(),
          planService.getAll(),
          subscriptionService.getAll(),
          invoiceService.getAll(),
          paymentService.getAll(),
          refundService.getAll(),
          notificationService.getAll(),
          auditService.getAll(),
        ]);

        const customerList = Array.isArray(custs) ? custs : [];
        const planList = Array.isArray(plans) ? plans : [];
        const subList = Array.isArray(subs) ? subs : [];
        const invList = Array.isArray(invs) ? invs : [];
        const paymentList = Array.isArray(payments) ? payments : [];
        const refundList = Array.isArray(refunds) ? refunds : [];
        const notifList = Array.isArray(notifs) ? notifs : [];
        const logList = Array.isArray(logs) ? logs : [];

        const settledVolume = paymentList
          .filter((p) => String(p.payment_status).toUpperCase() === 'SUCCESS')
          .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        setMetrics({
          totalCustomers: customerList.length,
          totalPlans: planList.length,
          activeSubscriptions: subList.filter((s) => String(s.status).toLowerCase() === 'active' || String(s.status).toLowerCase() === 'trial').length,
          totalInvoices: invList.length,
          pendingInvoices: invList.filter((i) => String(i.status).toLowerCase() === 'pending').length,
          paidInvoices: invList.filter((i) => String(i.status).toLowerCase() === 'paid').length,
          failedPayments: paymentList.filter((p) => String(p.payment_status).toLowerCase() === 'failed').length,
          refundCount: refundList.length,
          totalSettledVolume: settledVolume,
        });

        setNotifications(notifList.slice(0, 5));
        setAuditLogs(logList.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard metrics from backend:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const cardConfig = [
    { title: 'Total Customers', value: metrics.totalCustomers, icon: PeopleIcon, link: '/customers' },
    { title: 'Plans Available', value: metrics.totalPlans, icon: LoyaltyIcon, link: '/plans' },
    { title: 'Active Subscriptions', value: metrics.activeSubscriptions, icon: AutorenewIcon, link: '/subscriptions' },
    { title: 'Total Settled Volume', value: `₹${(metrics.totalSettledVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: CheckCircleIcon, link: '/payments' },
    { title: 'Total Invoices', value: metrics.totalInvoices, icon: ReceiptIcon, link: '/invoices' },
    { title: 'Pending Invoices', value: metrics.pendingInvoices, icon: PendingActionsIcon, link: '/invoices' },
    { title: 'Paid Invoices', value: metrics.paidInvoices, icon: CheckCircleIcon, link: '/invoices' },
    { title: 'Refund Count', value: metrics.refundCount, icon: MoneyOffIcon, link: '/refunds' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#0F172A">
          Dashboard
        </Typography>
      </Box>

      {loading ? (
        <MetricCardsSkeleton count={4} />
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {cardConfig.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  onClick={() => navigate(card.link)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px -5px rgba(245, 158, 11, 0.25)',
                      borderColor: '#F59E0B',
                    },
                  }}
                >
                  <CardContent sx={{ p: '16px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="caption" fontWeight={700} color="#4B5563" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {card.title}
                      </Typography>
                      <Avatar sx={{ bgcolor: '#FEF3C7', color: '#F59E0B', width: 38, height: 38 }}>
                        <Icon fontSize="small" />
                      </Avatar>
                    </Box>
                    <Typography variant="h3" fontWeight={900} color="#111827">
                      {card.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Latest Notifications Stream */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon sx={{ color: '#F59E0B' }} />
                <Typography variant="h6" fontWeight={800} color="#111827">
                  Latest System Notifications
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/notifications')}
                sx={{ textTransform: 'none', color: '#F59E0B' }}
              >
                View All
              </Button>
            </Box>
            {notifications.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <EmptyState title="No notifications available." description="There are currently no notification records available." />
              </Box>
            ) : (
              <List disablePadding>
                {notifications.map((notif, index) => (
                  <React.Fragment key={notif.id}>
                    <ListItem sx={{ py: 2, px: 2.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {notif.notification_type === 'payment_success' ? (
                          <CheckCircleIcon sx={{ color: '#10B981' }} />
                        ) : notif.notification_type === 'payment_failed' ? (
                          <ErrorOutlineIcon sx={{ color: '#EF4444' }} />
                        ) : (
                          <NotificationsIcon sx={{ color: '#F59E0B' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight={700} color="#111827">
                            {notif.notification_type || 'Notification'}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="#4B5563" sx={{ fontSize: '0.825rem' }}>
                              {notif.message}
                            </Typography>
                            <Typography variant="caption" color="#9CA3AF" display="block" sx={{ mt: 0.5 }}>
                              {formatDateTime(notif.sent_date)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider component="li" sx={{ borderColor: '#F3F4F6' }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Card>
        </Grid>

        {/* Recent Audit Logs Stream */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon sx={{ color: '#F59E0B' }} />
                <Typography variant="h6" fontWeight={800} color="#111827">
                  Recent Billing Audit Logs
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/audit-logs')}
                sx={{ textTransform: 'none', color: '#F59E0B' }}
              >
                View All
              </Button>
            </Box>
            {auditLogs.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <EmptyState title="No audit logs found." description="There are currently no audit log records available." />
              </Box>
            ) : (
              <List disablePadding>
                {auditLogs.map((log, index) => (
                  <React.Fragment key={log.id}>
                    <ListItem sx={{ py: 2, px: 2.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Chip label={log.event} size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 700, fontSize: '0.7rem' }} />
                            <Typography variant="caption" color="#9CA3AF">
                              {formatDateTime(log.created_at)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="#111827" fontWeight={600}>
                              {log.description}
                            </Typography>
                            <Typography variant="caption" color="#9CA3AF">
                              Performed By: {log.performed_by}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < auditLogs.length - 1 && <Divider component="li" sx={{ borderColor: '#F3F4F6' }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
