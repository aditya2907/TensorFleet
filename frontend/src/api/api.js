import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const MONITORING_URL = import.meta.env.VITE_MONITORING_URL || 'http://localhost:8082';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-User-ID': 'tensorfleet-user',
  },
});

const monitoringClient = axios.create({
  baseURL: MONITORING_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Job API
export const jobsAPI = {
  submitJob: (jobData) => apiClient.post('/api/v1/jobs', jobData),
  getJobStatus: (jobId) => apiClient.get(`/api/v1/jobs/${jobId}`),
  listJobs: () => apiClient.get('/api/v1/jobs'),
  cancelJob: (jobId) => apiClient.delete(`/api/v1/jobs/${jobId}`),
};

// Monitoring API
export const monitoringAPI = {
  getDashboard: () => monitoringClient.get('/api/v1/dashboard'),
  getJobMetrics: () => monitoringClient.get('/api/v1/metrics/jobs'),
  getWorkerMetrics: () => monitoringClient.get('/api/v1/metrics/workers'),
  getJobDetails: (jobId) => monitoringClient.get(`/api/v1/metrics/jobs/${jobId}`),
};

// Health Check API
export const healthAPI = {
  checkAPIGateway: () => apiClient.get('/health'),
  checkMonitoring: () => monitoringClient.get('/health'),
};

export { apiClient, monitoringClient };
