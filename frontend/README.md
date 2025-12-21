# 🎨 TensorFleet Frontend

Modern, responsive React dashboard for managing and monitoring distributed ML training jobs in the TensorFleet platform. Built with **Vite**, **Material-UI v5**, and advanced data visualization with semantic model registry and enhanced UX.

## 🚀 Overview

The TensorFleet frontend provides an intuitive, professional web interface for ML engineers and data scientists to submit training jobs, monitor distributed workers, track job progress, and manage model registry with clean semantic naming. Features real-time updates, MongoDB Atlas integration, and enhanced model comparison capabilities.

## ✨ Key Features

### 🎯 **Enhanced Job Management**
- **Smart Job Submission**: Multi-algorithm support with parameter validation
- **Real-time Progress**: Live training metrics with loss/accuracy visualization  
- **Job Comparison**: Side-by-side performance analysis

### 📦 **Semantic Model Registry**
- **Clean Model Names**: Display names like `RandomForest_95.2%_Dec16` instead of UUIDs
- **Model Comparison**: Interactive model performance comparison
- **Smart Search**: Search by algorithm, performance, or semantic names
- **Download Management**: Clean filenames for model artifacts

### 📊 **Advanced Monitoring**
- **Real-time Dashboard**: Live worker activity and resource monitoring
- **Performance Analytics**: Interactive charts with Recharts integration
- **Auto-scaling Visualization**: Dynamic worker scaling indicators
- **Health Monitoring**: Service health checks with status indicators

### 🎨 **Modern UX/UI**
- **Material-UI v5**: Latest design system with enhanced theming
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: User preference-based theme switching
- **Progressive Loading**: Skeleton loaders and optimized performance

## 🏗️ Architecture

```
┌─────────────────┐     HTTP/REST     ┌──────────────────┐
│     Frontend    │◄─────────────────►│   API Gateway    │
│   (React/Vite)  │                   │   (Port 8080)    │
└─────────────────┘                   └──────────────────┘
         │
         ▼ Served by
┌─────────────────┐
│  Nginx Server   │
│  (Port 3000)    │
└─────────────────┘
```

## 🛠️ Technology Stack

### Core Technologies
- **React 18**: Modern React with hooks and concurrent features
- **Vite**: Next-generation frontend build tool
- **TypeScript**: Type-safe JavaScript development
- **Material-UI v5**: Google's Material Design components
- **Axios**: HTTP client for API communication

### Visualization & UI
- **Recharts**: Powerful charting library for training metrics
- **Material Icons**: Comprehensive icon library
- **React Router**: Client-side routing
- **Framer Motion**: Smooth animations and transitions

### Development Tools
- **ESLint**: Code linting and quality checks
- **Prettier**: Code formatting
- **Vite DevServer**: Hot module replacement
- **React DevTools**: Browser debugging extensions

## 📦 Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── favicon.ico
│   └── manifest.json
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── Dashboard.jsx
│   │   ├── JobForm.jsx
│   │   ├── WorkerVisualization.jsx
│   │   └── MetricsChart.jsx
│   ├── api/              # API integration
│   │   └── api.js
│   ├── styles/           # CSS and themes
│   │   └── theme.js
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main application
│   └── main.jsx          # Entry point
├── Dockerfile            # Container configuration
├── nginx.conf            # Nginx configuration
├── package.json          # Dependencies
└── vite.config.js        # Vite configuration
```

## 🚀 Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8+ (or yarn/pnpm)
- **Docker**: For containerized development

### Local Development

```bash
# Clone and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Application available at http://localhost:3000
```

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for environment-specific settings:

```bash
# API Gateway endpoint
VITE_API_BASE_URL=http://localhost:8080

# WebSocket endpoint for real-time updates  
VITE_WS_URL=ws://localhost:8080/ws

# Update intervals
VITE_REFRESH_INTERVAL=2000

# Feature flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_NOTIFICATIONS=true
```

### API Integration

```javascript
// src/api/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Job management API
export const jobAPI = {
  submitJob: (jobData) => api.post('/api/v1/jobs', jobData),
  getJobs: () => api.get('/api/v1/jobs'),
  getJob: (id) => api.get(`/api/v1/jobs/${id}`),
  deleteJob: (id) => api.delete(`/api/v1/jobs/${id}`),
};

