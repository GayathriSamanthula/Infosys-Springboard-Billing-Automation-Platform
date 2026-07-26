import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const CustomModal = ({ open, onClose, title, children, actions, maxWidth = 'sm', fullWidth = true }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth} PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700} color="text.primary">
          {title}
        </Typography>
        <IconButton aria-label="close" onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500] }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        {children}
      </DialogContent>
      {actions && <DialogActions sx={{ p: 2, px: 3, backgroundColor: '#f8fafc' }}>{actions}</DialogActions>}
    </Dialog>
  );
};

export default CustomModal;
