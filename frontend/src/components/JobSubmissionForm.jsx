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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const modelTypes = [
  { value: 'resnet50', label: 'ResNet-50' },
  { value: 'resnet101', label: 'ResNet-101' },
  { value: 'bert-base', label: 'BERT Base' },
  { value: 'bert-large', label: 'BERT Large' },
  { value: 'gpt2', label: 'GPT-2' },
  { value: 'gpt2-medium', label: 'GPT-2 Medium' },
  { value: 'vit', label: 'Vision Transformer' },
  { value: 'cnn', label: 'Custom CNN' },
];

const JobSubmissionForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    model_type: 'resnet50',
    dataset_path: 's3://tensorfleet/datasets/imagenet',
    num_workers: 3,
    epochs: 10,
    learning_rate: '0.001',
    batch_size: '32',
  });

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const jobData = {
      model_type: formData.model_type,
      dataset_path: formData.dataset_path,
      num_workers: parseInt(formData.num_workers),
      epochs: parseInt(formData.epochs),
      hyperparameters: {
        learning_rate: formData.learning_rate,
        batch_size: formData.batch_size,
        optimizer: 'adam',
      },
    };

    onSubmit(jobData);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          🚀 Submit Training Job
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            select
            fullWidth
            label="Model Type"
            value={formData.model_type}
            onChange={handleChange('model_type')}
            margin="normal"
            variant="outlined"
          >
            {modelTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Dataset Path"
            value={formData.dataset_path}
            onChange={handleChange('dataset_path')}
            margin="normal"
            variant="outlined"
            placeholder="s3://bucket/path/to/dataset"
            helperText="S3 path to your training dataset"
          />

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
            Hyperparameters
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Learning Rate"
              value={formData.learning_rate}
              onChange={handleChange('learning_rate')}
              margin="normal"
              variant="outlined"
              placeholder="0.001"
            />

            <TextField
              fullWidth
              label="Batch Size"
              value={formData.batch_size}
              onChange={handleChange('batch_size')}
              margin="normal"
              variant="outlined"
              placeholder="32"
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ mt: 3 }}
          >
            {loading ? 'Submitting...' : 'Submit Job'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default JobSubmissionForm;
