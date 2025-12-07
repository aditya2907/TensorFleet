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
  Divider,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

const JobsListPanel = ({ jobs, onSelectJob, selectedJobId }) => {
  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            📋 Recent Jobs
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              No jobs yet
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'CANCELLED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          📋 Recent Jobs
        </Typography>
        <Divider sx={{ mb: 1 }} />

        <List sx={{ maxHeight: 600, overflow: 'auto' }}>
          {jobs.slice(0, 10).map((job, index) => (
            <React.Fragment key={job.job_id || index}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => onSelectJob(job.job_id)}
                  selected={selectedJobId === job.job_id}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.lighter',
                      '&:hover': {
                        bgcolor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {job.model_type || 'Unknown Model'}
                        </Typography>
                        <Chip
                          label={job.status || 'UNKNOWN'}
                          size="small"
                          color={getStatusColor(job.status)}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="caption"
                          component="div"
                          color="textSecondary"
                          noWrap
                          sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                        >
                          {job.job_id}
                        </Typography>
                        {job.progress !== undefined && (
                          <Typography variant="caption" color="textSecondary">
                            Progress: {job.progress}%
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>

        {jobs.length === 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
            No recent jobs
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default JobsListPanel;
