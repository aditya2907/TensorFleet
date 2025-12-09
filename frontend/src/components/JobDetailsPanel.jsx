import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Divider,
  Grid,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveIcon from '@mui/icons-material/Save';
import JobStatusChip from './JobStatusChip';
import JobMetrics from './JobMetrics';
import LogViewer from './LogViewer';
import TrainingProgressMonitor from './TrainingProgressMonitor';

const StatusChip = ({ status }) => {
  const getColor = () => {
    switch (status?.toUpperCase()) {
      case 'RUNNING':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'CANCELLED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={status || 'UNKNOWN'}
      color={getColor()}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
};

const MetricItem = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="textSecondary">
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600 }}>
      {value !== null && value !== undefined ? value : '-'}
    </Typography>
  </Box>
);

const JobDetailsPanel = ({ job, onRefresh, onCancel, onNotification }) => {
  if (!job) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <InfoOutlinedIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
            <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
              No Job Selected
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Submit a new job or select from the jobs list
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const progress = job.progress || 0;
  const isRunning = job.status?.toUpperCase() === 'RUNNING';

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📊 Job Details
          </Typography>
          <StatusChip status={job.status} />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Job ID */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="textSecondary">
            Job ID
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              bgcolor: 'grey.100',
              p: 1,
              borderRadius: 1,
              wordBreak: 'break-all',
            }}
          >
            {job.job_id}
          </Typography>
        </Box>



        {/* Metrics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <MetricItem
              label="Loss"
              value={job.current_loss ? job.current_loss.toFixed(4) : '-'}
            />
          </Grid>
          <Grid item xs={6}>
            <MetricItem
              label="Accuracy"
              value={job.current_accuracy ? (job.current_accuracy * 100).toFixed(2) + '%' : '-'}
            />
          </Grid>
        </Grid>

        {/* Auto-saved Model Notification */}
        {job.status === 'COMPLETED' && (
          <Box sx={{ mb: 2 }}>
            <Chip
              icon={<SaveIcon />}
              label="Model Automatically Saved"
              color="success"
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            />
            {job.model_saved && job.model_id && (
              <Chip
                label={`Model ID: ${job.model_id.substring(0, 8)}...`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontFamily: 'monospace' }}
              />
            )}
          </Box>
        )}

        {/* Message */}
        {job.message && (
          <Box
            sx={{
              bgcolor: 'info.lighter',
              p: 2,
              borderRadius: 1,
              mb: 2,
              border: '1px solid',
              borderColor: 'info.light',
            }}
          >
            <Typography variant="body2" color="info.dark">
              {job.message}
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<RefreshIcon />}
            onClick={() => onRefresh(job.job_id)}
          >
            Refresh
          </Button>
          {isRunning && (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              startIcon={<CancelIcon />}
              onClick={() => onCancel(job.job_id)}
            >
              Cancel
            </Button>
          )}
        </Box>
        <Divider sx={{ my: 2 }} />
        
        {/* Real-time Training Progress with Artifact Generation */}
        <Box sx={{ mb: 2 }}>
          <TrainingProgressMonitor job={job} onNotification={onNotification} />
        </Box>

        {/* Job Metrics */}
        <JobMetrics metrics={job.metrics} />
        <Box sx={{ mt: 2 }}>
          <LogViewer jobId={job.job_id} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default JobDetailsPanel;
