import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PeopleIcon from '@mui/icons-material/People';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700, color }}>
            {value !== null && value !== undefined ? value : '-'}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Icon sx={{ fontSize: 40, color, opacity: 0.8 }} />
      </Box>
    </CardContent>
  </Card>
);

const DashboardMetrics = ({ metrics }) => {
  if (!metrics) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card>
              <CardContent>
                <Typography color="textSecondary">Loading...</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'HEALTHY':
        return 'success.main';
      case 'DEGRADED':
        return 'warning.main';
      case 'DOWN':
        return 'error.main';
      default:
        return 'info.main';
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Jobs"
          value={metrics.total_jobs}
          icon={WorkIcon}
          color="primary.main"
          subtitle="All submitted jobs"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Jobs"
          value={metrics.active_jobs}
          icon={PlayCircleOutlineIcon}
          color="success.main"
          subtitle="Currently running"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Workers"
          value={metrics.active_workers}
          icon={PeopleIcon}
          color="info.main"
          subtitle="Processing tasks"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  System Status
                </Typography>
                <Chip
                  label={metrics.system_status || 'UNKNOWN'}
                  color={
                    metrics.system_status === 'HEALTHY' ? 'success' :
                    metrics.system_status === 'DEGRADED' ? 'warning' : 'error'
                  }
                  sx={{ mt: 1, fontWeight: 600 }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                  All systems operational
                </Typography>
              </Box>
              <HealthAndSafetyIcon 
                sx={{ 
                  fontSize: 40, 
                  color: getStatusColor(metrics.system_status),
                  opacity: 0.8 
                }} 
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardMetrics;
