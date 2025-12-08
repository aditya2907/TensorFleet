import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MLJobValidationDialog from './MLJobValidationDialog';
import { MLTrainingPresets, getPresetRecommendations, applyPreset } from '../utils/mlPresets';

const modelTypes = [
  { value: 'resnet50', label: 'ResNet-50', category: 'Computer Vision' },
  { value: 'resnet101', label: 'ResNet-101', category: 'Computer Vision' },
  { value: 'vit', label: 'Vision Transformer', category: 'Computer Vision' },
  { value: 'cnn', label: 'Custom CNN', category: 'Computer Vision' },
  { value: 'bert-base', label: 'BERT Base', category: 'Natural Language Processing' },
  { value: 'bert-large', label: 'BERT Large', category: 'Natural Language Processing' },
  { value: 'gpt2', label: 'GPT-2', category: 'Natural Language Processing' },
  { value: 'gpt2-medium', label: 'GPT-2 Medium', category: 'Natural Language Processing' },
  { value: 'random-forest', label: 'Random Forest', category: 'Traditional ML' },
  { value: 'logistic-regression', label: 'Logistic Regression', category: 'Traditional ML' },
  { value: 'svm', label: 'Support Vector Machine', category: 'Traditional ML' },
  { value: 'decision-tree', label: 'Decision Tree', category: 'Traditional ML' },
];

const optimizerOptions = [
  { value: 'adam', label: 'Adam' },
  { value: 'sgd', label: 'SGD (Stochastic Gradient Descent)' },
  { value: 'rmsprop', label: 'RMSprop' },
  { value: 'adamw', label: 'AdamW' },
];

const lossOptions = [
  { value: 'categorical_crossentropy', label: 'Categorical Crossentropy' },
  { value: 'binary_crossentropy', label: 'Binary Crossentropy' },
  { value: 'sparse_categorical_crossentropy', label: 'Sparse Categorical Crossentropy' },
  { value: 'mean_squared_error', label: 'Mean Squared Error' },
  { value: 'mean_absolute_error', label: 'Mean Absolute Error' },
];

