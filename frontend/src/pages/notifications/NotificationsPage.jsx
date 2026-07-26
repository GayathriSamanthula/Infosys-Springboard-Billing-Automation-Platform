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

const NotificationsPage = () => {
  const { showNotification } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      showNotification('Failed to fetch notifications from backend API', 'error');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
          <Typography variant="h4" fontWeight={900} color="#F9FAFB" gutterBottom>
            System Event Notifications
          </Typography>
          <Typography variant="body2" color="#F59E0B" fontWeight={600}>
            Dynamically fetched from FastAPI backend (`GET /notifications`)
          </Typography>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <EmptyState
              title="No notifications available."
              description="There are currently no notification records in your FastAPI backend database."
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
                    bgcolor: item.is_read ? '#ffffff' : '#FEF3C7',
                    transition: 'background-color 0.2s',
                  }}
                  secondaryAction={
                    !item.is_read && (
                      <Tooltip title="Mark as read">
                        <IconButton onClick={() => handleMarkAsRead(item.id)} sx={{ color: '#F59E0B' }}>
                          <DoneAllIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: 46 }}>
                    {item.notification_type === 'payment_success' ? (
                      <CheckCircleIcon sx={{ color: '#10B981' }} fontSize="large" />
                    ) : item.notification_type === 'payment_failed' ? (
                      <ErrorOutlineIcon sx={{ color: '#EF4444' }} fontSize="large" />
                    ) : (
                      <NotificationsIcon sx={{ color: '#F59E0B' }} fontSize="large" />
                    )}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#111827">
                          {item.notification_type || 'Notification'}
                        </Typography>
                        {!item.is_read && <Chip label="New" size="small" sx={{ bgcolor: '#F59E0B', color: '#FFFFFF', fontWeight: 700, fontSize: '0.65rem' }} />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="#4B5563" sx={{ mb: 0.5 }}>
                          {item.message}
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
