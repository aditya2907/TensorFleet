import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  IconButton,
  Collapse,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { storageAPI } from '../api/api';

const TrainingProgressMonitor = ({ job, onNotification }) => {
  const [expanded, setExpanded] = useState(true);
  const [savingArtifacts, setSavingArtifacts] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);

  // Helper function to generate model name using the new naming convention
  const generateModelName = (job) => {
    const datasetName = job.dataset_path ? 
      job.dataset_path.split('/').pop().split('.')[0] : 'dataset';
    return `${job.job_name}_${job.model_type}_${datasetName}`;
  };

  // Real-time job status monitoring (disabled fake artifact generation)
  useEffect(() => {
    if (job?.status === 'RUNNING' && job?.job_id) {
      // Just monitor the job status, don't generate fake artifacts
      // Real artifacts should come from the actual ML training process
    }
  }, [job?.job_id, job?.status]);

  const generateTrainingArtifacts = async () => {
    if (!job?.job_id) return;

    try {
      const currentEpoch = Math.floor((job.progress || 0) / 10) + 1;
      const loss = Math.max(0.1, 1.0 - (currentEpoch * 0.08) + Math.random() * 0.1);
      const accuracy = Math.min(0.98, 0.5 + (currentEpoch * 0.04) + Math.random() * 0.05);

      // Create training log
      const logContent = `Epoch ${currentEpoch}: Loss=${loss.toFixed(4)}, Accuracy=${accuracy.toFixed(4)}\n`;
      
      // Save checkpoint if this is a milestone epoch
      if (currentEpoch % 5 === 0) {
        await saveCheckpoint(currentEpoch, { loss, accuracy });
      }

      // Save training log
      await saveTrainingLog(job.job_id, logContent);
      
    } catch (error) {
      console.error('Error generating artifacts:', error);
    }
  };

  const saveCheckpoint = async (epoch, metrics) => {
    try {
      setSavingArtifacts(true);
      
      // Create checkpoint data
      const checkpointData = {
        epoch,
        model_state: `Model state dict for epoch ${epoch}`,
        optimizer_state: `Optimizer state for epoch ${epoch}`,
        loss: metrics.loss,
        accuracy: metrics.accuracy,
        timestamp: new Date().toISOString(),
      };

      const checkpointBlob = new Blob([JSON.stringify(checkpointData, null, 2)], {
        type: 'application/json'
      });
      
      const checkpointFile = new File([checkpointBlob], `checkpoint_epoch_${epoch}.json`, {
        type: 'application/json'
      });

      // Upload to MinIO
      const formData = new FormData();
      formData.append('file', checkpointFile);
      
      await fetch(`http://localhost:8081/api/v1/upload/checkpoints/${job.job_id}/checkpoint_epoch_${epoch}.json`, {
        method: 'POST',
        body: formData,
      });

      // Save metadata to MongoDB
      await storageAPI.createCheckpoint({
        job_id: job.job_id,
        epoch,
        checkpoint_path: `checkpoints/${job.job_id}/checkpoint_epoch_${epoch}.json`,
        metrics: metrics,
        created_at: new Date().toISOString(),
      });

      setCheckpoints(prev => [...prev, { epoch, metrics, timestamp: new Date() }]);
      
      onNotification?.({
        open: true,
        message: `Checkpoint saved for epoch ${epoch}`,
        severity: 'success',
      });

    } catch (error) {
      console.error('Error saving checkpoint:', error);
      onNotification?.({
        open: true,
        message: `Failed to save checkpoint: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setSavingArtifacts(false);
    }
  };

  const saveTrainingLog = async (jobId, logContent) => {
    try {
      const logBlob = new Blob([logContent], { type: 'text/plain' });
      const logFile = new File([logBlob], `training_${Date.now()}.log`, {
        type: 'text/plain'
      });

      const timestamp = Date.now();

      // Upload to MinIO
      const formData = new FormData();
      formData.append('file', logFile);
      
      await fetch(`http://localhost:8081/api/v1/upload/artifacts/${jobId}/training_${timestamp}.log`, {
        method: 'POST',
        body: formData,
      });

      // Save artifact metadata with proper format
      const artifactMetadata = new FormData();
      artifactMetadata.append('file', logFile);
      artifactMetadata.append('metadata', JSON.stringify({
        job_id: jobId,
        artifact_type: 'training_log',
        name: `training_${timestamp}`,
        extension: 'log',
        content_type: 'text/plain',
        artifact_path: `artifacts/${jobId}/training_${timestamp}.log`,
        created_at: new Date().toISOString(),
      }));

      await fetch('http://localhost:8081/api/v1/artifacts', {
        method: 'POST',
        body: artifactMetadata,
      });

      setArtifacts(prev => [...prev, {
        type: 'log',
        content: logContent,
        timestamp: new Date(),
      }]);

    } catch (error) {
      console.error('Error saving training log:', error);
    }
  };

  const saveModel = async () => {
    if (!job?.job_id) return;

    try {
      setSavingArtifacts(true);

      // Create model data
      const modelData = {
        model_type: job.model_type,
        job_id: job.job_id,
        final_metrics: {
          loss: Math.random() * 0.3,
          accuracy: 0.85 + Math.random() * 0.1,
        },
        training_completed_at: new Date().toISOString(),
        hyperparameters: job.hyperparameters,
      };

      const modelBlob = new Blob([JSON.stringify(modelData, null, 2)], {
        type: 'application/json'
      });
      
      // Generate model name using new naming convention
      const modelName = generateModelName(job);
      
      const modelFile = new File([modelBlob], `${modelName}.json`, {
        type: 'application/json'
      });

      // Upload to MinIO
      const formData = new FormData();
      formData.append('file', modelFile);
      
      await fetch(`http://localhost:8081/api/v1/upload/models/${job.job_name}/${modelName}.json`, {
        method: 'POST',
        body: formData,
      });

      // Save model metadata to MongoDB with proper format
      const modelMetadata = new FormData();
      modelMetadata.append('file', modelFile);
      modelMetadata.append('metadata', JSON.stringify({
        job_id: job.job_id,
        name: job.job_name,
        model_type: job.model_type,
        extension: 'json',
        content_type: 'application/json',
        metrics: modelData.final_metrics,
        hyperparameters: job.hyperparameters,
        training_config: job.training_config,
        created_at: new Date().toISOString(),
        status: 'completed'
      }));

      await fetch('http://localhost:8081/api/v1/models', {
        method: 'POST',
        body: modelMetadata,
      });

      // Generate the expected model name using the new naming convention
      const expectedModelName = generateModelName(job);
      
      onNotification?.({
        open: true,
        message: `Model auto-saved: ${expectedModelName}`,
        severity: 'success',
      });

    } catch (error) {
      console.error('Error saving model:', error);
      onNotification?.({
        open: true,
        message: `Failed to save model: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setSavingArtifacts(false);
    }
  };

  const progress = job?.progress || 0;
  const currentEpoch = Math.floor(progress / 10) + 1;
  const totalEpochs = job?.epochs || 10;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            🔄 Training Progress
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          {/* Main Progress Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Overall Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {progress.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 12, 
                borderRadius: 6,
                background: 'rgba(102, 126, 234, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  borderRadius: 6,
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Epoch {currentEpoch} of {totalEpochs}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {job.completed_tasks || 0} / {job.total_tasks || 0} tasks completed
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'primary.lighter' }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Current Metrics
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Loss</Typography>
                    <Typography variant="h6" color="primary">
                      {job.current_loss ? job.current_loss.toFixed(4) : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Accuracy</Typography>
                    <Typography variant="h6" color="primary">
                      {job.current_accuracy ? (job.current_accuracy * 100).toFixed(2) + '%' : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'success.lighter' }}>
                <Typography variant="subtitle2" gutterBottom>
                  💾 Artifacts Generated
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip size="small" label={`${checkpoints.length} Checkpoints`} color="success" />
                  <Chip size="small" label={`${artifacts.length} Logs`} color="info" />
                  {job?.status === 'COMPLETED' && (
                    <Chip 
                      size="small" 
                      icon={<CloudUploadIcon />}
                      label={`Auto-Saved: ${generateModelName(job)}`}
                      color="secondary" 
                      sx={{ mt: 0.5 }}
                      title="Model automatically saved with descriptive naming: JobName_ModelType_Dataset"
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {checkpoints.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                📋 Recent Checkpoints
              </Typography>
              <List dense>
                {checkpoints.slice(-3).map((checkpoint, idx) => (
                  <ListItem key={idx} sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 0.5 }}>
                    <ListItemText
                      primary={`Epoch ${checkpoint.epoch}`}
                      secondary={`Loss: ${checkpoint.metrics?.loss?.toFixed(4)}, Accuracy: ${checkpoint.metrics?.accuracy?.toFixed(4)}`}
                    />
                    <Chip size="small" label="Saved" color="success" />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {savingArtifacts && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <CloudUploadIcon sx={{ mr: 1 }} />
              Saving training artifacts to storage...
            </Alert>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default TrainingProgressMonitor;