const JobSubmissionForm = ({ onSubmit, loading, datasets, onNotification }) => {
  const [formData, setFormData] = useState({
    model_type: 'resnet50',
    dataset_path: '',
    num_workers: 3,
    epochs: 10,
    learning_rate: '0.001',
    batch_size: '32',
    optimizer: 'adam',
    loss_function: 'categorical_crossentropy',
    validation_split: '0.2',
    early_stopping: true,
    save_checkpoints: true,
    job_name: '',
    description: '',
  });

  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [pendingJobData, setPendingJobData] = useState(null);
  const [showPresets, setShowPresets] = useState(false);

  // Update dataset_path when datasets become available
  React.useEffect(() => {
    if (datasets && Array.isArray(datasets) && datasets.length > 0 && !formData.dataset_path) {
      const firstDataset = datasets[0];
      if (firstDataset && firstDataset.name) {
        setFormData(prev => ({
          ...prev,
          dataset_path: `datasets/${firstDataset.name}`
        }));
      }
    }
  }, [datasets]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.dataset_path || formData.dataset_path.trim() === '') {
      return 'Please select a dataset before submitting the job';
    }
    if (!formData.job_name || formData.job_name.trim() === '') {
      return 'Please provide a job name';
    }
    if (formData.num_workers < 1 || formData.num_workers > 10) {
      return 'Number of workers must be between 1 and 10';
    }
    if (formData.epochs < 1 || formData.epochs > 1000) {
      return 'Number of epochs must be between 1 and 1000';
    }
    if (parseFloat(formData.learning_rate) <= 0 || parseFloat(formData.learning_rate) >= 1) {
      return 'Learning rate must be between 0 and 1';
    }
    if (parseInt(formData.batch_size) < 1 || parseInt(formData.batch_size) > 512) {
      return 'Batch size must be between 1 and 512';
    }
    if (parseFloat(formData.validation_split) < 0 || parseFloat(formData.validation_split) >= 1) {
      return 'Validation split must be between 0 and 1';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      if (onNotification) {
        onNotification({
          open: true,
          message: validationError,
          severity: 'error',
        });
      } else {
        alert(validationError);
      }
      return;
    }
    
    // Format data according to API Gateway requirements
    const jobData = {
      model_type: formData.model_type,
      dataset_path: formData.dataset_path,
      num_workers: parseInt(formData.num_workers),
      epochs: parseInt(formData.epochs),
      hyperparameters: {
        learning_rate: formData.learning_rate,
        batch_size: formData.batch_size,
        optimizer: formData.optimizer,
        loss_function: formData.loss_function,
        validation_split: formData.validation_split,
        job_name: formData.job_name,
        description: formData.description,
        early_stopping: formData.early_stopping.toString(),
        save_checkpoints: formData.save_checkpoints.toString(),
      },
    };

    // Open validation dialog before submitting
    setPendingJobData(jobData);
    setValidationDialogOpen(true);
  };

  const handleConfirmSubmission = () => {
    setValidationDialogOpen(false);
    onSubmit(pendingJobData);
    setPendingJobData(null);
  };

  const handleCancelSubmission = () => {
    setValidationDialogOpen(false);
    setPendingJobData(null);
  };

  const handleApplyPreset = (presetKey) => {
    const updatedFormData = applyPreset(presetKey, formData);
    setFormData(updatedFormData);
    setShowPresets(false);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          🚀 Submit Training Job
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Quick Configuration Presets */}
          <Box sx={{ mb: 2 }}>
            <Button
              startIcon={<AutoFixHighIcon />}
              onClick={() => setShowPresets(!showPresets)}
              variant="outlined"
              size="small"
              sx={{ mb: showPresets ? 2 : 0 }}
            >
              Quick Config Presets
            </Button>
            
            {showPresets && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(MLTrainingPresets).map(([key, preset]) => (
                  <Chip
                    key={key}
                    label={preset.name}
                    onClick={() => handleApplyPreset(key)}
                    variant="outlined"
                    size="small"
                    sx={{ cursor: 'pointer' }}
                    title={preset.description}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Job Name"
              value={formData.job_name}
              onChange={handleChange('job_name')}
              margin="normal"
              variant="outlined"
              required
              error={!formData.job_name || formData.job_name.trim() === ''}
              helperText={(!formData.job_name || formData.job_name.trim() === '') ? "Job name is required" : ""}
              placeholder="Enter a descriptive name for your training job"
            />
            
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              margin="normal"
              variant="outlined"
              placeholder="Brief description (optional)"
            />
          </Box>

          <TextField
            select
            fullWidth
            label="Model Type"
            value={formData.model_type}
            onChange={handleChange('model_type')}
            margin="normal"
            variant="outlined"
            helperText="Select the machine learning model architecture"
          >
            {modelTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <span>
                  <Typography component="div" variant="body2" sx={{ fontWeight: 600 }}>
                    {option.label}
                  </Typography>
                  <Typography component="div" variant="caption" color="text.secondary">
                    {option.category}
                  </Typography>
                </span>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Dataset"
            value={formData.dataset_path}
            onChange={handleChange('dataset_path')}
            margin="normal"
            variant="outlined"
            helperText={(datasets && datasets.length === 0) ? "⚠️ Please upload a dataset first in the Datasets tab" : "Select a dataset from the manager"}
            disabled={!datasets || datasets.length === 0}
            required
            error={!datasets || datasets.length === 0}
          >
            {datasets && Array.isArray(datasets) ? datasets.map((option) => (
              <MenuItem key={option?.name || 'unknown'} value={`datasets/${option?.name || 'unknown'}`}>
                {option?.name || 'Unknown Dataset'}
              </MenuItem>
            )) : null}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Workers"
              type="number"
              value={formData.num_workers}
              onChange={handleChange('num_workers')}
              margin="normal"
              variant="outlined"
              inputProps={{ min: 1, max: 10 }}
            />

            <TextField
              fullWidth
              label="Epochs"
              type="number"
              value={formData.epochs}
              onChange={handleChange('epochs')}
              margin="normal"
              variant="outlined"
              inputProps={{ min: 1, max: 100 }}
            />
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            📊 Hyperparameters
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Learning Rate"
              type="number"
              value={formData.learning_rate}
              onChange={handleChange('learning_rate')}
              margin="normal"
              variant="outlined"
              placeholder="0.001"
              inputProps={{ step: 0.0001, min: 0.0001, max: 1 }}
              helperText="Learning rate for optimization"
            />

            <TextField
              fullWidth
              label="Batch Size"
              type="number"
              value={formData.batch_size}
              onChange={handleChange('batch_size')}
              margin="normal"
              variant="outlined"
              placeholder="32"
              inputProps={{ min: 1, max: 512 }}
              helperText="Number of samples per batch"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              fullWidth
              label="Optimizer"
              value={formData.optimizer}
              onChange={handleChange('optimizer')}
              margin="normal"
              variant="outlined"
              helperText="Optimization algorithm"
            >
              {optimizerOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Loss Function"
              value={formData.loss_function}
              onChange={handleChange('loss_function')}
              margin="normal"
              variant="outlined"
              helperText="Loss function for training"
            >
              {lossOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            fullWidth
            label="Validation Split"
            type="number"
            value={formData.validation_split}
            onChange={handleChange('validation_split')}
            margin="normal"
            variant="outlined"
            placeholder="0.2"
            inputProps={{ step: 0.1, min: 0, max: 0.9 }}
            helperText="Fraction of data to use for validation (0.0-0.9)"
          />

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            ⚙️ Training Configuration
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.early_stopping}
                  onChange={(e) => setFormData({ ...formData, early_stopping: e.target.checked })}
                />
              }
              label="Enable Early Stopping"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.save_checkpoints}
                  onChange={(e) => setFormData({ ...formData, save_checkpoints: e.target.checked })}
                />
              }
              label="Save Model Checkpoints"
            />
          </Box>

          {(!formData.job_name || formData.job_name.trim() === '') && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please provide a job name to identify your training job
            </Alert>
          )}

          {(!datasets || datasets.length === 0) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              No datasets available. Please upload a dataset first in the Datasets tab.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${formData.num_workers || 0} Workers`} size="small" />
            <Chip label={`${formData.epochs || 0} Epochs`} size="small" />
            <Chip label={`LR: ${formData.learning_rate || '0'}`} size="small" />
            <Chip label={`Batch: ${formData.batch_size || '0'}`} size="small" />
            <Chip label={(formData.optimizer || 'unknown').toUpperCase()} size="small" />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !datasets || datasets.length === 0 || !formData.dataset_path || !formData.job_name}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ mt: 2 }}
          >
            {loading 
              ? 'Submitting Training Job...' 
              : (!datasets || datasets.length === 0)
                ? 'Upload Dataset First' 
                : !formData.job_name
                  ? 'Enter Job Name'
                  : 'Review & Submit Job'}
          </Button>
        </Box>
      </CardContent>

      {/* Validation Dialog */}
      <MLJobValidationDialog
        open={validationDialogOpen}
        onClose={handleCancelSubmission}
        jobData={pendingJobData}
        onConfirm={handleConfirmSubmission}
      />
    </Card>
  );
};

export default JobSubmissionForm;
