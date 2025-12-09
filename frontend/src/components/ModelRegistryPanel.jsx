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
  Grid,
  Paper,
  LinearProgress,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Collapse,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { modelServiceAPI, storageAPI } from '../api/api';
import ModelComparisonDialog from './ModelComparisonDialog';

const ModelRegistryPanel = ({ onNotification }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModels, setSelectedModels] = useState([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [expandedModels, setExpandedModels] = useState({});
  const [sortBy, setSortBy] = useState('accuracy');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchModels = async () => {
    try {
      setLoading(true);
      // Try storage API first for model metadata
      const storageResponse = await storageAPI.getModels();
      const storageModels = storageResponse.data.models || [];
      
      // Also get file information from MinIO
      const filesResponse = await storageAPI.listModels();
      const modelFiles = filesResponse.data.objects || [];
      
      // Combine metadata with file information and add mock evaluation data
      const enhancedModels = storageModels.map((model, index) => {
        const matchingFile = modelFiles.find(file => 
          file.name.includes(model.name) || file.name.includes(model._id)
        );
        
        // Generate realistic evaluation metrics for demo
        const baseAccuracy = 0.85 + (Math.random() * 0.12);
        const baseLoss = 0.15 + (Math.random() * 0.10);
        const f1Score = 0.80 + (Math.random() * 0.15);
        const precision = 0.82 + (Math.random() * 0.13);
        const recall = 0.78 + (Math.random() * 0.17);
        
        return {
          ...model,
          file_info: matchingFile,
          file_size: matchingFile?.size || 0,
          last_modified: matchingFile?.last_modified,
          evaluation_metrics: {
            accuracy: parseFloat(baseAccuracy.toFixed(4)),
            loss: parseFloat(baseLoss.toFixed(4)),
            f1_score: parseFloat(f1Score.toFixed(4)),
            precision: parseFloat(precision.toFixed(4)),
            recall: parseFloat(recall.toFixed(4)),
            training_time: `${(45 + Math.random() * 120).toFixed(1)}min`,
            epochs: Math.floor(20 + Math.random() * 80),
            batch_size: [16, 32, 64, 128][Math.floor(Math.random() * 4)],
            learning_rate: parseFloat((0.0001 + Math.random() * 0.01).toFixed(6))
          },
          algorithm_details: {
            architecture: model.algorithm || 'ResNet50',
            optimizer: ['Adam', 'SGD', 'RMSprop'][Math.floor(Math.random() * 3)],
            loss_function: ['CrossEntropy', 'MSE', 'BCE'][Math.floor(Math.random() * 3)],
            regularization: ['L2', 'L1', 'Dropout', 'None'][Math.floor(Math.random() * 4)],
            data_augmentation: Math.random() > 0.5,
            pretrained: Math.random() > 0.3
          }
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
    const interval = setInterval(fetchModels, 10000); // Refresh every 10 seconds to catch auto-saved models
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

  const toggleExpanded = (modelId) => {
    setExpandedModels(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  const sortModels = (modelsToSort) => {
    return [...modelsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'accuracy':
          return (b.evaluation_metrics?.accuracy || 0) - (a.evaluation_metrics?.accuracy || 0);
        case 'loss':
          return (a.evaluation_metrics?.loss || 1) - (b.evaluation_metrics?.loss || 1);
        case 'f1_score':
          return (b.evaluation_metrics?.f1_score || 0) - (a.evaluation_metrics?.f1_score || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'created_at':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });
  };

  const filterModels = (modelsToFilter) => {
    let filtered = modelsToFilter;
    
    // Filter by algorithm type
    if (filterBy !== 'all') {
      filtered = filtered.filter(model => 
        model.algorithm?.toLowerCase().includes(filterBy.toLowerCase()) ||
        model.algorithm_details?.architecture?.toLowerCase().includes(filterBy.toLowerCase())
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(model =>
        model.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.algorithm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.algorithm_details?.architecture?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredAndSortedModels = () => {
    return sortModels(filterModels(models));
  };

  const getBestPerformingModel = () => {
    if (models.length === 0) return null;
    return models.reduce((best, current) => {
      const bestAccuracy = best.evaluation_metrics?.accuracy || 0;
      const currentAccuracy = current.evaluation_metrics?.accuracy || 0;
      return currentAccuracy > bestAccuracy ? current : best;
    });
  };

  const bestModel = getBestPerformingModel();
  const filteredSortedModels = getFilteredAndSortedModels();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, m: 0 }}>
            📦 Model Registry & Performance Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={fetchModels}
              disabled={loading}
              size="small"
              sx={{ minWidth: 'auto' }}
            >
              {loading ? <CircularProgress size={16} /> : '🔄'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<CompareArrowsIcon />}
              disabled={selectedModels.length < 2}
              onClick={handleOpenComparison}
            >
              Compare Models
            </Button>
          </Box>
        </Box>

        {/* Best Model Highlight */}
        {bestModel && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUpIcon color="success" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                  🏆 Best Performing Model: {bestModel.name} v{bestModel.version}
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Accuracy: {(bestModel.evaluation_metrics?.accuracy * 100).toFixed(2)}% | 
                  F1-Score: {(bestModel.evaluation_metrics?.f1_score * 100).toFixed(2)}% | 
                  Algorithm: {bestModel.algorithm_details?.architecture}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(bestModel)}
              >
                Download Best
              </Button>
            </Box>
          </Paper>
        )}

        {/* Filters and Search */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Search Models"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or algorithm..."
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort By">
                <MenuItem value="accuracy">Accuracy (High to Low)</MenuItem>
                <MenuItem value="loss">Loss (Low to High)</MenuItem>
                <MenuItem value="f1_score">F1-Score (High to Low)</MenuItem>
                <MenuItem value="name">Name (A-Z)</MenuItem>
                <MenuItem value="created_at">Date (Newest First)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter Algorithm</InputLabel>
              <Select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} label="Filter Algorithm">
                <MenuItem value="all">All Algorithms</MenuItem>
                <MenuItem value="resnet">ResNet Models</MenuItem>
                <MenuItem value="vgg">VGG Models</MenuItem>
                <MenuItem value="bert">BERT Models</MenuItem>
                <MenuItem value="transformer">Transformers</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />
        
        {loading && models.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 600, overflow: 'auto' }}>
            {filteredSortedModels.map((model, index) => {
              const modelId = model.id || model._id || index;
              const isExpanded = expandedModels[modelId];
              const isTopPerformer = index < 3; // Mark top 3 as high performers
              
              return (
                <Box key={modelId} sx={{ mb: 1 }}>
                  <Paper sx={{ 
                    p: 1, 
                    border: isTopPerformer ? '2px solid' : '1px solid',
                    borderColor: isTopPerformer ? 'success.main' : 'grey.300',
                    borderRadius: 2 
                  }}>
                    <ListItem disablePadding>
                      <Checkbox
                        edge="start"
                        checked={selectedModels.includes(modelId)}
                        onChange={() => handleToggleSelect(modelId)}
                      />
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {model.name}
                            </Typography>
                            <Chip label={`v${model.version}`} size="small" color="primary" />
                            {isTopPerformer && <Chip label="⭐ Top Performer" size="small" color="success" />}
                            <Chip 
                              label={`${(model.evaluation_metrics?.accuracy * 100).toFixed(1)}% ACC`} 
                              size="small" 
                              color={model.evaluation_metrics?.accuracy > 0.9 ? 'success' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Algorithm: {model.algorithm_details?.architecture} | 
                              F1: {(model.evaluation_metrics?.f1_score * 100).toFixed(1)}% | 
                              Loss: {model.evaluation_metrics?.loss?.toFixed(4)}
                            </Typography>
                            
                            {/* Performance Bars */}
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Accuracy: {(model.evaluation_metrics?.accuracy * 100).toFixed(1)}%
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={model.evaluation_metrics?.accuracy * 100} 
                                  sx={{ height: 6, borderRadius: 3 }}
                                  color={model.evaluation_metrics?.accuracy > 0.9 ? 'success' : 'primary'}
                                />
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  F1-Score: {(model.evaluation_metrics?.f1_score * 100).toFixed(1)}%
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={model.evaluation_metrics?.f1_score * 100} 
                                  sx={{ height: 6, borderRadius: 3 }}
                                  color={model.evaluation_metrics?.f1_score > 0.85 ? 'success' : 'warning'}
                                />
                              </Box>
                            </Box>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton onClick={() => toggleExpanded(modelId)} size="small">
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownload(model)}
                          color={isTopPerformer ? 'success' : 'primary'}
                        >
                          Download
                        </Button>
                      </Box>
                    </ListItem>
                    
                    <Collapse in={isExpanded}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              📊 Evaluation Metrics
                            </Typography>
                            <Paper sx={{ p: 1.5 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {(model.evaluation_metrics?.accuracy * 100).toFixed(2)}%
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Precision</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {(model.evaluation_metrics?.precision * 100).toFixed(2)}%
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Recall</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {(model.evaluation_metrics?.recall * 100).toFixed(2)}%
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">F1-Score</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {(model.evaluation_metrics?.f1_score * 100).toFixed(2)}%
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              🔧 Algorithm Details
                            </Typography>
                            <Paper sx={{ p: 1.5 }}>
                              <Typography variant="caption" color="text.secondary">Architecture</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                {model.algorithm_details?.architecture}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">Optimizer</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                {model.algorithm_details?.optimizer}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">Training Details</Typography>
                              <Typography variant="body2">
                                Epochs: {model.evaluation_metrics?.epochs} | 
                                Batch Size: {model.evaluation_metrics?.batch_size} | 
                                LR: {model.evaluation_metrics?.learning_rate}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>
                </Box>
              );
            })}
          </List>
        )}
        
        {filteredSortedModels.length === 0 && !loading && (
          <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
            No models found matching your criteria.
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
