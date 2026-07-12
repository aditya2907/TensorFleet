import React, { useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import DashboardMetrics from './components/DashboardMetrics';
import JobSubmissionForm from './components/JobSubmissionForm';
import JobDetailsPanel from './components/JobDetailsPanel';
import ModelRegistryPanel from './components/ModelRegistryPanel';
import DatasetManagerPanel from './components/DatasetManagerPanel';
import StorageOverviewPanel from './components/StorageOverviewPanel';
import WorkerVisualization from './components/WorkerVisualization';
import WorkerScalingControl from './components/WorkerScalingControl';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeToggle from './components/ThemeToggle';
import { jobsAPI, monitoringAPI, storageAPI, getErrorMessage } from './api/api';
import { usePolling } from './hooks/usePolling';

const DRAWER_WIDTH = 248;

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Fleet health and live activity',
    icon: <DashboardRoundedIcon fontSize="small" />,
  },
  {
    id: 'jobs',
    label: 'Training Jobs',
    description: 'Submit and track training runs',
    icon: <RocketLaunchRoundedIcon fontSize="small" />,
  },
  {
    id: 'datasets',
    label: 'Datasets',
    description: 'Upload and manage training data',
    icon: <FolderRoundedIcon fontSize="small" />,
  },
  {
    id: 'models',
    label: 'Model Registry',
    description: 'Browse and compare trained models',
    icon: <Inventory2RoundedIcon fontSize="small" />,
  },
  {
    id: 'storage',
    label: 'Storage',
    description: 'Buckets, artifacts and checkpoints',
    icon: <DnsRoundedIcon fontSize="small" />,
  },
  {
    id: 'workers',
    label: 'Workers',
    description: 'Compute fleet and scaling',
    icon: <MemoryRoundedIcon fontSize="small" />,
  },
];

function BrandMark() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2.5 }}>
      <Box
        sx={(theme) => ({
          width: 36,
          height: 36,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.gradients.brand,
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
          flexShrink: 0,
        })}
      >
        <HubRoundedIcon sx={{ color: '#fff', fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={(theme) => ({
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: theme.palette.sidebar.text,
          })}
        >
          TensorFleet
        </Typography>
        <Typography
          variant="caption"
          sx={(theme) => ({ color: theme.palette.sidebar.textMuted, lineHeight: 1 })}
        >
          ML Control Plane
        </Typography>
      </Box>
    </Box>
  );
}

function SidebarContent({ selectedView, onSelect, healthy }) {
  return (
    <Box
      sx={(theme) => ({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.sidebar.background,
      })}
    >
      <BrandMark />
      <Divider sx={(theme) => ({ borderColor: theme.palette.sidebar.border })} />
      <Typography
        variant="overline"
        sx={(theme) => ({ px: 2.5, pt: 2, pb: 0.5, color: theme.palette.sidebar.textMuted })}
      >
        Platform
      </Typography>
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const selected = selectedView === item.id;
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                onClick={() => onSelect(item.id)}
                selected={selected}
                sx={(theme) => ({
                  py: 0.9,
                  color: selected ? theme.palette.sidebar.activeText : theme.palette.sidebar.textMuted,
                  '&:hover': { backgroundColor: theme.palette.sidebar.hover },
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.sidebar.active,
                    '&:hover': { backgroundColor: theme.palette.sidebar.active },
                  },
                })}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 34 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: selected ? 600 : 500,
                    color: 'inherit',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={(theme) => ({ borderColor: theme.palette.sidebar.border })} />
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: healthy ? '#34d399' : '#fbbf24',
            boxShadow: healthy ? '0 0 6px rgba(52, 211, 153, 0.7)' : '0 0 6px rgba(251, 191, 36, 0.7)',
            animation: 'pulse 2.5s ease-in-out infinite',
          }}
        />
        <Typography variant="caption" sx={(theme) => ({ color: theme.palette.sidebar.textMuted })}>
          {healthy ? 'All systems operational' : 'Connecting to fleet…'}
        </Typography>
      </Box>
    </Box>
  );
}

