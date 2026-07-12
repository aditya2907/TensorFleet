import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import DonutLargeRoundedIcon from '@mui/icons-material/DonutLargeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { monitoringAPI, storageAPI, jobsAPI } from '../api/api';
import { usePolling } from '../hooks/usePolling';

const STATUS_CHIP_COLOR = {
  RUNNING: 'info',
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
};

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, loading }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={72} height={40} />
          ) : (
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
              {value ?? '—'}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }} noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={(theme) => ({
            width: 42,
            height: 42,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backgroundColor: alpha(theme.palette[color].main, theme.palette.mode === 'dark' ? 0.16 : 0.1),
            color: theme.palette[color].main,
          })}
        >
          <Icon fontSize="small" />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const SectionCard = ({ title, icon: Icon, action, children }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Icon fontSize="small" color="primary" />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </CardContent>
  </Card>
);

// Stable, human-friendly alias for a worker UUID.
const formatWorkerId = (workerId, index) => {
  if (!workerId) return `worker-${index + 1}`;
  if (workerId.startsWith('worker-')) return workerId;
  let hash = 0;
  for (let i = 0; i < workerId.length; i += 1) {
    hash = ((hash << 5) - hash + workerId.charCodeAt(i)) | 0;
  }
  return `worker-${(Math.abs(hash) % 100) + 1}`;
};

