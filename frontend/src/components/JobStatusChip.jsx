import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';

const JobStatusChip = ({ status }) => {
  const statusColors = {
    completed: 'success',
    running: 'info',
    failed: 'error',
    pending: 'warning',
    cancelled: 'default',
  };

  return (
    <Chip
      label={status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      color={statusColors[status] || 'default'}
      size="small"
      sx={{ 
        '& .MuiChip-label': { 
          color: 'inherit' 
        } 
      }}
    />
  );
};

JobStatusChip.propTypes = {
  status: PropTypes.string.isRequired,
};

export default JobStatusChip;
