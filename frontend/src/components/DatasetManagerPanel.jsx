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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, FolderOpen as FolderOpenIcon } from '@mui/icons-material';
import { storageAPI } from '../api/api';

const DatasetManagerPanel = ({ onNotification, onDatasetChange }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState(null);

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
      let errorMessage = 'Upload failed';
      if (error.response?.status === 413) {
        errorMessage = 'File is too large. Maximum size is 100MB.';
      } else if (error.response?.status === 415) {
        errorMessage = 'Unsupported file type. Please upload CSV files only.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred during upload';
      }
      onNotification({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (objectName) => {
    setDatasetToDelete(objectName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!datasetToDelete) return;
    
    try {
      await storageAPI.deleteDataset(datasetToDelete);
      onNotification({
        open: true,
        message: 'Dataset deleted successfully!',
        severity: 'success',
      });
      fetchDatasets();
    } catch (error) {
      onNotification({
        open: true,
        message: `Delete failed: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDatasetToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDatasetToDelete(null);
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
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(ds.name)}>
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
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <FolderOpenIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Datasets Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV dataset to start training models
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Dataset?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete "{datasetToDelete}"? This action cannot be undone.
            Any training jobs using this dataset may fail.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default DatasetManagerPanel;
