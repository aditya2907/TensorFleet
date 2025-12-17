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
      <Card sx={{ 
        background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '24px',
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              borderRadius: '12px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HistoryIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Jobs
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
              borderRadius: '50%',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2,
            }}>
              <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              No jobs yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, opacity: 0.7 }}>
              Submit your first training job to get started
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
    <Card sx={{ 
      background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: '24px',
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            borderRadius: '12px',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <HistoryIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Jobs
          </Typography>
        </Box>
      {/* {console.log(jobs)} */}
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
            No jobs found
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default JobsListPanel;
