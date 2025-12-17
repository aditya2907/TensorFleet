import React from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert 
            severity="error" 
            icon={<ErrorOutlineIcon fontSize="inherit" />}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Retry
              </Button>
            }
          >
            <div>
              <Typography component="div" variant="h6" gutterBottom>
                Something went wrong
              </Typography>
              <Typography component="div" variant="body2" sx={{ mb: 1 }}>
                {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
              </Typography>
              {process.env.NODE_ENV === 'development' && (
                <details style={{ whiteSpace: 'pre-wrap', marginTop: 8, fontSize: '0.8rem' }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </details>
              )}
            </div>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
