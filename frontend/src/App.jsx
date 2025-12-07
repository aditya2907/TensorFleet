import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  AppBar,
  Toolbar,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DashboardMetrics from './components/DashboardMetrics';
import JobSubmissionForm from './components/JobSubmissionForm';
import JobDetailsPanel from './components/JobDetailsPanel';
import JobsListPanel from './components/JobsListPanel';
import { jobsAPI, monitoringAPI } from './api/api';

function App() {
  const [metrics, setMetrics] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(false);

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
      const response = await jobsAPI.listJobs();
      setRecentJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  // Submit new job
  const handleSubmitJob = async (jobData) => {
    setLoading(true);
    try {
      const response = await jobsAPI.submitJob(jobData);
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

  // Auto-refresh metrics
  useEffect(() => {
    fetchMetrics();
    fetchRecentJobs();
    
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
      }, 3000);

      return () => clearInterval(jobInterval);
    }
  }, [selectedJob?.job_id]);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <RocketLaunchIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            TensorFleet
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Distributed ML Training Platform
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Metrics Dashboard */}
        <Box sx={{ mb: 4 }}>
          <DashboardMetrics metrics={metrics} />
        </Box>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Column - Job Submission */}
          <Grid item xs={12} md={4}>
            <JobSubmissionForm onSubmit={handleSubmitJob} loading={loading} />
          </Grid>

          {/* Middle Column - Job Details */}
          <Grid item xs={12} md={4}>
            <JobDetailsPanel
              job={selectedJob}
              onRefresh={handleRefreshJob}
              onCancel={handleCancelJob}
            />
          </Grid>

          {/* Right Column - Recent Jobs */}
          <Grid item xs={12} md={4}>
            <JobsListPanel
              jobs={recentJobs}
              onSelectJob={handleSelectJob}
              selectedJobId={selectedJob?.job_id}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
