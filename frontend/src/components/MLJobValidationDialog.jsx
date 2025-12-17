import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

const MLJobValidationDialog = ({ open, onClose, jobData, onConfirm }) => {
  const [validationResults, setValidationResults] = useState({
    errors: [],
    warnings: [],
    info: [],
    estimations: {},
  });

  useEffect(() => {
    if (jobData && open) {
      validateJobConfiguration();
    }
  }, [jobData, open]);

  const validateJobConfiguration = () => {
    if (!jobData) return;
    
    const errors = [];
    const warnings = [];
    const info = [];
    const estimations = {};

    // Validate required fields
    const jobName = jobData.job_name?.trim() || jobData.hyperparameters?.job_name?.trim();
    if (!jobName) {
      errors.push('Job name is required');
    }
    if (!jobData.model_type) {
      errors.push('Model type must be selected');
    }
    if (!jobData.dataset_path) {
      errors.push('Dataset must be selected');
    }

    // Validate hyperparameters
    const hp = jobData.hyperparameters || {};
    if (hp.learning_rate <= 0 || hp.learning_rate >= 1) {
      errors.push('Learning rate must be between 0 and 1');
    }
    if (hp.batch_size < 1 || hp.batch_size > 512) {
      errors.push('Batch size must be between 1 and 512');
    }

    // Warnings for suboptimal configurations
    if (hp.learning_rate > 0.1) {
      warnings.push('Learning rate is quite high, consider using a smaller value (0.001-0.01)');
    }
    if (hp.batch_size > 256) {
      warnings.push('Large batch size may require more memory and slower convergence');
    }
    if (jobData.epochs > 100) {
      warnings.push('Training for more than 100 epochs may lead to overfitting');
    }
    if (jobData.num_workers > 5) {
      warnings.push('Using many workers may not always improve training speed');
    }

    // Model-specific recommendations
    if (jobData.model_type?.includes('bert') && hp.learning_rate > 0.00005) {
      warnings.push('BERT models typically work better with lower learning rates (2e-5 to 5e-5)');
    }
    if (jobData.model_type?.includes('resnet') && hp.batch_size < 16) {
      warnings.push('ResNet models typically benefit from larger batch sizes (16-32)');
    }

    // Informational messages
    info.push(`Model Type: ${jobData.model_type} (${getModelCategory(jobData.model_type)})`);
    info.push(`Dataset: ${jobData.dataset_path?.split('/').pop()}`);
    info.push(`Optimizer: ${hp.optimizer?.toUpperCase()}`);
    if (hp.validation_split > 0) {
      info.push(`${(hp.validation_split * 100).toFixed(0)}% of data will be used for validation`);
    }

    // Estimations
    estimations.trainingTime = estimateTrainingTime();
    estimations.memoryUsage = estimateMemoryUsage();
    estimations.computeResources = estimateComputeResources();

    setValidationResults({ errors, warnings, info, estimations });
  };

  const getModelCategory = (modelType) => {
    if (['resnet50', 'resnet101', 'vit', 'cnn'].includes(modelType)) {
      return 'Computer Vision';
    }
    if (['bert-base', 'bert-large', 'gpt2', 'gpt2-medium'].includes(modelType)) {
      return 'NLP';
    }
    if (['random-forest', 'logistic-regression', 'svm', 'decision-tree'].includes(modelType)) {
      return 'Traditional ML';
    }
    return 'Unknown';
  };

  const estimateTrainingTime = () => {
    if (!jobData) return 'Unknown';
    
    const baseMinutes = {
      'resnet50': 30,
      'resnet101': 45,
      'bert-base': 60,
      'bert-large': 120,
      'gpt2': 90,
      'vit': 40,
      'cnn': 20,
      'random-forest': 5,
      'logistic-regression': 2,
      'svm': 10,
      'decision-tree': 3,
    };

    const base = baseMinutes[jobData.model_type] || 30;
    const epochMultiplier = (jobData.epochs || 10) / 10;
    const workerDivisor = Math.max(1, (jobData.num_workers || 1) * 0.8); // Diminishing returns
    
    const estimatedMinutes = Math.round((base * epochMultiplier) / workerDivisor);
    
    if (estimatedMinutes < 60) {
      return `~${estimatedMinutes} minutes`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const mins = estimatedMinutes % 60;
      return `~${hours}h ${mins}m`;
    }
  };

  const estimateMemoryUsage = () => {
    if (!jobData) return 'Unknown';
    
    const baseGB = {
      'resnet50': 4,
      'resnet101': 6,
      'bert-base': 8,
      'bert-large': 16,
      'gpt2': 10,
      'gpt2-medium': 14,
      'vit': 6,
      'cnn': 2,
      'random-forest': 1,
      'logistic-regression': 0.5,
      'svm': 2,
      'decision-tree': 0.5,
    };

    const base = baseGB[jobData.model_type] || 4;
    const batchMultiplier = (jobData.hyperparameters?.batch_size || 32) / 32;
    const workerMultiplier = jobData.num_workers || 1;
    
    const estimatedGB = Math.round(base * batchMultiplier * workerMultiplier * 10) / 10;
    
    return `~${estimatedGB} GB per worker`;
  };

  const estimateComputeResources = () => {
    if (!jobData) return 'Unknown';
    
    const intensity = {
      'resnet50': 'Medium',
      'resnet101': 'High',
      'bert-base': 'High',
      'bert-large': 'Very High',
      'gpt2': 'High',
      'gpt2-medium': 'Very High',
      'vit': 'Medium-High',
      'cnn': 'Low-Medium',
      'random-forest': 'Low',
      'logistic-regression': 'Very Low',
      'svm': 'Low-Medium',
      'decision-tree': 'Very Low',
    };

    return intensity[jobData.model_type] || 'Medium';
  };

  const canSubmit = validationResults.errors.length === 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🔍 Job Configuration Validation
        </Typography>
      </DialogTitle>
      <DialogContent>
        {!jobData ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            No job data available for validation.
          </Alert>
        ) : (
          <>
        {/* Validation Results */}
        {validationResults.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <div>
              <Typography component="div" variant="subtitle2" gutterBottom>
                Configuration Errors
              </Typography>
              <List dense>
                {validationResults.errors.map((error, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ErrorIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={error} />
                  </ListItem>
                ))}
              </List>
            </div>
          </Alert>
        )}

        {validationResults.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <div>
              <Typography component="div" variant="subtitle2" gutterBottom>
                Recommendations
              </Typography>
              <List dense>
                {validationResults.warnings.map((warning, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
              </List>
            </div>
          </Alert>
        )}

        {/* Job Summary */}
        {jobData && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              📋 Job Summary
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <Chip label={`${jobData.job_name || jobData.hyperparameters?.job_name || 'Unnamed Job'}`} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Chip label={`${jobData.model_type || 'No Model'}`} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Chip label={`${jobData.epochs || 0} epochs`} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Chip label={`${jobData.num_workers || 0} workers`} variant="outlined" size="small" />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Estimations */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            ⏱️ Resource Estimations
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Training Time
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {validationResults.estimations.trainingTime}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Memory Usage
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {validationResults.estimations.memoryUsage}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Compute Intensity
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {validationResults.estimations.computeResources}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {canSubmit && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography component="div" variant="body2">
              ✅ Configuration looks good! Ready to submit training job.
            </Typography>
          </Alert>
        )}
        </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          disabled={!canSubmit}
          startIcon={<CheckCircleIcon />}
        >
          {canSubmit ? 'Submit Job' : 'Fix Errors First'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MLJobValidationDialog;
