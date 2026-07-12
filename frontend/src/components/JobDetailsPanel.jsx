import React from 'react';
import {
  Alert,
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
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import { monoFontFamily } from '../theme/typography';
import JobStatusChip from './JobStatusChip';
import JobMetrics from './JobMetrics';
import LogViewer from './LogViewer';
import TrainingProgressMonitor from './TrainingProgressMonitor';

const StatusChip = ({ status }) => {
  const getColor = () => {
    switch (status?.toUpperCase()) {
      case 'RUNNING':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'CANCELLED':
        return 'default';
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
            <InfoOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No job selected — submit a new job or select one from the jobs list
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <WorkOutlineRoundedIcon fontSize="small" color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Job Details
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
              fontFamily: monoFontFamily,
              bgcolor: 'action.hover',
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
                sx={{ fontFamily: monoFontFamily }}
              />
            )}
          </Box>
        )}

        {/* Message */}
        {job.message && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {job.message}
          </Alert>
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
