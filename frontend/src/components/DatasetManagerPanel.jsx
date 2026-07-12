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
import { storageAPI, getErrorMessage } from '../api/api';

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
        message: `Failed to load datasets: ${getErrorMessage(error)}`,
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
        errorMessage = getErrorMessage(error);
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
        message: `Delete failed: ${getErrorMessage(error)}`,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FolderOpenIcon fontSize="small" color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dataset Manager
          </Typography>
        </Box>
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
          <Box sx={{ py: 1 }}>
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} width="70%" />
          </Box>
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
            <FolderOpenIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No datasets yet — upload a CSV dataset to start training models
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
