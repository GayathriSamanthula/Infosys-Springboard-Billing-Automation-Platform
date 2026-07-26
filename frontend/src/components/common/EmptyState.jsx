import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

const EmptyState = ({
  title = 'No Records Found',
  description = 'There are no items matching your criteria or no data available yet.',
  actionLabel,
  onAction,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 2,
        border: '1px dashed #cbd5e1',
        my: 2,
      }}
    >
      <InboxIcon sx={{ fontSize: 54, color: '#94a3b8', mb: 1.5 }} />
      <Typography variant="h6" color="text.primary" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: actionLabel ? 3 : 0 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
