import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const MONITORING_URL = import.meta.env.VITE_MONITORING_URL || 'http://localhost:8082';
const MODEL_SERVICE_URL = import.meta.env.VITE_MODEL_SERVICE_URL || 'http://localhost:8083';
const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8081';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-User-ID': 'tensorfleet-user',
    'Authorization': 'Bearer demo-token', // For demo purposes
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  // In a real app, you'd get the token from localStorage or similar
  const token = localStorage.getItem('authToken') || 'demo-token';
  config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle authentication error
      console.warn('Authentication failed, using demo token');
    }
    return Promise.reject(error);
  }
);

const monitoringClient = axios.create({
  baseURL: MONITORING_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const modelServiceClient = axios.create({
  baseURL: MODEL_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const storageClient = axios.create({
  baseURL: STORAGE_URL,
});

// Job API
export const jobsAPI = {
  submitJob: (jobData) => apiClient.post('/api/v1/jobs', jobData),
  getJobStatus: (jobId) => apiClient.get(`/api/v1/jobs/${jobId}`),
  listJobs: () => apiClient.get('/api/v1/jobs'),
  cancelJob: (jobId) => apiClient.delete(`/api/v1/jobs/${jobId}`),
};

// Model Service API
export const modelServiceAPI = {
  listModels: (params) => modelServiceClient.get('/api/v1/models', { params }),
  getModel: (modelId) => modelServiceClient.get(`/api/v1/models/${modelId}`),
  downloadModel: (modelId) => modelServiceClient.get(`/api/v1/models/${modelId}/download`, { responseType: 'blob' }),
};

// Storage API
export const storageAPI = {
  // Datasets
  listDatasets: () => storageClient.get('/api/v1/list/datasets'),
  uploadDataset: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return storageClient.post(`/api/v1/upload/datasets/${file.name}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  deleteDataset: (objectName) => storageClient.delete(`/api/v1/delete/datasets/${objectName}`),
  
  // Models
  listModels: () => storageClient.get('/api/v1/list/models'),
  uploadModel: (file, modelPath, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return storageClient.post(`/api/v1/upload/models/${modelPath}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  deleteModel: (objectName) => storageClient.delete(`/api/v1/delete/models/${objectName}`),
  
  // Checkpoints
  listCheckpoints: () => storageClient.get('/api/v1/list/checkpoints'),
  deleteCheckpoint: (objectName) => storageClient.delete(`/api/v1/delete/checkpoints/${objectName}`),
  
  // Artifacts
  listArtifacts: () => storageClient.get('/api/v1/list/artifacts'),
  deleteArtifact: (objectName) => storageClient.delete(`/api/v1/delete/artifacts/${objectName}`),
  
  // Jobs
  listJobFiles: () => storageClient.get('/api/v1/list/jobs'),
  deleteJobFile: (objectName) => storageClient.delete(`/api/v1/delete/jobs/${objectName}`),
  
  // General storage operations
  getStorageStats: () => storageClient.get('/api/v1/storage/stats'),
  getBuckets: () => storageClient.get('/api/v1/buckets'),
  
  // Database operations for metadata
  createModel: (modelData) => storageClient.post('/api/v1/models', modelData),
  getModels: () => storageClient.get('/api/v1/models'),
  getModel: (modelId) => storageClient.get(`/api/v1/models/${modelId}`, { responseType: 'blob' }),
  downloadModel: (modelId) => storageClient.get(`/api/v1/models/${modelId}`, { responseType: 'blob' }),
  
  createJob: (jobData) => storageClient.post('/api/v1/jobs', jobData),
  getJobs: () => storageClient.get('/api/v1/jobs'),
  getJob: (jobId) => storageClient.get(`/api/v1/jobs/${jobId}`),
  updateJob: (jobId, jobData) => storageClient.put(`/api/v1/jobs/${jobId}`, jobData),
  getRecentJobs: (limit = 50) => storageClient.get(`/api/v1/jobs/recent?limit=${limit}`),
  
  createDataset: (datasetData) => storageClient.post('/api/v1/datasets', datasetData),
  getDatasets: () => storageClient.get('/api/v1/datasets'),
  
  createCheckpoint: (checkpointData) => storageClient.post('/api/v1/checkpoints', checkpointData),
  getCheckpoints: (jobId) => storageClient.get(`/api/v1/checkpoints/${jobId}`),
  
  createArtifact: (artifactData) => storageClient.post('/api/v1/artifacts', artifactData),
  getArtifacts: (jobId) => storageClient.get(`/api/v1/artifacts/${jobId}`),
  
  // Automatic model saving for job completion
  autoSaveModel: (jobId) => storageClient.post(`/api/v1/jobs/${jobId}/auto-save-model`),
};

// Monitoring API
export const monitoringAPI = {
  getDashboard: () => monitoringClient.get('/api/v1/dashboard'),
  getJobMetrics: () => monitoringClient.get('/api/v1/metrics/jobs'),
  getWorkerMetrics: () => monitoringClient.get('/api/v1/metrics/workers'),
  getJobDetails: (jobId) => monitoringClient.get(`/api/v1/metrics/jobs/${jobId}`),
  getWorkerActivity: () => apiClient.get('/worker-activity'),
};

// Health Check API
export const healthAPI = {
  checkAPIGateway: () => apiClient.get('/health'),
  checkMonitoring: () => monitoringClient.get('/health'),
};

export { apiClient, monitoringClient };
