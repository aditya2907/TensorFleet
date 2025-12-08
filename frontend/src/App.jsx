import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Toolbar,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import StorageIcon from '@mui/icons-material/Storage';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import ComputerIcon from '@mui/icons-material/Computer';
import DashboardMetrics from './components/DashboardMetrics';
import JobSubmissionForm from './components/JobSubmissionForm';
import JobDetailsPanel from './components/JobDetailsPanel';
import JobsListPanel from './components/JobsListPanel';
import ModelRegistryPanel from './components/ModelRegistryPanel';
import DatasetManagerPanel from './components/DatasetManagerPanel';
import StorageOverviewPanel from './components/StorageOverviewPanel';
import WorkerVisualization from './components/WorkerVisualization';
import ErrorBoundary from './components/ErrorBoundary';
import { jobsAPI, monitoringAPI, storageAPI } from './api/api';

const drawerWidth = 240;

function App() {
  const [metrics, setMetrics] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [selectedView, setSelectedView] = useState('dashboard');

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    try {
      const response = await monitoringAPI.getDashboard();
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  // Fetch recent jobs
  const fetchRecentJobs = async () => {
    try {
      // Try storage API first, fallback to jobs API
      const response = await storageAPI.getRecentJobs();
      setRecentJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs from storage:', error);
      // Fallback to jobs API
      try {
        const fallbackResponse = await jobsAPI.listJobs();
        setRecentJobs(fallbackResponse.data.jobs || []);
      } catch (fallbackError) {
        console.error('Error fetching jobs from API:', fallbackError);
      }
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await storageAPI.listDatasets();
      setDatasets(response.data.objects || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setNotification({
        open: true,
        message: `Failed to fetch datasets: ${error.response?.data?.error || error.message}`,
        severity: 'error',
      });
    }
  };

  // Submit new job
  const handleSubmitJob = async (jobData) => {
    setLoading(true);
    try {
      const response = await jobsAPI.submitJob(jobData);
      
      // Also save job metadata to storage service
      try {
        await storageAPI.createJob({
          job_id: response.data.job_id,
          job_name: jobData.hyperparameters?.job_name || `Job ${response.data.job_id}`,
          description: jobData.hyperparameters?.description || '',
          model_type: jobData.model_type,
          dataset_path: jobData.dataset_path,
          hyperparameters: jobData.hyperparameters,
          status: 'RUNNING',
          created_at: new Date().toISOString(),
          total_tasks: response.data.num_tasks || 0,
        });
      } catch (storageError) {
        console.warn('Failed to save job metadata to storage:', storageError);
      }
      
      setSelectedJob(response.data);
      setNotification({
        open: true,
        message: `Job submitted successfully! Job ID: ${response.data.job_id}`,
        severity: 'success',
      });
      fetchRecentJobs();
      fetchMetrics();
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to submit job: ${error.response?.data?.error || error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh job status
  const handleRefreshJob = async (jobId) => {
    try {
      const response = await jobsAPI.getJobStatus(jobId);
      setSelectedJob(response.data);
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to refresh job: ${error.response?.data?.error || error.message}`,
        severity: 'error',
      });
    }
  };

  // Select job from list
  const handleSelectJob = async (jobId) => {
    try {
      const response = await jobsAPI.getJobStatus(jobId);
      setSelectedJob(response.data);
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to load job: ${error.response?.data?.error || error.message}`,
        severity: 'error',
      });
    }
  };

  // Cancel job
  const handleCancelJob = async (jobId) => {
    try {
      await jobsAPI.cancelJob(jobId);
      setNotification({
        open: true,
        message: 'Job cancelled successfully',
        severity: 'info',
      });
      if (selectedJob?.job_id === jobId) {
        handleRefreshJob(jobId);
      }
      fetchRecentJobs();
      fetchMetrics();
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to cancel job: ${error.response?.data?.error || error.message}`,
        severity: 'error',
      });
    }
  };

  const handleNotification = (notification) => {
    setNotification(notification);
  };

  const handleDatasetChange = (newDatasets) => {
    setDatasets(newDatasets);
  };

  // Auto-refresh metrics
  useEffect(() => {
    fetchMetrics();
    fetchRecentJobs();
    fetchDatasets();
    
    const metricsInterval = setInterval(fetchMetrics, 5000);
    const jobsInterval = setInterval(fetchRecentJobs, 10000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(jobsInterval);
    };
  }, []);

  // Auto-refresh selected job
  useEffect(() => {
    if (selectedJob?.job_id) {
      const jobInterval = setInterval(() => {
        handleRefreshJob(selectedJob.job_id);
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(jobInterval);
    }
  }, [selectedJob?.job_id]);

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const renderContent = () => {
    switch (selectedView) {
      case 'dashboard':
        return (
          <ErrorBoundary>
            <DashboardMetrics metrics={metrics} />
          </ErrorBoundary>
        );
      case 'jobs':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ErrorBoundary>
                <JobSubmissionForm 
                  onSubmit={handleSubmitJob} 
                  loading={loading} 
                  datasets={datasets} 
                  onNotification={handleNotification}
                />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} md={8}>
              <ErrorBoundary>
                <JobsListPanel
                  jobs={recentJobs}
                  onSelectJob={handleSelectJob}
                  onCancelJob={handleCancelJob}
                  selectedJobId={selectedJob?.job_id}
                />
              </ErrorBoundary>
            </Grid>
            {selectedJob && (
              <Grid item xs={12}>
                <ErrorBoundary>
                  <JobDetailsPanel
                    job={selectedJob}
                    onRefresh={handleRefreshJob}
                    onCancel={handleCancelJob}
                    onNotification={handleNotification}
                  />
                </ErrorBoundary>
              </Grid>
            )}
          </Grid>
        );
      case 'storage':
        return <StorageOverviewPanel onNotification={handleNotification} />;
      case 'datasets':
        return (
          <DatasetManagerPanel
            datasets={datasets}
            onDatasetChange={fetchDatasets}
            onNotification={handleNotification}
          />
        );
      case 'models':
        return <ModelRegistryPanel onNotification={handleNotification} />;
      case 'workers':
        return <WorkerVisualization />;
      default:
        return <Typography>Select a view</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar>
          <RocketLaunchIcon sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap>
            TensorFleet
          </Typography>
        </Toolbar>
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedView('dashboard')} selected={selectedView === 'dashboard'}>
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedView('jobs')} selected={selectedView === 'jobs'}>
                <ListItemIcon><WorkIcon /></ListItemIcon>
                <ListItemText primary="Jobs Management" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedView('storage')} selected={selectedView === 'storage'}>
                <ListItemIcon><StorageIcon /></ListItemIcon>
                <ListItemText primary="Storage Overview" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedView('datasets')} selected={selectedView === 'datasets'}>
                <ListItemIcon><StorageIcon /></ListItemIcon>
                <ListItemText primary="Datasets" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedView('models')} selected={selectedView === 'models'}>
                <ListItemIcon><ModelTrainingIcon /></ListItemIcon>
                <ListItemText primary="Model Registry" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedView('workers')} selected={selectedView === 'workers'}>
                <ListItemIcon><ComputerIcon /></ListItemIcon>
                <ListItemText primary="Worker Activity" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="xl">
          {renderContent()}
        </Container>
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default App;
