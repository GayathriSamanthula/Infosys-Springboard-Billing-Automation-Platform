import React from 'react';
import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material';

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <Skeleton variant="rectangular" height={45} sx={{ mb: 1, borderRadius: 1 }} />
      {Array.from(new Array(rows)).map((_, rIdx) => (
        <Grid container spacing={2} key={rIdx} sx={{ py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
          {Array.from(new Array(columns)).map((_, cIdx) => (
            <Grid item xs={12 / columns} key={cIdx}>
              <Skeleton variant="text" height={24} />
            </Grid>
          ))}
        </Grid>
      ))}
    </Box>
  );
};

export const MetricCardsSkeleton = ({ count = 4 }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {Array.from(new Array(count)).map((_, idx) => (
        <Grid item xs={12} sm={6} md={12 / count} key={idx}>
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="rectangular" width="40%" height={36} sx={{ my: 1, borderRadius: 1 }} />
              <Skeleton variant="text" width="80%" height={18} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
