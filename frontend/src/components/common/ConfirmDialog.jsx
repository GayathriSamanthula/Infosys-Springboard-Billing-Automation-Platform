import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Confirm Action', content, confirmText = 'Confirm', confirmColor = 'error', loading = false }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: `${confirmColor}.main` }}>
        <WarningAmberIcon fontSize="large" color={confirmColor} />
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <Typography variant="body1" color="text.secondary">
          {content}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, backgroundColor: '#f8fafc' }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color={confirmColor} disabled={loading}>
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
