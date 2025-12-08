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
  IconButton,
  CircularProgress,
  LinearProgress,
  Alert,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { storageAPI } from '../api/api';

const DatasetManagerPanel = ({ onNotification, onDatasetChange }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await storageAPI.listDatasets();
      setDatasets(response.data.objects || []);
      onDatasetChange(response.data.objects || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      onNotification({
        open: true,
        message: `Failed to load datasets: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      await storageAPI.uploadDataset(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      onNotification({
        open: true,
        message: 'Dataset uploaded successfully!',
        severity: 'success',
      });
      fetchDatasets();
    } catch (error) {
      onNotification({
        open: true,
        message: `Upload failed: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (objectName) => {
    try {
      await storageAPI.deleteDataset(objectName);
      onNotification({
        open: true,
        message: 'Dataset deleted successfully!',
        severity: 'info',
      });
      fetchDatasets();
    } catch (error) {
      onNotification({
        open: true,
        message: `Failed to delete dataset: ${error.message}`,
        severity: 'error',
      });
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          💾 Dataset Manager
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          disabled={uploading}
          fullWidth
        >
          Upload Dataset
          <input type="file" hidden onChange={handleUpload} />
        </Button>
        {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />}
        <Divider sx={{ my: 2 }} />
        {loading ? (
          <CircularProgress />
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {datasets.map((ds) => (
              <ListItem
                key={ds.name}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(ds.name)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={ds.name} secondary={`Size: ${(ds.size / 1024).toFixed(2)} KB`} />
              </ListItem>
            ))}
          </List>
        )}
        {datasets.length === 0 && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No datasets found. Upload a dataset to get started.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DatasetManagerPanel;
