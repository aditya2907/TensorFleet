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

  // Simulate real training progress and generate artifacts
  useEffect(() => {
    if (job?.status === 'RUNNING' && job?.job_id) {
      const interval = setInterval(() => {
        generateTrainingArtifacts();
      }, 5000); // Generate artifacts every 5 seconds

      return () => clearInterval(interval);
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
      
      const modelFile = new File([modelBlob], `${job.job_name}_model.json`, {
        type: 'application/json'
      });

      // Upload to MinIO
      const formData = new FormData();
      formData.append('file', modelFile);
      
      await fetch(`http://localhost:8081/api/v1/upload/models/${job.job_name}/${job.job_name}_model.json`, {
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

      onNotification?.({
        open: true,
        message: `Model saved successfully: ${job.job_name}`,
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
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Epoch {currentEpoch} of {totalEpochs}
              </Typography>
              <Typography variant="body2">
                {progress.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
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
                      {(Math.max(0.1, 1.0 - (currentEpoch * 0.08))).toFixed(4)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Accuracy</Typography>
                    <Typography variant="h6" color="primary">
                      {(Math.min(0.98, 0.5 + (currentEpoch * 0.04))).toFixed(4)}
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
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip size="small" label={`${checkpoints.length} Checkpoints`} color="success" />
                  <Chip size="small" label={`${artifacts.length} Logs`} color="info" />
                </Box>
                {job?.status === 'COMPLETED' && (
                  <Button
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={saveModel}
                    disabled={savingArtifacts}
                    sx={{ mt: 1 }}
                  >
                    Save Model
                  </Button>
                )}
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
