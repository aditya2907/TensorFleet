import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { monoFontFamily } from '../theme/typography';

const STATUS_CHIP_COLOR = {
  RUNNING: 'info',
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
};

const getStatusColor = (status) => STATUS_CHIP_COLOR[status?.toUpperCase()] || 'default';

const SectionHeader = ({ action }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
    <HistoryIcon fontSize="small" color="primary" />
    <Typography variant="h6" sx={{ flexGrow: 1 }}>
      Jobs
    </Typography>
    {action}
  </Box>
);

const JobsListPanel = ({ jobs, onSelectJob, selectedJobId }) => {
  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent>
          <SectionHeader />
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No jobs yet — submit your first training job to get started
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <SectionHeader action={<Chip size="small" color="primary" label={`${jobs.length} total`} />} />
        <List sx={{ maxHeight: 600, overflow: 'auto' }} disablePadding>
          {jobs.slice(0, 10).map((job, index) => (
            <ListItem key={job.job_id || index} disablePadding>
              <ListItemButton
                onClick={() => onSelectJob(job.job_id)}
                selected={selectedJobId === job.job_id}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemText
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {job.model_type || 'Unknown Model'}
                      </Typography>
                      <Chip
                        label={job.status || 'UNKNOWN'}
                        size="small"
                        color={getStatusColor(job.status)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        component="div"
                        color="text.secondary"
                        noWrap
                        sx={{ fontFamily: monoFontFamily }}
                      >
                        {job.job_id}
                      </Typography>
                      {job.progress !== undefined && (
                        <Typography variant="caption" color="text.secondary">
                          Progress: {job.progress}%
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default JobsListPanel;
