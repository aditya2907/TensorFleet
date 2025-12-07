# 🚀 Quick Deployment Commands

## Pre-Deployment Cleanup

```bash
# Run automated cleanup
./scripts/cleanup-for-deployment.sh

# Or manual cleanup
rm -rf frontend/node_modules frontend/dist
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -name "*.log" -delete
find . -name ".DS_Store" -delete
```

## Vercel Deployment

### One-Command Deploy
```bash
cd frontend && npx vercel --prod
```

### Step-by-Step
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Navigate to frontend
cd frontend

# 4. Deploy to production
vercel --prod

# 5. Set environment variables (in Vercel Dashboard)
# VITE_API_URL=https://your-api.com
# VITE_MONITORING_URL=https://your-monitoring.com
```

### Auto Deploy from GitHub
1. Import repo in Vercel Dashboard
2. Set root directory to `frontend`
3. Build command: `npm install && npm run build`
4. Output directory: `dist`
5. Add environment variables
6. Deploy!

## Netlify Deployment

### One-Command Deploy
```bash
cd frontend && npm run build && npx netlify deploy --prod --dir=dist
```

### Step-by-Step
```bash
# 1. Install Netlify CLI
npm i -g netlify-cli

# 2. Login
netlify login

# 3. Navigate to frontend
cd frontend

# 4. Build
npm install && npm run build

# 5. Deploy to production
netlify deploy --prod --dir=dist

# 6. Set environment variables (in Netlify Dashboard)
# VITE_API_URL=https://your-api.com
# VITE_MONITORING_URL=https://your-monitoring.com
```

### Auto Deploy from GitHub
1. Connect repo in Netlify Dashboard
2. Base directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `frontend/dist`
5. Add environment variables
6. Deploy!

## Docker Compose Deployment (VPS/Cloud VM)

### Quick Start
```bash
# 1. Clone repo
git clone https://github.com/your-username/tensorfleet.git
cd tensorfleet

# 2. Configure environment
cp .env.example .env
nano .env  # Update passwords and URLs

# 3. Start services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f

# 6. Access services
# Frontend: http://your-server:3000
# API Gateway: http://your-server:8080
# Model Service: http://your-server:8083
# Grafana: http://your-server:3001
```

### With SSL (Production)
```bash
# 1. Install Nginx
sudo apt update
sudo apt install nginx

# 2. Configure Nginx (see DEPLOYMENT.md for config)
sudo nano /etc/nginx/sites-available/tensorfleet

# 3. Enable site
sudo ln -s /etc/nginx/sites-available/tensorfleet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 4. Install SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# 5. Start services
docker-compose up -d
```

## Kubernetes Deployment

### Quick Start
```bash
# 1. Configure kubectl
kubectl config use-context your-cluster

# 2. Create namespace
kubectl create namespace tensorfleet

# 3. Create secrets
kubectl create secret generic tensorfleet-secrets \
  --from-env-file=.env \
  -n tensorfleet

# 4. Deploy infrastructure
kubectl apply -f k8s/storage.yaml -n tensorfleet
kubectl apply -f k8s/mongodb-ml.yaml -n tensorfleet
kubectl apply -f k8s/infrastructure.yaml -n tensorfleet

# 5. Deploy services
kubectl apply -f k8s/orchestrator.yaml -n tensorfleet
kubectl apply -f k8s/worker.yaml -n tensorfleet
kubectl apply -f k8s/api-gateway.yaml -n tensorfleet
kubectl apply -f k8s/frontend.yaml -n tensorfleet

# 6. Deploy monitoring
kubectl apply -f k8s/monitoring.yaml -n tensorfleet

# 7. Setup ingress
kubectl apply -f k8s/ingress.yaml -n tensorfleet

# 8. Check status
kubectl get pods -n tensorfleet
kubectl get services -n tensorfleet
kubectl get ingress -n tensorfleet
```

### With Helm (Advanced)
```bash
# Coming soon - Helm charts
helm install tensorfleet ./helm/tensorfleet -n tensorfleet
```

## AWS Deployment

### Frontend (Amplify)
```bash
# 1. Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 2. Configure
aws configure

# 3. Install Amplify CLI
npm install -g @aws-amplify/cli

# 4. Initialize
cd frontend
amplify init

# 5. Add hosting
amplify add hosting

# 6. Publish
amplify publish
```

### Backend (ECS)
```bash
# 1. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# 2. Tag and push images
docker-compose build
docker tag tensorfleet-api-gateway:latest <account>.dkr.ecr.us-east-1.amazonaws.com/tensorfleet-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/tensorfleet-api:latest

# 3. Deploy to ECS (use AWS Console or CLI)
```

## Google Cloud Deployment

### Frontend (Firebase)
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize
cd frontend
firebase init hosting

# 4. Build
npm run build

# 5. Deploy
firebase deploy --only hosting
```

