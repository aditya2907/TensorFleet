import React, { useState, useEffect } from 'react';
import { monitoringAPI } from '../api/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge
} from '@mui/material';
import {
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Memory as MemoryIcon,
  Psychology as CpuIcon,
  AccessTime as AccessTimeIcon,
  Task as TaskIcon,
  Circle as CircleIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

const WorkerVisualization = () => {
  const [workers, setWorkers] = useState([]);
  const [workerStats, setWorkerStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchWorkerActivity();
    const interval = setInterval(() => {
      fetchWorkerActivity();
      setLastUpdate(new Date());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkerActivity = async () => {
    try {
      const response = await monitoringAPI.getWorkerActivity();
      const workersData = response.data.workers || [];
      setWorkers(workersData);
      
      // Calculate average resource usage
      const activeWorkers = workersData.filter(w => w.is_active);
      const avgCpu = activeWorkers.length > 0 
        ? Math.round(activeWorkers.reduce((sum, w) => sum + (w.cpu_usage || 0), 0) / activeWorkers.length)
        : 0;
      const avgMemory = activeWorkers.length > 0
        ? Math.round(activeWorkers.reduce((sum, w) => sum + (w.memory_usage || 0), 0) / activeWorkers.length)
        : 0;
      
      setWorkerStats({
        total: response.data.total_workers || workersData.length,
        active: response.data.active_workers || workersData.filter(w => w.is_active).length,
        busy: response.data.busy_workers || workersData.filter(w => w.status === 'BUSY').length,
        idle: workersData.filter(w => w.status === 'IDLE').length,
        offline: workersData.filter(w => w.status === 'OFFLINE').length,
        avgCpu,
        avgMemory
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch worker activity:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BUSY':
        return 'success';
      case 'IDLE':
        return 'warning';
      case 'OFFLINE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status, isActive) => {
    if (!isActive) return <CircleIcon sx={{ color: 'error.main' }} />;
    
    switch (status) {
      case 'BUSY':
        return <CircleIcon sx={{ color: 'success.main', animation: 'pulse 2s infinite' }} />;
      case 'IDLE':
        return <CircleIcon sx={{ color: 'warning.main' }} />;
      default:
        return <ComputerIcon />;
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

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  const formatUptime = (seconds) => {
    if (!seconds || seconds < 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ComputerIcon sx={{ mr: 1 }} />
        Live Worker Activity Monitor
        <Chip 
          size="small" 
          label={`${workerStats.total || 0} Workers`} 
          color="primary" 
        />
        <Chip 
          size="small" 
          label="Live" 
          sx={{ bgcolor: 'success.main', color: 'white', animation: 'pulse 2s infinite' }}
        />
      </Typography>

      {/* Summary Stats Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={workerStats.total} color="primary">
                <ComputerIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Badge>
              <Typography variant="h6" sx={{ mt: 1 }}>Total</Typography>
              <Typography variant="caption" color="textSecondary">
                Workers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={workerStats.busy} color="success">
                <SpeedIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Badge>
              <Typography variant="h6" sx={{ mt: 1, color: 'success.main' }}>
                Busy
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Processing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={workerStats.idle} color="warning">
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Badge>
              <Typography variant="h6" sx={{ mt: 1, color: 'warning.main' }}>
                Idle
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CpuIcon sx={{ fontSize: 40, color: 'info.main' }} />
              <Typography variant="h6" sx={{ mt: 1, color: 'info.main' }}>
                {workerStats.avgCpu || 0}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Avg CPU
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MemoryIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
              <Typography variant="h6" sx={{ mt: 1, color: 'secondary.main' }}>
                {workerStats.avgMemory || 0}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Avg Memory
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {workers.map((worker, index) => (
          <Grid item xs={12} md={6} lg={4} key={worker.worker_id || index}>
            <Card sx={{ 
              border: worker.is_active ? '2px solid' : '1px solid',
              borderColor: worker.is_active ? 
                (worker.status === 'BUSY' ? 'success.main' : 'warning.main') : 
                'grey.300'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {getStatusIcon(worker.status, worker.is_active)}
                  <Typography variant="h6" sx={{ 
                    color: worker.is_active ? 'text.primary' : 'text.disabled',
                    flex: 1
                  }}>
                    {formatWorkerId(worker.worker_id, index)}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={worker.status} 
                    color={getStatusColor(worker.status)}
                  />
                </Box>

                <List dense>
                  {worker.current_task_id && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <TaskIcon fontSize="small" color="info" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Current Task" 
                        secondary={worker.current_task_id}
                        secondaryTypographyProps={{ 
                          sx: { wordBreak: 'break-all', fontSize: '0.75rem' } 
                        }}
                      />
                    </ListItem>
                  )}
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CheckCircleIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Tasks Completed" 
                      secondary={worker.tasks_completed || 0}
                    />
                  </ListItem>

                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <AccessTimeIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Uptime" 
                      secondary={formatUptime(worker.uptime)}
                    />
                  </ListItem>

                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CpuIcon fontSize="small" color="secondary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Resources" 
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" component="div">
                              CPU
                            </Typography>
                            <Typography 
                              variant="caption" 
                              component="div" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: (worker.cpu_usage || 0) > 80 ? 'error.main' : 
                                       (worker.cpu_usage || 0) > 60 ? 'warning.main' : 'success.main'
                              }}
                            >
                              {worker.cpu_usage || 0}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={worker.cpu_usage || 0} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3, 
                              mb: 1,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: (worker.cpu_usage || 0) > 80 ? 'error.main' : 
                                         (worker.cpu_usage || 0) > 60 ? 'warning.main' : 'success.main'
                              }
                            }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" component="div">
                              Memory
                            </Typography>
                            <Typography 
                              variant="caption" 
                              component="div" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: (worker.memory_usage || 0) > 80 ? 'error.main' : 
                                       (worker.memory_usage || 0) > 60 ? 'warning.main' : 'success.main'
                              }}
                            >
                              {worker.memory_usage || 0}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={worker.memory_usage || 0} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: (worker.memory_usage || 0) > 80 ? 'error.main' : 
                                         (worker.memory_usage || 0) > 60 ? 'warning.main' : 'success.main'
                              }
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                  Last Activity: {formatTimestamp(worker.last_activity_time)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {workers.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <ComputerIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No Workers Active
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Workers will appear here when they register with the system
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Status Footer */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircleIcon sx={{ fontSize: 8, color: 'success.main', animation: 'pulse 2s infinite' }} />
                <Typography variant="caption" color="textSecondary">
                  Real-time monitoring active
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="caption" color="textSecondary">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                Auto-refresh every 2 seconds
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkerVisualization;
