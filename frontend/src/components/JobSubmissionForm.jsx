import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import MLJobValidationDialog from './MLJobValidationDialog';
import { MLTrainingPresets, applyPreset } from '../utils/mlPresets';

const modelTypes = [
  { value: 'resnet50', label: 'ResNet-50', category: 'Computer Vision' },
  { value: 'resnet101', label: 'ResNet-101', category: 'Computer Vision' },
  { value: 'vit', label: 'Vision Transformer', category: 'Computer Vision' },
  { value: 'cnn', label: 'Custom CNN', category: 'Computer Vision' },
  { value: 'bert_base', label: 'BERT (Base)', category: 'NLP' },
  { value: 'bert_large', label: 'BERT (Large)', category: 'NLP' },
  { value: 'gpt2', label: 'GPT-2', category: 'NLP' },
  { value: 'gpt2_medium', label: 'GPT-2 (Medium)', category: 'NLP' },
  { value: 'random_forest', label: 'Random Forest', category: 'Traditional ML' },
  { value: 'logistic_regression', label: 'Logistic Regression', category: 'Traditional ML' },
  { value: 'svm', label: 'SVM', category: 'Traditional ML' },
  { value: 'decision_tree', label: 'Decision Tree', category: 'Traditional ML' },
  { value: 'dnn', label: 'Deep Neural Network', category: 'Traditional ML' },
  { value: 'pytorch_mlp', label: 'MLP (PyTorch)', category: 'PyTorch' },
  { value: 'pytorch_cnn', label: 'CNN (PyTorch)', category: 'PyTorch' },
  { value: 'pytorch_lstm', label: 'LSTM (PyTorch)', category: 'PyTorch' },
  { value: 'pytorch_transformer', label: 'Transformer (PyTorch)', category: 'PyTorch' },
  { value: 'pytorch_logistic', label: 'Logistic Regression (PyTorch)', category: 'PyTorch' },
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

const SectionHeader = ({ icon: Icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
    <Icon fontSize="small" color="primary" />
    <Typography variant="h6">{title}</Typography>
  </Box>
);

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
      job_name: formData.job_name,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <SendRoundedIcon fontSize="small" color="primary" />
          <Typography variant="h6">Submit Training Job</Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Quick Configuration Presets */}
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={<AutoFixHighRoundedIcon />}
              onClick={() => setShowPresets(!showPresets)}
              variant="outlined"
              size="medium"
            >
              Quick Config Presets
            </Button>

            {showPresets && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {Object.entries(MLTrainingPresets).map(([key, preset]) => (
                  <Chip
                    key={key}
                    label={preset.name}
                    onClick={() => handleApplyPreset(key)}
                    variant="outlined"
                    size="small"
                    title={preset.description}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Job details */}
          <Box sx={{ mb: 4 }}>
            <SectionHeader icon={WorkOutlineRoundedIcon} title="Job Details" />
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Name"
                  value={formData.job_name}
                  onChange={handleChange('job_name')}
                  required
                  error={!formData.job_name || formData.job_name.trim() === ''}
                  helperText={(!formData.job_name || formData.job_name.trim() === '') ? 'Job name is required' : 'This will be used in the model name'}
                  placeholder="Enter a descriptive name for your training job"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleChange('description')}
                  placeholder="Brief description (optional)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Model Type"
                  value={formData.model_type}
                  onChange={handleChange('model_type')}
                  helperText="Select the machine learning model architecture"
                >
                  {modelTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ py: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {option.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {option.category}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Dataset"
                  value={formData.dataset_path}
                  onChange={handleChange('dataset_path')}
                  helperText={(datasets && datasets.length === 0) ? 'Please upload a dataset first in the Datasets tab' : 'Select a dataset from the manager'}
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Workers"
                  type="number"
                  value={formData.num_workers}
                  onChange={handleChange('num_workers')}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Number of parallel workers"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Epochs"
                  type="number"
                  value={formData.epochs}
                  onChange={handleChange('epochs')}
                  inputProps={{ min: 1, max: 100 }}
                  helperText="Training iterations"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Hyperparameters */}
          <Box sx={{ mb: 4 }}>
            <SectionHeader icon={TuneRoundedIcon} title="Hyperparameters" />
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Learning Rate"
                  type="number"
                  value={formData.learning_rate}
                  onChange={handleChange('learning_rate')}
                  placeholder="0.001"
                  inputProps={{ step: 0.0001, min: 0.0001, max: 1 }}
                  helperText="Learning rate for optimization"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Batch Size"
                  type="number"
                  value={formData.batch_size}
                  onChange={handleChange('batch_size')}
                  placeholder="32"
                  inputProps={{ min: 1, max: 512 }}
                  helperText="Number of samples per batch"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Optimizer"
                  value={formData.optimizer}
                  onChange={handleChange('optimizer')}
                  helperText="Optimization algorithm"
                >
                  {optimizerOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Loss Function"
                  value={formData.loss_function}
                  onChange={handleChange('loss_function')}
                  helperText="Loss function for training"
                >
                  {lossOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Validation Split"
                  type="number"
                  value={formData.validation_split}
                  onChange={handleChange('validation_split')}
                  placeholder="0.2"
                  inputProps={{ step: 0.1, min: 0, max: 0.9 }}
                  helperText="Fraction of data to use for validation (0.0-0.9)"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Training configuration */}
          <Box sx={{ mb: 3 }}>
            <SectionHeader icon={SettingsRoundedIcon} title="Training Configuration" />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 3 }}>
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
            </Stack>
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

          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Run Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" color="primary" label={`${formData.num_workers || 0} Workers`} />
              <Chip size="small" color="secondary" label={`${formData.epochs || 0} Epochs`} />
              <Chip size="small" color="success" label={`LR: ${formData.learning_rate || '0'}`} />
              <Chip size="small" color="info" label={`Batch: ${formData.batch_size || '0'}`} />
              <Chip size="small" color="warning" label={(formData.optimizer || 'unknown').toUpperCase()} />
            </Box>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !datasets || datasets.length === 0 || !formData.dataset_path || !formData.job_name}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon />}
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
