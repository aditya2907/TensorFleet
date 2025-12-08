import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Chip, Alert } from '@mui/material';

const LogViewer = ({ jobId }) => {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const logContainerRef = useRef(null);
  const eventSourceRef = useRef(null);
  const streamEndedRef = useRef(false);

  useEffect(() => {
    if (jobId) {
      setLogs([]); // Clear previous logs
      setIsConnected(false);
      setError(null);
      streamEndedRef.current = false;
      
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `${import.meta.env.VITE_API_URL}/api/v1/jobs/${jobId}/logs`;
      
      // First, check if the job exists
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/jobs/${jobId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Job not found');
          }
          return res.json();
        })
        .then(() => {
          // Job exists, start SSE connection
          const es = new EventSource(url);
          eventSourceRef.current = es;

          es.onopen = () => {
            setIsConnected(true);
            console.log('SSE connection opened');
          };

          es.onmessage = (event) => {
            // console.log('Received log:', event.data);
            const logMessage = event.data;
            setLogs((prevLogs) => [...prevLogs, logMessage]);
            
            // Check if this is a terminal log message (job ended)
            const lowerLog = logMessage.toLowerCase();
            if (lowerLog.includes('cancelled') || 
                lowerLog.includes('completed') || 
                lowerLog.includes('failed')) {
              streamEndedRef.current = true;
            }
          };

          es.onerror = (errorEvent) => {
            setIsConnected(false);
            
            // If we already received a terminal message, this is expected closure
            if (streamEndedRef.current) {
              console.log('SSE connection closed normally (job ended)');
              es.close();
              return;
            }
            
            // Otherwise, it's an unexpected error
            console.error('SSE error:', errorEvent);
            
            // Check readyState to determine the error type
            if (es.readyState === EventSource.CLOSED) {
              // Connection was closed by server - check if we have logs
              if (logs.length > 0) {
                // We received logs, so this might be normal termination
                console.log('SSE connection closed by server');
              } else {
                setError('Connection closed unexpectedly');
              }
            } else if (es.readyState === EventSource.CONNECTING) {
              setError('Reconnecting to log stream...');
            } else {
              setError('Error connecting to log stream');
            }
            
            // Close the connection
            es.close();
          };
        })
        .catch(err => {
          console.error('Failed to verify job:', err);
          setError(`Job not found or unavailable: ${jobId}`);
        });

      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        setIsConnected(false);
      };
    }
  }, [jobId]);

  useEffect(() => {
    // Auto-scroll to the bottom
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Real-time Logs
        </Typography>
        {jobId && (
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            size="small"
            color={isConnected ? 'success' : 'default'}
            sx={{ height: 20 }}
          />
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper
        ref={logContainerRef}
        sx={{
          height: 300,
          overflow: 'auto',
          p: 2,
          bgcolor: '#1e1e1e',
          color: '#d4d4d4',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          lineHeight: 1.6,
        }}
      >
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div 
              key={index}
              style={{
                color: log.includes('ERROR') ? '#f48771' : 
                       log.includes('WARN') ? '#d7ba7d' :
                       log.includes('INFO') ? '#4ec9b0' : '#d4d4d4'
              }}
            >
              {log}
            </div>
          ))
        ) : (
          <Typography color="textSecondary" sx={{ color: '#858585' }}>
            {jobId ? (error ? 'Unable to load logs' : 'Waiting for logs...') : 'No job selected.'}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default LogViewer;