const DashboardMetrics = () => {
  const [workerActivity, setWorkerActivity] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchWorkerActivity = async () => {
    try {
      const response = await monitoringAPI.getWorkerActivity();
      setWorkerActivity(response.data.workers || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching worker activity:', error);
    }
  };

  const fetchStorageStats = async () => {
    try {
      const response = await storageAPI.getStorageStats();
      setStorageStats(response.data);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const response = await jobsAPI.listJobs();
      setRecentJobs(response.data.jobs || []);
    } catch (apiError) {
      try {
        const storageResponse = await storageAPI.getRecentJobs(50);
        setRecentJobs(storageResponse.data.jobs || []);
      } catch (storageError) {
        console.error('Error fetching recent jobs:', storageError);
      }
    }
  };

  usePolling(fetchWorkerActivity, 5000);
  usePolling(fetchRecentJobs, 5000);
  usePolling(fetchStorageStats, 15000);

  const loading = lastUpdate === null;
  const busyWorkers = workerActivity.filter((w) => w.status === 'BUSY').length;
  const idleWorkers = workerActivity.filter((w) => w.status === 'IDLE').length;
  const activeWorkers = busyWorkers + idleWorkers;
  const activeJobs = recentJobs.filter((j) => j.status === 'RUNNING' || j.status === 'PENDING').length;
  const completedJobs = recentJobs.filter((j) => j.status === 'COMPLETED').length;
  const totalJobs = recentJobs.length;
  const completionRate = totalJobs > 0 ? Math.round(((totalJobs - activeJobs) / totalJobs) * 100) : 0;

  const systemStatus = activeWorkers > 0 ? 'Healthy' : totalJobs > 0 ? 'Degraded' : 'Idle';
  const systemColor = activeWorkers > 0 ? 'success' : totalJobs > 0 ? 'warning' : 'info';

  return (
    <Box>
      {/* Live status strip */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5, flexWrap: 'wrap' }}>
        <Box
          sx={(theme) => ({
            width: 9,
            height: 9,
            borderRadius: '50%',
            backgroundColor: loading ? theme.palette.warning.main : theme.palette.success.main,
            animation: 'pulse 2.5s ease-in-out infinite',
          })}
        />
        <Typography variant="body2" color="text.secondary">
          {loading
            ? 'Connecting to fleet…'
            : `Live · updated ${lastUpdate.toLocaleTimeString()} · auto-refreshes every 5s`}
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Primary metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Jobs"
            value={totalJobs}
            icon={WorkOutlineRoundedIcon}
            color="primary"
            subtitle={`${completedJobs} completed`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={activeJobs}
            icon={BoltRoundedIcon}
            color="info"
            subtitle={activeJobs > 0 ? 'Currently processing' : 'Queue is clear'}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Workers Online"
            value={activeWorkers}
            icon={MemoryRoundedIcon}
            color="secondary"
            subtitle={`${busyWorkers} busy · ${idleWorkers} idle`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Status"
            value={systemStatus}
            icon={MonitorHeartRoundedIcon}
            color={systemColor}
            subtitle={activeWorkers > 0 ? `${activeWorkers} workers reporting` : 'No workers active'}
            loading={loading}
          />
        </Grid>

        {/* Secondary metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Storage Buckets"
            value={storageStats ? storageStats.total_buckets ?? 0 : undefined}
            icon={DnsRoundedIcon}
            color="warning"
            subtitle={
              storageStats
                ? `${storageStats.total_objects ?? 0} objects · ${storageStats.total_size_mb ?? 0} MB`
                : 'Loading storage stats…'
            }
            loading={loading && !storageStats}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Saved Models"
            value={completedJobs}
            icon={Inventory2RoundedIcon}
            color="secondary"
            subtitle="Auto-saved on job completion"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Completion Rate
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
                    {completionRate}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={completionRate}
                    color="success"
                    sx={{ mt: 1.5 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    {totalJobs - activeJobs} of {totalJobs} jobs finished
                  </Typography>
                </Box>
                <Box
                  sx={(theme) => ({
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.16 : 0.1),
                    color: theme.palette.success.main,
                  })}
                >
                  <DonutLargeRoundedIcon fontSize="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live activity */}
        <Grid item xs={12} md={6}>
          <SectionCard
            title="Worker Activity"
            icon={MemoryRoundedIcon}
            action={<Chip size="small" color="primary" label={`${workerActivity.length} workers`} />}
          >
            <List dense disablePadding>
              {workerActivity.slice(0, 6).map((worker, index) => (
                <ListItem key={worker.worker_id || index} disableGutters divider={index < Math.min(workerActivity.length, 6) - 1}>
                  <Avatar
                    sx={(theme) => ({
                      width: 30,
                      height: 30,
                      mr: 1.5,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: alpha(
                        worker.status === 'BUSY' ? theme.palette.success.main : theme.palette.grey[500],
                        theme.palette.mode === 'dark' ? 0.2 : 0.12,
                      ),
                      color: worker.status === 'BUSY' ? theme.palette.success.main : theme.palette.text.secondary,
                    })}
                  >
                    {formatWorkerId(worker.worker_id, index).replace('worker-', 'W')}
                  </Avatar>
                  <ListItemText
                    primary={formatWorkerId(worker.worker_id, index)}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.8438rem' }}
                    secondary={
                      worker.current_task_id
                        ? `Task ${worker.current_task_id} · ${worker.tasks_completed || 0} completed`
                        : `${worker.tasks_completed || 0} tasks completed`
                    }
                  />
                  <Chip
                    size="small"
                    label={worker.status || 'UNKNOWN'}
                    color={worker.status === 'BUSY' ? 'success' : 'default'}
                  />
                </ListItem>
              ))}
              {workerActivity.length === 0 && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="No active workers"
                    secondary="Waiting for worker registration…"
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              )}
            </List>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard
            title="Recent Jobs"
            icon={TrendingUpRoundedIcon}
            action={<Chip size="small" color="secondary" label="Live" />}
          >
            <List dense disablePadding>
              {recentJobs.slice(0, 6).map((job, index) => (
                <ListItem key={job.job_id || index} disableGutters divider={index < Math.min(recentJobs.length, 6) - 1}>
                  <ListItemText
                    primary={job.job_name || job.job_id || `Job ${index + 1}`}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.8438rem', noWrap: true }}
                    secondary={
                      <Stack direction="row" spacing={1} component="span" sx={{ alignItems: 'center' }}>
                        <span>{job.model_type || 'Unknown type'}</span>
                        {job.created_at && <span>· {new Date(job.created_at).toLocaleTimeString()}</span>}
                      </Stack>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                  <Chip
                    size="small"
                    label={job.status || 'UNKNOWN'}
                    color={STATUS_CHIP_COLOR[job.status] || 'default'}
                  />
                </ListItem>
              ))}
              {recentJobs.length === 0 && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="No recent jobs"
                    secondary="Submit a training job to see activity here"
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              )}
            </List>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardMetrics;
