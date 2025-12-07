# TensorFleet Frontend

Modern React + Vite frontend for the TensorFleet distributed ML training platform.

## Features

- ⚡ Built with Vite for fast development
- 🎨 Material-UI components and theming
- 📊 Real-time metrics dashboard
- 🚀 Job submission and monitoring
- 📱 Responsive design
- 🔄 Auto-refresh capabilities

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **Recharts** - Data visualization

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Docker

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

### Theme

Edit `src/theme.js` to customize colors, typography, and component styles.

### Components

All components are in `src/components/` and follow Material-UI best practices.

## License

Part of the TensorFleet project.
