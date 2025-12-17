import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Skeleton,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { monitoringAPI } from '../api/api';

const WorkerScalingControl = () => {
  const [workerCount, setWorkerCount] = useState(3);
  const [targetWorkers, setTargetWorkers] = useState(3);
  const [autoShrinkEnabled, setAutoShrinkEnabled] = useState(true);
  const [scalingConfig, setScalingConfig] = useState({
    min_workers: 1,
    max_workers: 10,
    current_workers: 3,
    desired_workers: 3,
    auto_scale_enabled: true,
    scale_down_threshold: 0.3,
    scale_up_threshold: 0.8
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isScaling, setIsScaling] = useState(false);
  const [actualWorkerCount, setActualWorkerCount] = useState(0);

  useEffect(() => {
    fetchScalingConfig();
    fetchActualWorkerCount();
    const interval = setInterval(() => {
      fetchScalingConfig();
      fetchActualWorkerCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActualWorkerCount = async () => {
    try {
      const response = await monitoringAPI.getWorkerActivity();
      const workers = response.data.workers || [];
      setActualWorkerCount(workers.length);
    } catch (error) {
      console.error('Failed to fetch actual worker count:', error);
    }
  };

  const fetchScalingConfig = async () => {
    try {
      const response = await monitoringAPI.get('/api/v1/scaling/config');
      setScalingConfig(response.data);
      setWorkerCount(response.data.current_workers);
      setTargetWorkers(response.data.desired_workers);
      setAutoShrinkEnabled(response.data.auto_scale_enabled);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch scaling config:', error);
      setMessage({
        type: 'warning',
        text: 'Unable to connect to scaling service. Using default configuration.'
      });
      setLoading(false);
    }
  };

  const scaleWorkers = async (count) => {
    setIsScaling(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await monitoringAPI.post('/api/v1/scaling/workers', {
        worker_count: count
      });
      
      setMessage({
        type: 'success',
        text: response.data.message || `Successfully scaled workers to ${count}`
      });
      
      setWorkerCount(count);
      setTargetWorkers(count);
      
      // Refresh config after scaling
      setTimeout(fetchScalingConfig, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to scale workers';
      setMessage({
        type: 'error',
        text: errorMessage
      });
      
      // If Docker socket error, show helpful message
      if (errorMessage.includes('docker') || errorMessage.includes('socket')) {
        setMessage({
          type: 'info',
          text: '⚠️ Docker scaling requires additional configuration. Use manual scaling or deploy to Kubernetes for auto-scaling.'
        });
      }
    } finally {
      setIsScaling(false);
    }
  };

  const handleScaleUp = () => {
    const newCount = Math.min(workerCount + 1, scalingConfig.max_workers);
    scaleWorkers(newCount);
  };

  const handleScaleDown = () => {
    const newCount = Math.max(workerCount - 1, scalingConfig.min_workers);
    scaleWorkers(newCount);
  };

  const handleApplyTarget = () => {
    scaleWorkers(targetWorkers);
  };

  const toggleAutoShrink = async () => {
    try {
      const response = await monitoringAPI.post('/api/v1/scaling/auto-shrink', {
        enabled: !autoShrinkEnabled
      });
      
      setAutoShrinkEnabled(!autoShrinkEnabled);
      setMessage({
        type: 'success',
        text: `Auto-shrink ${!autoShrinkEnabled ? 'enabled' : 'disabled'}`
      });
      
      // Update config
      await monitoringAPI.post('/api/v1/scaling/config', {
        auto_scale_enabled: !autoShrinkEnabled
      });
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to toggle auto-shrink'
      });
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            <Typography variant="h6">
              Worker Scaling Control
            </Typography>
            {!loading && (
              <Chip 
                size="small" 
                label="Connected" 
                color="success" 
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          <IconButton onClick={fetchScalingConfig} size="small" disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Current Status */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Active Workers
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h3" color="primary.main">
                  {actualWorkerCount}
                </Typography>
                {actualWorkerCount !== workerCount && (
                  <Chip 
                    size="small" 
                    label={`Target: ${workerCount}`}
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip 
                  size="small" 
                  label={`Min: ${scalingConfig.min_workers}`} 
                  variant="outlined"
                />
                <Chip 
                  size="small" 
                  label={`Max: ${scalingConfig.max_workers}`} 
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Grid>

          {/* Auto-Shrink Status */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: autoShrinkEnabled ? 'success.50' : 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Auto-Scaling Status
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoShrinkEnabled}
                    onChange={toggleAutoShrink}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">
                      {autoShrinkEnabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {autoShrinkEnabled 
                        ? 'Workers auto-scale based on load' 
                        : 'Manual scaling only'}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Quick Scale Buttons */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Scale
          </Typography>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Scale down by 1">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<RemoveIcon />}
                  onClick={handleScaleDown}
                  disabled={isScaling || workerCount <= scalingConfig.min_workers}
                  color="warning"
                >
                  Scale Down
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Scale up by 1">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleScaleUp}
                  disabled={isScaling || workerCount >= scalingConfig.max_workers}
                  color="success"
                >
                  Scale Up
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Box>

        {/* Precise Worker Count */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Set Exact Worker Count
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={targetWorkers}
              onChange={(e, value) => setTargetWorkers(value)}
              min={scalingConfig.min_workers}
              max={scalingConfig.max_workers}
              marks
              step={1}
              valueLabelDisplay="on"
              disabled={isScaling}
            />
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              type="number"
              value={targetWorkers}
              onChange={(e) => {
                const value = Math.max(
                  scalingConfig.min_workers,
                  Math.min(scalingConfig.max_workers, parseInt(e.target.value) || scalingConfig.min_workers)
                );
                setTargetWorkers(value);
              }}
              inputProps={{
                min: scalingConfig.min_workers,
                max: scalingConfig.max_workers
              }}
              size="small"
              sx={{ width: 100 }}
              disabled={isScaling}
            />
            <Button
              variant="contained"
              onClick={handleApplyTarget}
              disabled={isScaling || targetWorkers === workerCount || loading}
              startIcon={isScaling ? <CircularProgress size={16} /> : <PlayIcon />}
            >
              {isScaling ? 'Scaling...' : 'Apply'}
            </Button>
          </Stack>
        </Box>

        {/* Scaling Thresholds (Info Only) */}
        {autoShrinkEnabled && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingDownIcon fontSize="small" />
              Auto-Scaling Thresholds
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Scale Down
                </Typography>
                <Typography variant="body2">
                  &lt; {(scalingConfig.scale_down_threshold * 100).toFixed(0)}% utilization
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Scale Up
                </Typography>
                <Typography variant="body2">
                  &gt; {(scalingConfig.scale_up_threshold * 100).toFixed(0)}% utilization
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Info Box
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary" component="div">
            <strong>💡 Scaling Tips:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Auto-scaling monitors worker utilization every 10 seconds</li>
              <li>Scales up when utilization {'>'} 80%, down when {'<'} 30%</li>
              <li>Manual scaling takes effect immediately</li>
              <li>For production, use Kubernetes HPA (configured in k8s/worker.yaml)</li>
            </ul>
          </Typography>
        </Box> */}
      </CardContent>
    </Card>
  );
};

export default WorkerScalingControl;
