import React, { useState } from 'react';
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
import { alpha } from '@mui/material/styles';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { monitoringAPI, getErrorMessage } from '../api/api';
import { usePolling } from '../hooks/usePolling';

// Overline label + h3 stat number, per the design system.
const StatNumber = ({ label, value, loading }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
      {label}
    </Typography>
    {loading ? (
      <Skeleton width={56} height={40} />
    ) : (
      <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
        {value ?? '—'}
      </Typography>
    )}
  </Box>
);

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

  usePolling(() => {
    fetchScalingConfig();
    fetchActualWorkerCount();
  }, 5000);

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
      const errorMessage = getErrorMessage(error);
      setMessage({
        type: 'error',
        text: errorMessage
      });

      // If Docker socket error, show helpful message
      if (errorMessage.includes('docker') || errorMessage.includes('socket')) {
        setMessage({
          type: 'info',
          text: 'Docker scaling requires additional configuration. Use manual scaling or deploy to Kubernetes for auto-scaling.'
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
      await monitoringAPI.post('/api/v1/scaling/auto-shrink', {
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
            <SettingsIcon fontSize="small" color="primary" />
            <Typography variant="h6">
              Worker Scaling Control
            </Typography>
            {!loading && (
              <Chip
                size="small"
                label="Connected"
                color="success"
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

        <Grid container spacing={2.5}>
          {/* Current Status */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
              <Stack direction="row" spacing={4}>
                <StatNumber label="Active Workers" value={actualWorkerCount} loading={loading} />
                <StatNumber label="Target" value={workerCount} loading={loading} />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
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
            <Box
              sx={(theme) => ({
                p: 2,
                borderRadius: 2,
                height: '100%',
                border: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: autoShrinkEnabled
                  ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.16 : 0.08)
                  : 'transparent',
              })}
            >
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Auto-Scaling Status
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoShrinkEnabled}
                    onChange={toggleAutoShrink}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">
                      {autoShrinkEnabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
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
              startIcon={isScaling ? <CircularProgress size={16} color="inherit" /> : <PlayIcon />}
            >
              {isScaling ? 'Scaling...' : 'Apply'}
            </Button>
          </Stack>
        </Box>

        {/* Scaling Thresholds (Info Only) */}
        {autoShrinkEnabled && (
          <Box
            sx={(theme) => ({
              mt: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
            })}
          >
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingDownIcon fontSize="small" color="info" />
              Auto-Scaling Thresholds
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Scale Down
                </Typography>
                <Typography variant="body2">
                  &lt; {(scalingConfig.scale_down_threshold * 100).toFixed(0)}% utilization
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Scale Up
                </Typography>
                <Typography variant="body2">
                  &gt; {(scalingConfig.scale_up_threshold * 100).toFixed(0)}% utilization
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkerScalingControl;