function App() {
  const [metrics, setMetrics] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [selectedView, setSelectedView] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const muiTheme = useMuiTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up('lg'));

  const activeNav = useMemo(
    () => NAV_ITEMS.find((item) => item.id === selectedView) ?? NAV_ITEMS[0],
    [selectedView],
  );

  const fetchMetrics = async () => {
    try {
      const response = await monitoringAPI.getDashboard();
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const response = await storageAPI.getRecentJobs();
      setRecentJobs(response.data.jobs || []);
    } catch (error) {
      try {
        const fallbackResponse = await jobsAPI.listJobs();
        setRecentJobs(fallbackResponse.data.jobs || []);
      } catch (fallbackError) {
        console.error('Error fetching jobs:', fallbackError);
      }
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await storageAPI.listDatasets();
      setDatasets(response.data.objects || []);
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to fetch datasets: ${getErrorMessage(error)}`,
        severity: 'error',
      });
    }
  };

  const handleSubmitJob = async (jobData) => {
    setLoading(true);
    try {
      const response = await jobsAPI.submitJob(jobData);

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
        message: `Failed to submit job: ${getErrorMessage(error)}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshJob = async (jobId) => {
    try {
      const response = await jobsAPI.getJobStatus(jobId);
      setSelectedJob(response.data);
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to refresh job: ${getErrorMessage(error)}`,
        severity: 'error',
      });
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await jobsAPI.cancelJob(jobId);
      setNotification({ open: true, message: 'Job cancelled successfully', severity: 'info' });
      if (selectedJob?.job_id === jobId) {
        handleRefreshJob(jobId);
      }
      fetchRecentJobs();
      fetchMetrics();
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to cancel job: ${getErrorMessage(error)}`,
        severity: 'error',
      });
    }
  };

  const handleNotification = (next) => setNotification(next);

  // Poll fleet data; pauses automatically while the tab is hidden.
  usePolling(fetchMetrics, 5000);
  usePolling(fetchRecentJobs, 10000);
  usePolling(fetchDatasets, 60000);
  usePolling(
    () => selectedJob?.job_id && handleRefreshJob(selectedJob.job_id),
    3000,
    { enabled: Boolean(selectedJob?.job_id), immediate: false },
  );

  const handleManualRefresh = () => {
    fetchMetrics();
    fetchRecentJobs();
    fetchDatasets();
    if (selectedJob?.job_id) handleRefreshJob(selectedJob.job_id);
    setNotification({ open: true, message: 'Refreshed fleet data', severity: 'info' });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const handleSelectView = (view) => {
    setSelectedView(view);
    setMobileOpen(false);
  };

  const healthy = Boolean(metrics) || recentJobs.length > 0;

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
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={4}>
              <ErrorBoundary>
                <WorkerScalingControl />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} lg={8}>
              <ErrorBoundary>
                <WorkerVisualization />
              </ErrorBoundary>
            </Grid>
          </Grid>
        );
      default:
        return <Typography>Select a view</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />

      <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
            },
          }}
        >
          <SidebarContent selectedView={selectedView} onSelect={handleSelectView} healthy={healthy} />
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer - 1 }}>
          <Toolbar sx={{ gap: 1.5 }}>
            {!isDesktop && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="h5" noWrap sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                {activeNav.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {activeNav.description}
              </Typography>
            </Box>
            <Chip
              size="small"
              color={healthy ? 'success' : 'warning'}
              label={healthy ? 'Live' : 'Connecting…'}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            />
            <Tooltip title="Refresh data">
              <IconButton onClick={handleManualRefresh} aria-label="Refresh data">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <ThemeToggle />
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1440, width: '100%', mx: 'auto' }}>
          {renderContent()}
        </Box>

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
