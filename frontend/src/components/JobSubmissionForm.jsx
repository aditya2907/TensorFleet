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
    <Card sx={{ 
      background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      overflow: 'visible',
      position: 'relative',
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 4,
          pb: 2,
          borderBottom: '2px solid',
          borderImage: 'linear-gradient(90deg, #667eea, #764ba2) 1'
        }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '12px',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          }}>
            <SendIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Submit Training Job
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Quick Configuration Presets */}
          <Box sx={{ 
            mb: 3,
            p: 2,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <Button
              startIcon={<AutoFixHighIcon />}
              onClick={() => setShowPresets(!showPresets)}
              variant="outlined"
              size="medium"
              sx={{ 
                mb: showPresets ? 2 : 0,
                borderColor: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  background: 'rgba(102, 126, 234, 0.1)'
                }
              }}
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
                    size="medium"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        background: 'primary.main',
                        color: 'white',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                    title={preset.description}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <TextField
              fullWidth
              label="Job Name"
              value={formData.job_name}
              onChange={handleChange('job_name')}
              margin="normal"
              variant="outlined"
              required
              error={!formData.job_name || formData.job_name.trim() === ''}
              helperText={(!formData.job_name || formData.job_name.trim() === '') ? "Job name is required" : "This will be used in the model name"}
              placeholder="Enter a descriptive name for your training job"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  }
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              margin="normal"
              variant="outlined"
              placeholder="Brief description (optional)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  }
                }
              }}
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
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                }
              }
            }}
          >
            {modelTypes.map((option) => (
              <MenuItem 
                key={option.value} 
                value={option.value}
                sx={{
                  py: 1,
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
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
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: !datasets || datasets.length === 0 ? 'error.main' : 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: !datasets || datasets.length === 0 ? 'error.main' : 'primary.main',
                  borderWidth: 2,
                }
              }
            }}
          >
            {datasets && Array.isArray(datasets) ? datasets.map((option) => (
              <MenuItem 
                key={option?.name || 'unknown'} 
                value={`datasets/${option?.name || 'unknown'}`}
                sx={{
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                {option?.name || 'Unknown Dataset'}
              </MenuItem>
            )) : null}
          </TextField>

          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <TextField
              fullWidth
              label="Workers"
              type="number"
              value={formData.num_workers}
              onChange={handleChange('num_workers')}
              margin="normal"
              variant="outlined"
              inputProps={{ min: 1, max: 10 }}
              helperText="Number of parallel workers"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  }
                }
              }}
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
              helperText="Training iterations"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  }
                }
              }}
            />
          </Box>

          <Typography variant="h6" sx={{ 
            mt: 4, 
            mb: 2, 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'primary.main'
          }}>
            📊 Hyperparameters
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            mb: 2,
            p: 2,
            background: 'rgba(102, 126, 234, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  }
                }
              }}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  }
                }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <TextField
              select
              fullWidth
              label="Optimizer"
              value={formData.optimizer}
              onChange={handleChange('optimizer')}
              margin="normal"
              variant="outlined"
              helperText="Optimization algorithm"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  }
                }
              }}
            >
              {optimizerOptions.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  sx={{
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)'
                    }
                  }}
                >
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  }
                }
              }}
            >
              {lossOptions.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  sx={{
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)'
                    }
                  }}
                >
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
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                }
              }
            }}
          />

          <Typography variant="h6" sx={{ 
            mt: 4, 
            mb: 2, 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'primary.main'
          }}>
            ⚙️ Training Configuration
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            alignItems: 'center', 
            mb: 3,
            p: 2,
            background: 'rgba(102, 126, 234, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.early_stopping}
                  onChange={(e) => setFormData({ ...formData, early_stopping: e.target.checked })}
                  sx={{
                    '&.Mui-checked': {
                      color: 'primary.main'
                    }
                  }}
                />
              }
              label="Enable Early Stopping"
              sx={{ 
                '& .MuiFormControlLabel-label': {
                  fontWeight: 500
                }
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.save_checkpoints}
                  onChange={(e) => setFormData({ ...formData, save_checkpoints: e.target.checked })}
                  sx={{
                    '&.Mui-checked': {
                      color: 'primary.main'
                    }
                  }}
                />
              }
              label="Save Model Checkpoints"
              sx={{ 
                '& .MuiFormControlLabel-label': {
                  fontWeight: 500
                }
              }}
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

          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            mb: 3, 
            flexWrap: 'wrap',
            p: 2,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <Chip 
              label={`${formData.num_workers || 0} Workers`} 
              size="medium" 
              sx={{ 
                background: 'primary.main',
                color: 'white',
                fontWeight: 600
              }} 
            />
            <Chip 
              label={`${formData.epochs || 0} Epochs`} 
              size="medium"
              sx={{ 
                background: 'secondary.main',
                color: 'white',
                fontWeight: 600
              }} 
            />
            <Chip 
              label={`LR: ${formData.learning_rate || '0'}`} 
              size="medium"
              sx={{ 
                background: 'success.main',
                color: 'white',
                fontWeight: 600
              }} 
            />
            <Chip 
              label={`Batch: ${formData.batch_size || '0'}`} 
              size="medium"
              sx={{ 
                background: 'info.main',
                color: 'white',
                fontWeight: 600
              }} 
            />
            <Chip 
              label={(formData.optimizer || 'unknown').toUpperCase()} 
              size="medium"
              sx={{ 
                background: 'warning.main',
                color: 'white',
                fontWeight: 600
              }} 
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !datasets || datasets.length === 0 || !formData.dataset_path || !formData.job_name}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ 
              mt: 3,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8, #6b46c1)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                background: 'grey.400',
                boxShadow: 'none',
                transform: 'none',
              },
              transition: 'all 0.3s ease'
            }}
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
