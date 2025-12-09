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
import './enhanced-styles.css';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import StorageIcon from '@mui/icons-material/Storage';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import ComputerIcon from '@mui/icons-material/Computer';
import DashboardMetrics from './components/DashboardMetrics';
import JobSubmissionForm from './components/JobSubmissionForm';
import JobDetailsPanel from './components/JobDetailsPanel';
import ModelRegistryPanel from './components/ModelRegistryPanel';
import DatasetManagerPanel from './components/DatasetManagerPanel';
import StorageOverviewPanel from './components/StorageOverviewPanel';
import WorkerVisualization from './components/WorkerVisualization';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeToggle from './components/ThemeToggle';
import { jobsAPI, monitoringAPI, storageAPI } from './api/api';

const drawerWidth = 200;

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
          <Grid container spacing={4}>
            <Grid item xs={12} lg={selectedJob ? 5 : 8}>
              <ErrorBoundary>
                <JobSubmissionForm 
                  onSubmit={handleSubmitJob} 
                  loading={loading} 
                  datasets={datasets} 
                  onNotification={handleNotification}
                />
              </ErrorBoundary>
            </Grid>
            {selectedJob && (
              <Grid item xs={12} lg={7}>
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Box 
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          zIndex: -2,
        }}
      />
      <Box 
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(120, 200, 255, 0.3) 0%, transparent 50%)
          `,
          zIndex: -1,
        }}
      />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <Toolbar sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '0 0 20px 0',
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RocketLaunchIcon sx={{ mr: 2, color: 'white' }} />
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
              TensorFleet
            </Typography>
          </Box>
          <ThemeToggle sx={{ color: 'white' }} />
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
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 4,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ 
          width: '100%',
          maxWidth: 'none',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '24px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minHeight: 'calc(100vh - 120px)',
          margin: 0,
        }}>
          {renderContent()}
        </Box>
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity} 
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default App;
