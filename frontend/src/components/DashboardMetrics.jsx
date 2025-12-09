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
import { monitoringAPI, storageAPI, jobsAPI } from '../api/api';

const MetricCard = ({ title, value, icon: Icon, color, subtitle, gradientFrom, gradientTo }) => (
  <Card sx={{ 
    background: `linear-gradient(135deg, ${gradientFrom || color}15 0%, ${gradientTo || color}25 100%)`,
    border: `1px solid ${color}30`,
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: `linear-gradient(90deg, ${gradientFrom || color}, ${gradientTo || color})`,
    }
  }}>
    <CardContent sx={{ position: 'relative', pb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography 
            color="text.secondary" 
            gutterBottom 
            variant="body2"
            sx={{ 
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.75rem'
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h3" 
            component="div" 
            sx={{ 
              fontWeight: 800, 
              background: `linear-gradient(135deg, ${gradientFrom || color}, ${gradientTo || color})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            {value !== null && value !== undefined ? value : '-'}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                opacity: 0.8
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ 
          background: `linear-gradient(135deg, ${gradientFrom || color}20, ${gradientTo || color}30)`,
          borderRadius: '16px',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon sx={{ fontSize: 32, color: gradientFrom || color }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardMetrics = ({ metrics }) => {
  const [workerActivity, setWorkerActivity] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    totalJobs: 0,
    activeJobs: 0,
    activeWorkers: 0,
    totalWorkers: 0
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch real-time worker activity
  const fetchWorkerActivity = async () => {
    try {
      const response = await monitoringAPI.getWorkerActivity();
      const workers = response.data.workers || [];
      setWorkerActivity(workers);
      
      // Update real-time worker metrics
      const activeWorkers = workers.filter(w => 
        w.status === 'BUSY' || w.status === 'IDLE'
      ).length;
      
      setRealTimeMetrics(prev => ({
        ...prev,
        activeWorkers,
        totalWorkers: workers.length
      }));
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

  // Fetch recent jobs and update metrics
  const fetchRecentJobs = async () => {
    try {
      // Try multiple endpoints for job data
      let jobs = [];
      
      try {
        // First try API Gateway jobs endpoint
        const response = await jobsAPI.listJobs();
        jobs = response.data.jobs || [];
        console.log('✅ Fetched jobs from API Gateway:', jobs.length, 'jobs');
      } catch (apiError) {
        console.warn('⚠️ Jobs API not available, trying storage API:', apiError);
        try {
          const storageResponse = await storageAPI.getRecentJobs(50); // Request up to 50 jobs
          jobs = storageResponse.data.jobs || [];
          console.log('✅ Fetched jobs from Storage API:', jobs.length, 'jobs');
        } catch (storageError) {
          console.error('❌ Both job APIs failed, trying monitoring API as fallback:', storageError);
          try {
            const monitoringResponse = await monitoringAPI.getDashboard();
            const totalJobsFromMonitoring = monitoringResponse.data.total_jobs || 0;
            console.log('✅ Fetched job count from Monitoring API:', totalJobsFromMonitoring);
            
            // Update metrics directly if we only have the count
            setRealTimeMetrics(prev => ({
              ...prev,
              totalJobs: totalJobsFromMonitoring,
              activeJobs: monitoringResponse.data.active_jobs || prev.activeJobs
            }));
            return; // Exit early since we updated metrics directly
          } catch (monitoringError) {
            console.error('❌ All APIs failed:', monitoringError);
          }
        }
      }
      
      setRecentJobs(jobs);
      
      // Update real-time job metrics
      const activeJobs = jobs.filter(job => 
        job.status === 'RUNNING' || job.status === 'PENDING'
      ).length;
      
      console.log('📊 Setting metrics - Total Jobs:', jobs.length, 'Active Jobs:', activeJobs);
      
      setRealTimeMetrics(prev => ({
        ...prev,
        totalJobs: jobs.length,
        activeJobs
      }));
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    // Initial fetch
    fetchWorkerActivity();
    fetchStorageStats();
    fetchRecentJobs();
    
    // Real-time updates every 2 seconds for critical metrics
    const criticalInterval = setInterval(() => {
      fetchWorkerActivity();
      fetchRecentJobs();
      setLastUpdate(new Date());
    }, 2000);

    // Less frequent updates for storage stats
    const storageInterval = setInterval(() => {
      fetchStorageStats();
    }, 10000);

    return () => {
      clearInterval(criticalInterval);
      clearInterval(storageInterval);
    };
  }, []);

  // Always show real-time dashboard, even if metrics prop is null
  const isInitialLoading = realTimeMetrics.totalJobs === 0 && 
                          realTimeMetrics.activeWorkers === 0 && 
                          workerActivity.length === 0;

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

  const formatWorkerId = (workerId, index) => {
    // Convert hex UUID to user-friendly name like worker-1, worker-2, etc.
    if (!workerId) return `Worker ${index + 1}`;
    
    // If it's already in a friendly format, return as-is
    if (workerId.startsWith('worker-') && !workerId.includes('-') !== 4) {
      return workerId;
    }
    
    // Create a consistent hash from the worker ID to ensure same worker gets same number
    let hash = 0;
    for (let i = 0; i < workerId.length; i++) {
      const char = workerId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use absolute value and mod to get a consistent worker number
    const workerNumber = Math.abs(hash % 100) + 1; // 1-100 range
    return `worker-${workerNumber}`;
  };

  return (
    <Box>
      {/* Dashboard Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          TensorFleet Dashboard
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            fontWeight: 400,
            opacity: 0.8
          }}
        >
          Real-time monitoring and analytics for distributed machine learning
        </Typography>
      </Box>

      {/* Real-time Status Indicator */}
      <Card sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
      }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: isInitialLoading ? 
                    'linear-gradient(45deg, #f59e0b, #fbbf24)' : 
                    'linear-gradient(45deg, #10b981, #34d399)',
                  animation: 'pulse 2s infinite',
                  boxShadow: isInitialLoading ? 
                    '0 0 8px rgba(245, 158, 11, 0.4)' : 
                    '0 0 8px rgba(16, 185, 129, 0.4)',
                }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {isInitialLoading ? 'Connecting to TensorFleet...' : 'Live Dashboard'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {realTimeMetrics.totalJobs}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Jobs
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {realTimeMetrics.activeJobs}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Active Jobs
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {realTimeMetrics.activeWorkers}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Active Workers
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        {/* Top Row - Main Metrics */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Jobs"
          value={realTimeMetrics.totalJobs}
          icon={WorkIcon}
          gradientFrom="#667eea"
          gradientTo="#764ba2"
          subtitle={`Last updated: ${lastUpdate.toLocaleTimeString()}`}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Jobs"
          value={realTimeMetrics.activeJobs}
          icon={PlayCircleOutlineIcon}
          gradientFrom="#10b981"
          gradientTo="#34d399"
          subtitle={realTimeMetrics.activeJobs > 0 ? "Currently processing" : "All jobs complete"}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Workers"
          value={realTimeMetrics.activeWorkers}
          icon={PeopleIcon}
          gradientFrom="#3b82f6"
          gradientTo="#60a5fa"
          subtitle={`${workerActivity.filter(w => w.status === 'BUSY').length} busy, ${workerActivity.filter(w => w.status === 'IDLE').length} idle`}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="System Status"
          value={
            realTimeMetrics.activeWorkers > 0 ? 'HEALTHY' :
            realTimeMetrics.totalJobs > 0 && realTimeMetrics.activeWorkers === 0 ? 'DEGRADED' :
            'IDLE'
          }
          icon={HealthAndSafetyIcon}
          gradientFrom={
            realTimeMetrics.activeWorkers > 0 ? '#10b981' :
            realTimeMetrics.totalJobs > 0 && realTimeMetrics.activeWorkers === 0 ? '#f59e0b' :
            '#64748b'
          }
          gradientTo={
            realTimeMetrics.activeWorkers > 0 ? '#34d399' :
            realTimeMetrics.totalJobs > 0 && realTimeMetrics.activeWorkers === 0 ? '#fbbf24' :
            '#94a3b8'
          }
          subtitle={realTimeMetrics.activeWorkers > 0 ? 
            `${realTimeMetrics.activeWorkers} workers online` : 
            'No workers active'}
        />
      </Grid>

      {/* Second Row - Storage & Performance Metrics */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Storage Overview"
          value={storageStats ? `${storageStats.total_buckets || 0}` : '-'}
          icon={StorageIcon}
          gradientFrom="#f093fb"
          gradientTo="#f5b7ff"
          subtitle={storageStats ? 
            `${storageStats.total_objects || 0} objects, ${storageStats.total_size_mb ? `${storageStats.total_size_mb}MB` : 'N/A'}` : 
            'Loading storage stats...'}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Auto-Saved Models"
          value={recentJobs.filter(job => job.status === 'COMPLETED').length}
          icon={ModelTrainingIcon}
          gradientFrom="#8b5cf6"
          gradientTo="#a855f7"
          subtitle="Models automatically saved on completion"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Completion Rate"
          value={realTimeMetrics.totalJobs > 0 ? 
            `${((realTimeMetrics.totalJobs - realTimeMetrics.activeJobs) / realTimeMetrics.totalJobs * 100).toFixed(1)}%` : 
            '0%'}
          icon={SpeedIcon}
          gradientFrom="#10b981"
          gradientTo="#34d399"
          subtitle={`${realTimeMetrics.totalJobs - realTimeMetrics.activeJobs} of ${realTimeMetrics.totalJobs} completed`}
        />
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
                    primary={formatWorkerId(worker.worker_id, index)}
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
    </Box>
  );
};

export default DashboardMetrics;
