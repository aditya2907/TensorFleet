import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  IconButton,
  CircularProgress,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Storage as StorageIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { storageAPI } from '../api/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`storage-tabpanel-${index}`}
      aria-labelledby={`storage-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StorageOverviewPanel = ({ onNotification }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [jobFiles, setJobFiles] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchStorageStats = async () => {
    try {
      const response = await storageAPI.getStorageStats();
      setStorageStats(response.data);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    }
  };

  const fetchBucketData = async () => {
    try {
      setLoading(true);
      const [datasetsRes, modelsRes, checkpointsRes, artifactsRes, jobsRes] = await Promise.all([
        storageAPI.listDatasets(),
        storageAPI.listModels(),
        storageAPI.listCheckpoints(),
        storageAPI.listArtifacts(),
        storageAPI.listJobFiles(),
      ]);
      
      setDatasets(datasetsRes.data.objects || []);
      setModels(modelsRes.data.objects || []);
      setCheckpoints(checkpointsRes.data.objects || []);
      setArtifacts(artifactsRes.data.objects || []);
      setJobFiles(jobsRes.data.objects || []);
    } catch (error) {
      console.error('Error fetching bucket data:', error);
      onNotification({
        open: true,
        message: `Failed to load storage data: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageStats();
    fetchBucketData();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStorageStats();
      fetchBucketData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUpload = (bucket) => async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      let uploadPromise;
      switch (bucket) {
        case 'datasets':
          uploadPromise = storageAPI.uploadDataset(file, (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          });
          break;
        case 'models':
          const modelPath = `${file.name.split('.')[0]}/${file.name}`;
          uploadPromise = storageAPI.uploadModel(file, modelPath, (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          });
          break;
        default:
          throw new Error(`Upload not supported for ${bucket} bucket`);
      }
      
      await uploadPromise;
      onNotification({
        open: true,
        message: `File uploaded to ${bucket} successfully!`,
        severity: 'success',
      });
      fetchBucketData();
      fetchStorageStats();
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

  const handleDelete = (bucket, objectName) => async () => {
    try {
      switch (bucket) {
        case 'datasets':
          await storageAPI.deleteDataset(objectName);
          break;
        case 'models':
          await storageAPI.deleteModel(objectName);
          break;
        case 'checkpoints':
          await storageAPI.deleteCheckpoint(objectName);
          break;
        case 'artifacts':
          await storageAPI.deleteArtifact(objectName);
          break;
        case 'jobs':
          await storageAPI.deleteJobFile(objectName);
          break;
        default:
          throw new Error(`Delete not supported for ${bucket} bucket`);
      }
      
      onNotification({
        open: true,
        message: `Deleted from ${bucket} successfully!`,
        severity: 'info',
      });
      fetchBucketData();
      fetchStorageStats();
    } catch (error) {
      onNotification({
        open: true,
        message: `Failed to delete: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderFileList = (files, bucket, canUpload = false, canDelete = true) => (
    <Box>
      {canUpload && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={uploading}
            fullWidth
          >
            Upload to {bucket}
            <input type="file" hidden onChange={handleUpload(bucket)} />
          </Button>
          {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />}
        </Box>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {files.map((file) => (
            <ListItem
              key={file.name}
              secondaryAction={
                canDelete && (
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={handleDelete(bucket, file.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      Size: {formatFileSize(file.size)}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Modified: {formatDate(file.last_modified)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      
      {files.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No files found in {bucket} bucket.
        </Alert>
      )}
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            💾 Storage Overview
          </Typography>
          <IconButton onClick={() => { fetchStorageStats(); fetchBucketData(); }}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Storage Statistics */}
        {storageStats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'primary.lighter' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Storage Summary
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(storageStats.buckets || {}).map(([bucket, stats]) => (
                    <Grid item xs={6} sm={4} md={2.4} key={bucket}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {stats.object_count}
                        </Typography>
                        <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                          {bucket}
                        </Typography>
                        <Typography variant="caption" display="block" color="textSecondary">
                          {formatFileSize(stats.total_size_bytes)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label={`Datasets (${datasets.length})`} />
          <Tab label={`Models (${models.length})`} />
          <Tab label={`Checkpoints (${checkpoints.length})`} />
          <Tab label={`Artifacts (${artifacts.length})`} />
          <Tab label={`Job Files (${jobFiles.length})`} />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {renderFileList(datasets, 'datasets', true, true)}
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          {renderFileList(models, 'models', true, true)}
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          {renderFileList(checkpoints, 'checkpoints', false, true)}
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          {renderFileList(artifacts, 'artifacts', false, true)}
        </TabPanel>
        
        <TabPanel value={activeTab} index={4}>
          {renderFileList(jobFiles, 'jobs', false, true)}
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default StorageOverviewPanel;
