import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Chip,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Skeleton,
} from '@mui/material';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import { monitoringAPI } from '../api/api';
import { usePolling } from '../hooks/usePolling';
import { monoFontFamily } from '../theme/typography';

const JobProgressMonitor = ({ jobId, jobData }) => {
  const [progress, setProgress] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobProgress = async () => {
    if (!jobId) return;
    try {
      // Fetch job metrics and progress
      const response = await monitoringAPI.getJobDetails(jobId);
      setProgress(response.data.progress || { percentage: 0, current_epoch: 0, total_epochs: 10 });
      setMetrics(response.data.metrics || { loss: 0.0, accuracy: 0.0 });
      setLogs(response.data.logs || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching job progress:', error);
      // Set default values on error instead of leaving empty
      setProgress({ percentage: 0, current_epoch: 0, total_epochs: 10 });
      setMetrics({ loss: 0.0, accuracy: 0.0 });
      setLogs([]);
      setLoading(false);
    }
  };

  // Immediate fetch when the selected job changes; usePolling handles the
  // 5s refresh cadence (and pauses it while the tab is hidden).
  useEffect(() => {
    if (!jobId) return;
    fetchJobProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  usePolling(fetchJobProgress, 5000, { enabled: Boolean(jobId), immediate: false });

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'QUEUED':
      case 'PENDING':
        return 'warning';
      case 'RUNNING':
      case 'PROGRESS':
        return 'info';
      case 'SUCCESS':
      case 'COMPLETED':
        return 'success';
      case 'FAILURE':
      case 'FAILED':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const calculateProgress = () => {
    if (!progress) return 0;
    if (progress.current_epoch && progress.total_epochs) {
      return (progress.current_epoch / progress.total_epochs) * 100;
    }
    return progress.percentage || 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <QueryStatsRoundedIcon fontSize="small" color="primary" />
            <Typography variant="h6">Training Progress</Typography>
          </Box>
          <Skeleton height={12} sx={{ mb: 1 }} />
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <QueryStatsRoundedIcon fontSize="small" color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Training Progress
          </Typography>
          {jobData?.status && (
            <Chip
              label={jobData.status}
              color={getStatusColor(jobData.status)}
              size="small"
            />
          )}
        </Box>

        {progress && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={calculateProgress()} color="primary" />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(calculateProgress())}%
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Current Epoch
                </Typography>
                <Typography variant="h6">
                  {progress.current_epoch || 0} / {progress.total_epochs || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Elapsed Time
                </Typography>
                <Typography variant="h6">
                  {progress.elapsed_time || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}

        {metrics && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Training Metrics
            </Typography>
            <Grid container spacing={2}>
              {metrics.loss && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Loss
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {typeof metrics.loss === 'number' ? metrics.loss.toFixed(4) : metrics.loss}
                  </Typography>
                </Grid>
              )}
              {metrics.accuracy && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Accuracy
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {typeof metrics.accuracy === 'number' ? (metrics.accuracy * 100).toFixed(2) + '%' : metrics.accuracy}
                  </Typography>
                </Grid>
              )}
              {metrics.learning_rate && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Learning Rate
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {metrics.learning_rate}
                  </Typography>
                </Grid>
              )}
              {metrics.validation_loss && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Val Loss
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {typeof metrics.validation_loss === 'number' ? metrics.validation_loss.toFixed(4) : metrics.validation_loss}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {logs && logs.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Recent Logs
            </Typography>
            <Box
              sx={(theme) => ({
                maxHeight: 200,
                overflow: 'auto',
                borderRadius: 1,
                p: 1,
                backgroundColor:
                  theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[900],
              })}
            >
              <List dense>
                {logs.slice(-5).map((log, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemText
                      primary={
                        <Typography
                          variant="caption"
                          component="span"
                          sx={(theme) => ({
                            fontFamily: monoFontFamily,
                            display: 'block',
                            whiteSpace: 'pre-wrap',
                            color: theme.palette.grey[300],
                          })}
                        >
                          {log.timestamp ? `[${log.timestamp}] ` : ''}{log.message || log}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </>
        )}

        {(!progress && !metrics && !logs.length) && (
          <Alert severity="info">
            No training progress data available yet. The job may be queued or starting up.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default JobProgressMonitor;
