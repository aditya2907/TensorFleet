# TensorFleet Deployment Guide for Render

This guide will help you deploy TensorFleet to Render.com using Infrastructure as Code.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Render API Key**: Get from [Render Dashboard](https://dashboard.render.com/account/api-keys)

## Deployment Options

### Option 1: Blueprint Deployment (Recommended)

This deploys all services automatically using `render.yaml`.

#### Steps:

1. **Connect GitHub Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing TensorFleet

2. **Render will automatically detect `render.yaml`**
   - Review the services that will be created
   - Click "Apply" to deploy all services

3. **Set Environment Variables** (if needed)
   - MongoDB password will be auto-generated
   - MinIO password will be auto-generated
   - All service URLs will be automatically linked

4. **Wait for Deployment**
   - All services will be deployed simultaneously
   - This may take 10-15 minutes for first deployment

### Option 2: Manual Deployment

Deploy each service individually:

#### 1. Deploy MongoDB

```bash
# Create a Private Service for MongoDB
Service Type: Private Service
Name: tensorfleet-mongodb
Environment: Docker
Dockerfile Path: ./Dockerfile.mongodb
Plan: Starter ($7/month)
Disk: 10GB
```

#### 2. Deploy Redis

```bash
# Create Redis instance
Service Type: Redis
Name: tensorfleet-redis
Plan: Starter ($7/month)
```

#### 3. Deploy MinIO

```bash
# Create a Private Service for MinIO
Service Type: Private Service
Name: tensorfleet-minio
Environment: Docker
Dockerfile Path: ./Dockerfile.minio
Plan: Starter ($7/month)
Disk: 20GB
```

#### 4. Deploy Backend Services

For each service (api-gateway, storage, monitoring, model-service):

```bash
Service Type: Web Service
Environment: Docker
Dockerfile Path: ./<service>/Dockerfile
Docker Context: .
Plan: Starter ($7/month)
Health Check Path: /health
```

#### 5. Deploy ML Worker

```bash
Service Type: Background Worker
Environment: Docker
Dockerfile Path: ./worker-ml/Dockerfile
Docker Context: .
Plan: Starter ($7/month)
```

#### 6. Deploy Frontend

```bash
Service Type: Static Site
Build Command: cd frontend && npm install && npm run build
Publish Directory: ./frontend/dist
```

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository:

1. **RENDER_API_KEY**
   - Get from: https://dashboard.render.com/account/api-keys
   - Used for: Automated deployments

2. **RENDER_SERVICE_ID**
   - Get from: Service Settings → Service ID
   - Used for: Identifying which service to deploy

3. **Service URLs** (after first deployment):
   - `RENDER_API_URL`: API Gateway URL
   - `RENDER_STORAGE_URL`: Storage Service URL
   - `RENDER_MONITORING_URL`: Monitoring Service URL
   - `RENDER_MODEL_SERVICE_URL`: Model Service URL
   - `RENDER_FRONTEND_URL`: Frontend URL

### Adding Secrets to GitHub

```bash
# Go to your GitHub repository
Settings → Secrets and variables → Actions → New repository secret

# Add each secret:
Name: RENDER_API_KEY
Value: <your-render-api-key>

Name: RENDER_SERVICE_ID
Value: <your-service-id>

# ... repeat for all secrets
```

## Environment Variables Configuration

### Automatic Configuration (Blueprint)

When using `render.yaml`, environment variables are automatically configured:
- Service URLs are linked using `fromService`
- Passwords are auto-generated
- Internal networking is configured

### Manual Configuration

If deploying manually, set these environment variables for each service:

#### API Gateway
```env
PORT=8080
MONGODB_URL=<mongodb-connection-string>
REDIS_ADDR=<redis-connection-string>
ORCHESTRATOR_URL=<orchestrator-internal-url>
STORAGE_SERVICE_URL=<storage-external-url>
```

#### Storage Service
```env
PORT=8081
MONGODB_URL=<mongodb-connection-string>
MINIO_ENDPOINT=<minio-internal-hostname>
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<generated-password>
```

#### Monitoring Service
```env
PORT=8082
```

#### Model Service
```env
PORT=8083
MONGODB_URL=<mongodb-connection-string>
```

#### ML Worker
```env
MONGODB_URL=<mongodb-connection-string>
STORAGE_SERVICE_URL=<storage-external-url>
REDIS_ADDR=<redis-connection-string>
```

#### Frontend
```env
VITE_API_URL=<api-gateway-url>
VITE_STORAGE_URL=<storage-url>
VITE_MONITORING_URL=<monitoring-url>
VITE_MODEL_SERVICE_URL=<model-service-url>
```

## Deployment Workflow

### Automatic Deployment

Every push to `main` branch triggers:

1. **Build Phase**
   - Frontend is built with production environment variables
   - Docker images are built for all services

2. **Deploy Phase**
   - Services are deployed to Render
   - Health checks verify deployment success

3. **Verification Phase**
   - All service health endpoints are checked
   - Deployment status is reported

### Manual Deployment

Trigger deployment manually:

```bash
# From GitHub Actions tab
Actions → Deploy to Render → Run workflow
```

## Cost Estimation

### Minimum Setup (Starter Plan)

| Service | Type | Cost/Month |
|---------|------|------------|
| MongoDB | Private Service | $7 |
| Redis | Redis | $7 |
| MinIO | Private Service | $7 |
| API Gateway | Web Service | $7 |
| Storage | Web Service | $7 |
| Monitoring | Web Service | $7 |
| Model Service | Web Service | $7 |
| ML Worker | Background Worker | $7 |
| Frontend | Static Site | Free |
| **Total** | | **$56/month** |

### Optimized Setup (Free Tier + Paid)

| Service | Type | Cost/Month |
|---------|------|------------|
| MongoDB Atlas | External (Free Tier) | $0 |
| Redis Cloud | External (Free Tier) | $0 |
| MinIO | Private Service | $7 |
| API Gateway | Web Service | $7 |
| Storage | Web Service | $7 |
| Monitoring | Web Service (Free) | $0 |
| Model Service | Web Service (Free) | $0 |
| ML Worker | Background Worker | $7 |
| Frontend | Static Site | Free |
| **Total** | | **$28/month** |

## Using External Services (Cost Optimization)

### MongoDB Atlas (Free Tier)

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Get connection string
4. Update `MONGODB_URL` in all services

### Redis Cloud (Free Tier)

1. Sign up at [redis.com/try-free](https://redis.com/try-free/)
2. Create a free 30MB database
3. Get connection string
4. Update `REDIS_ADDR` in all services

### AWS S3 (Instead of MinIO)

1. Create S3 bucket
2. Get access keys
3. Update storage service to use S3 instead of MinIO

## Monitoring Deployment

### Check Deployment Status

```bash
# View logs for a service
render logs <service-name>

# Check service status
render services list
```

### Access Services

After deployment, your services will be available at:

- **Frontend**: `https://tensorfleet-frontend.onrender.com`
- **API Gateway**: `https://tensorfleet-api-gateway.onrender.com`
- **Storage**: `https://tensorfleet-storage.onrender.com`
- **Monitoring**: `https://tensorfleet-monitoring.onrender.com`
- **Model Service**: `https://tensorfleet-model-service.onrender.com`

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check logs
render logs <service-name>

# Common fixes:
- Verify environment variables are set
- Check Dockerfile paths
- Ensure health check endpoint exists
```

#### 2. Database Connection Failed

```bash
# Verify MongoDB URL format
mongodb://username:password@host:port/database?authSource=admin

# Check if MongoDB service is running
render services list | grep mongodb
```

#### 3. Frontend Can't Connect to Backend

```bash
# Verify VITE_* environment variables
# Ensure CORS is configured in backend services
# Check if backend services are healthy
```

#### 4. Build Failures

```bash
# Check build logs
# Verify all dependencies are in package.json/requirements.txt
# Ensure Dockerfile is valid
```

### Getting Help

1. **Render Documentation**: https://render.com/docs
2. **Render Community**: https://community.render.com
3. **GitHub Issues**: Create an issue in your repository

## Continuous Deployment

### Automatic Deployments

- **Main Branch**: Auto-deploys to production
- **Pull Requests**: Creates preview deployments
- **Feature Branches**: Manual deployment via workflow_dispatch

### Rollback

If deployment fails:

```bash
# From Render Dashboard
Service → Deploys → Select previous deploy → Redeploy
```

## Security Best Practices

1. **Use Secrets for Sensitive Data**
   - Never commit passwords or API keys
   - Use Render's environment variables
   - Enable secret scanning in GitHub

2. **Enable HTTPS**
   - Render provides free SSL certificates
   - Ensure all service URLs use HTTPS

3. **Restrict Access**
   - Use Render's private services for internal communication
   - Configure firewall rules
   - Enable authentication

4. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Use Dependabot for automated updates

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Connect repository to Render
3. ✅ Deploy using Blueprint
4. ✅ Configure GitHub Actions secrets
5. ✅ Test deployment
6. ✅ Monitor services
7. ✅ Set up alerts and notifications

## Support

For issues specific to TensorFleet deployment:
- Open an issue on GitHub
- Check the troubleshooting section
- Review Render logs

Happy Deploying! 🚀
