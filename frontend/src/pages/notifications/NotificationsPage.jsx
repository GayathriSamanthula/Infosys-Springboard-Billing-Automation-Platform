import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import EmptyState from '../../components/common/EmptyState';
import { notificationService } from '../../services/notificationService';
import { useNotification } from '../../hooks/useNotification';
import { formatDateTime } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const formatTranslatedMessage = (item, t) => {
  if (!item || !item.message) return '';
  const msg = item.message;

  // 1. Retry Attempt Succeeded pattern
  if (msg.includes('Retry Attempt #') && msg.includes('succeeded')) {
    const match = msg.match(/Retry Attempt #(\d+) for Invoice (#[\w-]+) succeeded\./i);
    if (match) {
      return t('admin.notifications.messages.retry_success', {
        defaultValue: msg,
        attempt: match[1],
        invoice: match[2],
      });
    }
  }

  // 2. Test payment receipt pattern
  if (msg.includes('Test payment receipt for')) {
    const match = msg.match(/Test payment receipt for (.*)/i);
    if (match) {
      return t('admin.notifications.messages.payment_receipt_test', {
        defaultValue: msg,
        name: match[1],
      });
    }
  }

  // 3. Payment of $X for Invoice #Y was successful
  if (msg.includes('Payment of') && msg.includes('was successful')) {
    const match = msg.match(/Payment of ([\$\₹]?[\d\.,]+) for Invoice (#[\w-]+) was successful\./i);
    if (match) {
      return t('admin.notifications.messages.payment_invoice_success', {
        defaultValue: msg,
        amount: match[1],
        invoice: match[2],
      });
    }
  }

  // 4. Subscription renewed successfully
  if (msg.includes('renewed successfully')) {
    const match = msg.match(/Subscription (\d+) renewed successfully\./i);
    if (match) {
      return t('admin.notifications.messages.sub_renewed', {
        defaultValue: msg,
        sub_id: match[1],
      });
    }
  }

  // 5. Account / Subscription activated messages
  if (msg.includes('subscription has been activated')) {
    if (msg.includes('successfully')) {
      return t('admin.notifications.messages.sub_activated_full', { defaultValue: msg });
    }
    return t('admin.notifications.messages.sub_activated_short', { defaultValue: msg });
  }

  // 6. Velora merchant subscription activated
  if (msg.includes('Velora Merchant subscription for')) {
    const match = msg.match(/Velora Merchant subscription for (.*) has been activated/i);
    if (match) {
      return t('admin.notifications.messages.velora_sub_activated', {
        defaultValue: msg,
        plan: match[1],
      });
    }
  }

  // 7. Refund success message
  if (msg.includes('Refund of') && msg.includes('was successfully processed')) {
    const amountMatch = msg.match(/Refund of ([\$\₹]?[\d\.,]+)/i);
    const invoiceMatch = msg.match(/Invoice (#[\w-]+)/i);
    return t('admin.notifications.messages.refund_success', {
      defaultValue: msg,
      amount: amountMatch ? amountMatch[1] : '',
      invoice: invoiceMatch ? invoiceMatch[1] : '',
    });
  }

  // 8. Payment attempt failed message
  if (msg.includes('Payment attempt failed')) {
    return t('admin.notifications.messages.payment_failed', {
      defaultValue: 'Payment attempt failed for your subscription.',
    });
  }

  // 9. Generic payment success message
  if (msg.includes('Payment was successfully processed') || msg.includes('Payment successful')) {
    return t('admin.notifications.messages.payment_success', {
      defaultValue: 'Payment was successfully processed.',
    });
  }

  return msg;
};

const NotificationsPage = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      showNotification('Failed to fetch notifications from backend API', 'error');
      setNotifications([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(false);

    const handleRefresh = () => {
      fetchNotifications(true);
    };

    window.addEventListener('dashboard_refresh', handleRefresh);
    window.addEventListener('notifications_refresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboard_refresh', handleRefresh);
      window.removeEventListener('notifications_refresh', handleRefresh);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      showNotification('Marked as read in database', 'info');
      fetchNotifications();
    } catch {
      showNotification('Failed to update notification', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a" gutterBottom>
            {t('nav.notifications', 'System Event Notifications')}
          </Typography>
          <Typography variant="body2" color="#0284c7" fontWeight={600}>
            {t('admin.notifications.subtitle', 'Real-time billing alerts, system updates, and automated event notifications')}
          </Typography>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <EmptyState
              title={t('admin.notifications.empty_title', 'No notifications available.')}
              description={t('admin.notifications.empty_desc', 'There are currently no notification records in your database.')}
            />
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  sx={{
                    py: 2.5,
                    px: 3,
                    bgcolor: item.is_read ? '#ffffff' : '#e0f2fe',
                    transition: 'background-color 0.2s',
                  }}
                  secondaryAction={
                    !item.is_read && (
                      <Tooltip title={t('admin.notifications.mark_as_read', 'Mark as read')}>
                        <IconButton onClick={() => handleMarkAsRead(item.id)} sx={{ color: '#0284c7' }}>
                          <DoneAllIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: 46 }}>
                    {String(item.notification_type || '').toLowerCase().includes('success') || String(item.notification_type || '').toLowerCase().includes('paid') ? (
                      <CheckCircleIcon sx={{ color: '#10B981' }} fontSize="large" />
                    ) : String(item.notification_type || '').toLowerCase().includes('failed') ? (
                      <ErrorOutlineIcon sx={{ color: '#EF4444' }} fontSize="large" />
                    ) : (
                      <NotificationsIcon sx={{ color: '#0284c7' }} fontSize="large" />
                    )}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#111827">
                          {t(`admin.notifications.types.${item.notification_type}`, item.notification_type || 'Notification')}
                        </Typography>
                        {!item.is_read && (
                          <Chip
                            label={t('admin.notifications.chip_new', 'New')}
                            size="small"
                            sx={{ bgcolor: '#0284c7', color: '#FFFFFF', fontWeight: 700, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="#4B5563" sx={{ mb: 0.5 }}>
                          {formatTranslatedMessage(item, t)}
                        </Typography>
                        <Typography variant="caption" color="#9CA3AF">
                          {formatDateTime(item.sent_date)}
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
    </Box>
  );
};

export default NotificationsPage;