// Worker monitoring API
export const monitoringAPI = {
  getWorkerActivity: () => api.get('/worker-activity'),
  getSystemHealth: () => api.get('/health'),
};
```

## 🎨 Component Architecture

### Main Components

#### Dashboard Component
```jsx
// Main dashboard with job overview and metrics
const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  
  useEffect(() => {
    fetchJobsAndWorkers();
    const interval = setInterval(fetchJobsAndWorkers, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <JobManagement jobs={jobs} />
      </Grid>
      <Grid item xs={12} md={4}>
        <WorkerStatus workers={workers} />
      </Grid>
    </Grid>
  );
};
```

#### WorkerVisualization Component
```jsx
// Real-time worker activity monitoring
const WorkerVisualization = () => {
  const [workers, setWorkers] = useState([]);
  
  const fetchWorkerActivity = async () => {
    const response = await monitoringAPI.getWorkerActivity();
    setWorkers(response.data.workers || []);
  };

  return (
    <Grid container spacing={3}>
      {workers.map((worker) => (
        <Grid item xs={12} md={6} lg={4} key={worker.worker_id}>
          <WorkerCard worker={worker} />
        </Grid>
      ))}
    </Grid>
  );
};
```

### Real-time Updates

```javascript
// Auto-refresh hook for live data
const useAutoRefresh = (fetchFunction, interval = 2000) => {
  useEffect(() => {
    fetchFunction();
    const intervalId = setInterval(fetchFunction, interval);
    return () => clearInterval(intervalId);
  }, [fetchFunction, interval]);
};
```

## 🐳 Docker Deployment

### Multi-stage Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Using Docker

```bash
# Build image
docker build -t tensorfleet-frontend .

# Run container
docker run -p 3000:3000 \
  -e VITE_API_BASE_URL=http://api-gateway:8080 \
  tensorfleet-frontend

# With docker-compose
docker-compose up frontend
```

## 📊 Features Deep Dive

### Job Submission Interface

- **Form Validation**: Real-time validation of job parameters
- **Model Selection**: Support for various ML model types
- **Parameter Tuning**: Hyperparameter configuration interface
- **Dataset Upload**: File upload with progress tracking

### Real-time Monitoring

- **Live Worker Status**: Real-time worker health and activity
- **Resource Utilization**: CPU, memory, and task load visualization  
- **Training Progress**: Live loss/accuracy charts
- **System Health**: Overall platform status monitoring

### Interactive Visualizations

```jsx
// Training metrics chart component
const TrainingChart = ({ jobId }) => {
  const [metrics, setMetrics] = useState([]);
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={metrics}>
        <XAxis dataKey="epoch" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Line type="monotone" dataKey="loss" stroke="#f44336" />
        <Line type="monotone" dataKey="accuracy" stroke="#4caf50" />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### Build Image

```bash
docker build -t tensorfleet-frontend .
```

### Run Container

```bash
docker run -p 3000:3000 tensorfleet-frontend
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8080
VITE_MONITORING_URL=http://localhost:8082
```

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── api.js           # API client and endpoints
│   ├── components/
│   │   ├── DashboardMetrics.jsx
│   │   ├── JobSubmissionForm.jsx
│   │   ├── JobDetailsPanel.jsx
│   │   └── JobsListPanel.jsx
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── theme.js             # Material-UI theme
├── index.html
├── vite.config.js
├── package.json
└── Dockerfile
```

## Features

### Dashboard Metrics
- Total Jobs count
- Active Jobs count  
- Active Workers count
- System health status

### Job Submission
- Model type selection
- Dataset path configuration
- Worker and epoch settings
- Hyperparameter tuning

### Job Monitoring
- Real-time progress tracking
- Loss and accuracy metrics
- Task completion status
- Job cancellation

### Recent Jobs List
- Quick job selection
- Status indicators
- Job history

## API Integration

The frontend integrates with:
- **API Gateway** (port 8080) - Job management
- **Monitoring Service** (port 8082) - Metrics and health

## Customization

## 🧪 Testing

### Unit Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### E2E Testing

```bash
# Install Cypress for E2E testing
npm install --save-dev cypress

# Run E2E tests
npm run cypress:open
```

## 🚀 Production Deployment

### Build Optimization

```bash
# Production build with optimizations
npm run build

# Analyze bundle size
npm run preview -- --host 0.0.0.0
```

### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 3000;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://api-gateway:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

## 🔍 Debugging & Troubleshooting

### Common Issues

1. **API Connection Failed**
   ```bash
   # Check API Gateway connectivity
   curl http://localhost:8080/health
   
   # Verify environment variables
   echo $VITE_API_BASE_URL
   ```

2. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📚 Dependencies

### Core Dependencies
- **React 18**: Modern UI framework
- **Vite**: Fast build tool
- **Material-UI**: Component library
- **Axios**: HTTP client
- **Recharts**: Data visualization

## 🔄 Related Services

- [API Gateway](../api-gateway/README.md) - Backend API interface
- [Orchestrator](../orchestrator/README.md) - Job coordination service  
- [Worker](../worker/README.md) - Task execution nodes
- [Monitoring](../monitoring/README.md) - System metrics and health

## 👥 Development Team

**Primary Owner**: Soham Maji (25204731) - Frontend & Monitoring Lead

This service is part of the TensorFleet distributed ML platform developed by:
- Soham Maji (25204731) - Frontend & Monitoring Lead (Frontend Dashboard, Monitoring, DevOps)
- Aditya Suryawanshi (25211365) - Backend Infrastructure Lead
- Rahul Mirashi (25211365) - ML & Data Services Lead

For detailed work distribution, see [docs/TEAM_WORK_DIVISION.md](../docs/TEAM_WORK_DIVISION.md)

---

**Last Updated**: December 21, 2025  
**Version**: 2.0  
**Status**: Production Ready
