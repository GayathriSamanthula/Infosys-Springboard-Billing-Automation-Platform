import React from 'react';
import { Chip } from '@mui/material';
import { formatStatus } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const getStatusColor = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'active':
    case 'paid':
    case 'success':
    case 'processed':
      return { bg: '#ECFDF5', color: '#10B981', border: '#A7F3D0' };
    case 'trial':
    case 'pending':
      return { bg: '#FFF7ED', color: '#F97316', border: '#FFEDD5' };
    case 'past_due':
    case 'overdue':
    case 'warning':
      return { bg: '#FFF7ED', color: '#F97316', border: '#FFEDD5' };
    case 'cancelled':
    case 'failed':
      return { bg: '#FEF2F2', color: '#EF4444', border: '#FECACA' };
    case 'expired':
    case 'inactive':
    case 'archived':
    case 'paused':
    case 'refunded':
    default:
      return { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
  }
};

const StatusBadge = ({ status, size = 'small' }) => {
  const { t } = useTranslation();
  const styles = getStatusColor(status);
  const sKey = String(status || '').toLowerCase().replace('past_due', 'overdue');
  const translatedLabel = t(`status.${sKey}`, formatStatus(status));

  return (
    <Chip
      label={translatedLabel}
      size={size}
      sx={{
        backgroundColor: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        fontWeight: 600,
        textTransform: 'capitalize',
        px: 0.5,
      }}
    />
  );
};

export default StatusBadge;

