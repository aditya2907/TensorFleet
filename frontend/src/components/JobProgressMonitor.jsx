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
} from '@mui/material';
import { monitoringAPI } from '../api/api';

const JobProgressMonitor = ({ jobId, jobData }) => {
  const [progress, setProgress] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobProgress = async () => {
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

    // Initial fetch
    fetchJobProgress();

    // Set up polling for real-time updates
    const interval = setInterval(fetchJobProgress, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [jobId]);

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
          <Typography variant="h6" gutterBottom>
            📊 Job Progress
          </Typography>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading job progress...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📊 Training Progress
          {jobData?.status && (
            <Chip 
              label={jobData.status} 
              color={getStatusColor(jobData.status)} 
              size="small" 
            />
          )}
        </Typography>

        {progress && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgress()} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
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
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              📈 Training Metrics
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
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              📝 Recent Logs
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
              <List dense>
                {logs.slice(-5).map((log, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemText
                      primary={
                        <Typography variant="caption" component="span" sx={{ fontFamily: 'monospace', display: 'block', whiteSpace: 'pre-wrap' }}>
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
