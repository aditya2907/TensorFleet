import React, { useState, useEffect } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, Chip, 
  List, ListItem, ListItemText, LinearProgress,
  Divider, Avatar, Stack, Tooltip, Paper
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PeopleIcon from '@mui/icons-material/People';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import StorageIcon from '@mui/icons-material/Storage';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CircleIcon from '@mui/icons-material/Circle';
import { monitoringAPI, storageAPI } from '../api/api';

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
  const [workerActivity, setWorkerActivity] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch real-time worker activity
  const fetchWorkerActivity = async () => {
    try {
      const response = await monitoringAPI.getWorkerActivity();
      setWorkerActivity(response.data.workers || []);
    } catch (error) {
      console.error('Error fetching worker activity:', error);
    }
  };

  // Fetch storage statistics
  const fetchStorageStats = async () => {
    try {
      const response = await storageAPI.getStorageStats();
      setStorageStats(response.data);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    }
  };

  // Fetch recent jobs
  const fetchRecentJobs = async () => {
    try {
      const response = await storageAPI.getRecentJobs();
      setRecentJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchWorkerActivity();
    fetchStorageStats();
    fetchRecentJobs();
    
    const interval = setInterval(() => {
      fetchWorkerActivity();
      fetchStorageStats();
      setLastUpdate(new Date());
    }, 3000); // Update every 3 seconds

    const jobsInterval = setInterval(fetchRecentJobs, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(jobsInterval);
    };
  }, []);

  if (!metrics) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircleIcon sx={{ color: 'grey.300', animation: 'pulse 2s infinite' }} />
                  <Typography color="textSecondary">Loading real-time data...</Typography>
                </Box>
                <LinearProgress sx={{ mt: 2 }} />
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
      {/* Top Row - Main Metrics */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Jobs"
          value={metrics.total_jobs}
          icon={WorkIcon}
          color="primary.main"
          subtitle={`Last updated: ${lastUpdate.toLocaleTimeString()}`}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Jobs"
          value={metrics.active_jobs}
          icon={PlayCircleOutlineIcon}
          color="success.main"
          subtitle={metrics.active_jobs > 0 ? "Currently processing" : "All jobs complete"}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Workers"
          value={metrics.active_workers}
          icon={PeopleIcon}
          color="info.main"
          subtitle={`${workerActivity.filter(w => w.status === 'BUSY').length} busy, ${workerActivity.filter(w => w.status === 'IDLE').length} idle`}
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
                  {metrics.active_workers > 0 ? `${metrics.active_workers} workers online` : 'No workers active'}
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

      {/* Second Row - Storage & Performance Metrics */}
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Storage Overview
              </Typography>
              <StorageIcon sx={{ fontSize: 30, color: 'secondary.main', opacity: 0.8 }} />
            </Box>
            {storageStats ? (
              <Box>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <Box>
                    <Typography variant="h6" color="secondary.main">
                      {storageStats.total_buckets || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Buckets</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="secondary.main">
                      {storageStats.total_objects || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Objects</Typography>
                  </Box>
                </Stack>
                <Typography variant="caption" color="textSecondary">
                  Size: {storageStats.total_size_mb ? `${storageStats.total_size_mb}MB` : 'N/A'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">Loading...</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Training Metrics
              </Typography>
              <ModelTrainingIcon sx={{ fontSize: 30, color: 'warning.main', opacity: 0.8 }} />
            </Box>
            <Stack direction="row" spacing={2}>
              <Box>
                <Typography variant="h6" color="warning.main">
                  {metrics.avg_accuracy ? (metrics.avg_accuracy * 100).toFixed(1) + '%' : 'N/A'}
                </Typography>
                <Typography variant="caption" color="textSecondary">Avg Accuracy</Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="warning.main">
                  {metrics.avg_loss ? metrics.avg_loss.toFixed(3) : 'N/A'}
                </Typography>
                <Typography variant="caption" color="textSecondary">Avg Loss</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Performance
              </Typography>
              <SpeedIcon sx={{ fontSize: 30, color: 'success.main', opacity: 0.8 }} />
            </Box>
            <Box>
              <Typography variant="h6" color="success.main">
                {metrics.total_jobs > 0 ? 
                  `${((metrics.total_jobs - metrics.active_jobs) / metrics.total_jobs * 100).toFixed(1)}%` : 
                  '0%'
                }
              </Typography>
              <Typography variant="caption" color="textSecondary">Completion Rate</Typography>
              <LinearProgress 
                variant="determinate" 
                value={metrics.total_jobs > 0 ? (metrics.total_jobs - metrics.active_jobs) / metrics.total_jobs * 100 : 0}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Third Row - Live Activity */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="primary" />
              Live Worker Activity
              <Chip size="small" label={`${workerActivity.length} workers`} color="primary" />
            </Typography>
            <List dense>
              {workerActivity.slice(0, 5).map((worker, index) => (
                <ListItem key={worker.worker_id || index} sx={{ px: 0 }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 2, bgcolor: worker.status === 'BUSY' ? 'success.main' : 'grey.400' }}>
                    <CircleIcon sx={{ fontSize: 12 }} />
                  </Avatar>
                  <ListItemText
                    primary={worker.worker_id || `Worker ${index + 1}`}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          size="small" 
                          label={worker.status || 'UNKNOWN'} 
                          color={worker.status === 'BUSY' ? 'success' : 'default'}
                        />
                        {worker.current_task_id && (
                          <Typography variant="caption">Task: {worker.current_task_id}</Typography>
                        )}
                        <Typography variant="caption" color="textSecondary">
                          {worker.tasks_completed || 0} completed
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {workerActivity.length === 0 && (
                <ListItem>
                  <ListItemText primary="No active workers" secondary="Waiting for worker registration..." />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="secondary" />
              Recent Job Activity
              <Chip size="small" label="Live" color="secondary" />
            </Typography>
            <List dense>
              {recentJobs.slice(0, 5).map((job, index) => (
                <ListItem key={job.job_id || index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={job.job_name || job.job_id || `Job ${index + 1}`}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip 
                          size="small" 
                          label={job.status || 'UNKNOWN'} 
                          color={
                            job.status === 'RUNNING' ? 'info' :
                            job.status === 'COMPLETED' ? 'success' :
                            job.status === 'FAILED' ? 'error' : 'default'
                          }
                        />
                        <Typography variant="caption" color="textSecondary">
                          {job.model_type || 'Unknown type'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {job.created_at ? new Date(job.created_at).toLocaleTimeString() : ''}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {recentJobs.length === 0 && (
                <ListItem>
                  <ListItemText primary="No recent jobs" secondary="Submit a job to see activity here" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Status Footer */}
      <Grid item xs={12}>
        <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircleIcon sx={{ fontSize: 8, color: 'success.main', animation: 'pulse 2s infinite' }} />
            Live Dashboard - Last updated: {lastUpdate.toLocaleString()}
            <Divider orientation="vertical" flexItem />
            Auto-refresh every 3 seconds
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DashboardMetrics;
