import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';

const JobMetrics = ({ metrics }) => {
  if (!metrics) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <QueryStatsRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No metrics available.
        </Typography>
      </Box>
    );
  }

  const metricItems = Object.entries(metrics).map(([key, value]) => (
    <Grid item xs={6} sm={4} key={key}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {key.replace(/_/g, ' ')}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.15, wordBreak: 'break-word' }}>
            {typeof value === 'number' ? value.toFixed(4) : value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  ));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <QueryStatsRoundedIcon fontSize="small" color="primary" />
        <Typography variant="h6">Metrics</Typography>
      </Box>
      <Grid container spacing={2.5}>
        {metricItems}
      </Grid>
    </Box>
  );
};

export default JobMetrics;
