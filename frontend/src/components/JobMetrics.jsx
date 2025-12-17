import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

const JobMetrics = ({ metrics }) => {
  if (!metrics) {
    return <Typography color="textSecondary">No metrics available.</Typography>;
  }

  const metricItems = Object.entries(metrics).map(([key, value]) => (
    <Grid item xs={6} sm={4} key={key}>
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase' }}>
          {key.replace(/_/g, ' ')}
        </Typography>
        <Typography variant="h6">
          {typeof value === 'number' ? value.toFixed(4) : value}
        </Typography>
      </Paper>
    </Grid>
  ));

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Metrics
      </Typography>
      <Grid container spacing={2}>
        {metricItems}
      </Grid>
    </Box>
  );
};

export default JobMetrics;
