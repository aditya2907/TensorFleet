import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Checkbox,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { modelServiceAPI, storageAPI } from '../api/api';
import ModelComparisonDialog from './ModelComparisonDialog';

const ModelRegistryPanel = ({ onNotification }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModels, setSelectedModels] = useState([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const fetchModels = async () => {
    try {
      setLoading(true);
      // Try storage API first for model metadata
      const storageResponse = await storageAPI.getModels();
      const storageModels = storageResponse.data.models || [];
      
      // Also get file information from MinIO
      const filesResponse = await storageAPI.listModels();
      const modelFiles = filesResponse.data.objects || [];
      
      // Combine metadata with file information
      const enhancedModels = storageModels.map(model => {
        const matchingFile = modelFiles.find(file => 
          file.name.includes(model.name) || file.name.includes(model._id)
        );
        return {
          ...model,
          file_info: matchingFile,
          file_size: matchingFile?.size || 0,
          last_modified: matchingFile?.last_modified
        };
      });
      
      setModels(enhancedModels);
    } catch (error) {
      console.error('Error fetching models:', error);
      // Fallback to model service API
      try {
        const fallbackResponse = await modelServiceAPI.listModels({ limit: 20 });
        setModels(fallbackResponse.data.models || []);
      } catch (fallbackError) {
        onNotification({
          open: true,
          message: `Failed to load models: ${error.message}`,
          severity: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
    const interval = setInterval(fetchModels, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async (model) => {
    try {
      // Use model.id instead of model._id (API returns 'id' not '_id')
      const modelId = model.id || model._id;
      if (!modelId) {
        throw new Error('Model ID is missing');
      }
      
      const response = await modelServiceAPI.downloadModel(modelId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${model.name || 'model'}_${model.version}.pkl`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      onNotification({
        open: true,
        message: `Downloading model: ${model.name}`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error downloading model:', error);
      onNotification({
        open: true,
        message: `Failed to download model: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const handleToggleSelect = (modelId) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    );
  };

  const handleOpenComparison = () => {
    setComparisonOpen(true);
  };

  const getSelectedModelDetails = () => {
    return models.filter((model) => {
      const modelId = model.id || model._id;
      return selectedModels.includes(modelId);
    });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, m: 0 }}>
            📦 Model Registry
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CompareArrowsIcon />}
            disabled={selectedModels.length < 2}
            onClick={handleOpenComparison}
          >
            Compare
          </Button>
        </Box>
        <Divider sx={{ mb: 1 }} />
        {loading && models.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 600, overflow: 'auto' }}>
            {models.map((model) => {
              const modelId = model.id || model._id;
              return (
                <ListItem
                  key={modelId}
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(model)}
                    >
                      Download
                    </Button>
                  }
                  disablePadding
                >
                  <Checkbox
                    edge="start"
                    checked={selectedModels.includes(modelId)}
                    onChange={() => handleToggleSelect(modelId)}
                  />
                  <ListItemText
                    primary={
                      <Typography variant="body1" component="span">
                        {model.name}{' '}
                        <Chip label={`v${model.version}`} size="small" />
                      </Typography>
                    }
                    secondary={`Algorithm: ${model.algorithm} | Status: ${model.status}`}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
        {models.length === 0 && !loading && (
          <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
            No models found in registry.
          </Typography>
        )}
      </CardContent>
      <ModelComparisonDialog
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        models={getSelectedModelDetails()}
      />
    </Card>
  );
};

export default ModelRegistryPanel;