### Backend (Cloud Run)
```bash
# 1. Build and deploy
gcloud run deploy tensorfleet-api \
  --source ./api-gateway \
  --region us-central1 \
  --allow-unauthenticated

# 2. Deploy other services
gcloud run deploy tensorfleet-ml \
  --source ./worker-ml \
  --region us-central1
```

## Environment Variables Setup

### Required Variables
```bash
# MongoDB
export MONGODB_URL="mongodb+srv://user:pass@cluster.mongodb.net/tensorfleet"

# Redis
export REDIS_ADDR="your-redis-host:6379"

# MinIO/S3
export MINIO_ENDPOINT="s3.amazonaws.com"
export MINIO_ACCESS_KEY="your-access-key"
export MINIO_SECRET_KEY="your-secret-key"

# API URLs
export VITE_API_URL="https://api.yourdomain.com"
export VITE_MONITORING_URL="https://monitoring.yourdomain.com"
```

### Load from .env
```bash
export $(cat .env | xargs)
```

## Health Checks

### Test All Endpoints
```bash
# API Gateway
curl https://your-domain.com/health

# Model Service
curl https://your-domain.com/models/health

# ML Worker
curl https://your-domain.com/ml/metrics

# Monitoring
curl https://your-domain.com/monitoring/health

# Prometheus
curl https://your-domain.com/prometheus/api/v1/status/config

# Grafana
curl https://your-domain.com/grafana/api/health
```

## Rollback Commands

### Docker Compose
```bash
# Stop current version
docker-compose down

# Checkout previous version
git checkout HEAD~1

# Restart
docker-compose up -d
```

### Kubernetes
```bash
# Rollback deployment
kubectl rollout undo deployment/tensorfleet-api -n tensorfleet

# Check rollout status
kubectl rollout status deployment/tensorfleet-api -n tensorfleet
```

### Vercel
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

### Netlify
```bash
# List deployments
netlify deploys:list

# Restore previous deployment
netlify deploys:restore <deploy-id>
```

## Monitoring & Logs

### Docker Compose
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway

# Last 100 lines
docker-compose logs --tail=100
```

### Kubernetes
```bash
# All pods
kubectl logs -f -l app=tensorfleet -n tensorfleet

# Specific pod
kubectl logs -f <pod-name> -n tensorfleet

# Previous pod instance
kubectl logs --previous <pod-name> -n tensorfleet
```

### Cloud Platforms
```bash
# AWS CloudWatch
aws logs tail /aws/ecs/tensorfleet --follow

# Google Cloud Logging
gcloud logging read "resource.type=cloud_run_revision" --limit 100 --format json

# Vercel
vercel logs

# Netlify
netlify logs
```

## Backup Commands

### MongoDB
```bash
# Backup
mongodump --uri="mongodb://admin:password@localhost:27017/tensorfleet" --out=./backup

# Restore
mongorestore --uri="mongodb://admin:password@localhost:27017/tensorfleet" ./backup
```

### Redis
```bash
# Backup
redis-cli --rdb /backup/dump.rdb SAVE

# Restore
cp /backup/dump.rdb /data/dump.rdb
docker-compose restart redis
```

### MinIO/S3
```bash
# Backup
aws s3 sync s3://your-bucket ./backup

# Restore
aws s3 sync ./backup s3://your-bucket
```

## Performance Testing

### Load Test
```bash
# Install k6
brew install k6  # macOS
sudo apt install k6  # Linux

# Run test
k6 run scripts/load-test.js
```

### Benchmark
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test endpoint
ab -n 1000 -c 10 https://your-domain.com/api/health
```

## Cost Estimation

### Vercel
- Hobby: Free (100GB bandwidth)
- Pro: $20/month (1TB bandwidth)

### Netlify
- Starter: Free (100GB bandwidth)
- Pro: $19/month (1TB bandwidth)

### AWS
- EC2 t3.medium: ~$30/month
- DocumentDB: ~$50/month
- ElastiCache: ~$30/month
- S3: ~$5/month (100GB)
- **Total**: ~$115/month

### Google Cloud
- Cloud Run: Pay per use (~$20/month)
- Cloud Storage: ~$5/month
- Firebase Hosting: Free tier
- **Total**: ~$25-50/month

### DigitalOcean
- Droplet (4GB RAM): $24/month
- Managed MongoDB: $15/month
- Spaces (S3): $5/month
- **Total**: ~$44/month

## Support

- 📖 Full Guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🔧 Environment Setup: [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)
- ✅ Pre-Deploy Checklist: [PRE_COMMIT_CHECKLIST.md](./PRE_COMMIT_CHECKLIST.md)
- 🏗️ Architecture: [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)

---

**Questions?** Open an issue or check the documentation! 🚀
