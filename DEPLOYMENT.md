# 🚀 Deployment Guide - TensorFleet

Complete guide for deploying TensorFleet to production environments including Vercel, Netlify, and cloud platforms.

## 📋 Table of Contents

- [Frontend Deployment (Vercel/Netlify)](#frontend-deployment)
- [Backend Deployment (Cloud)](#backend-deployment)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Monitoring Setup](#monitoring-setup)

---

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended for React/Vite)

#### Prerequisites
```bash
npm install -g vercel
```

#### Steps

1. **Login to Vercel**
```bash
vercel login
```

2. **Deploy Frontend**
```bash
cd frontend
vercel --prod
```

3. **Configure Environment Variables**

Go to Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend-api.com
VITE_MONITORING_URL=https://your-monitoring-api.com
```

4. **Connect to Git (Optional)**
```bash
# Link your GitHub repo
vercel link
vercel --prod
```

#### Vercel Configuration

The `vercel.json` file is already configured:
- ✅ Vite build setup
- ✅ SPA routing
- ✅ API proxy
- ✅ Security headers

### Option 2: Netlify

#### Prerequisites
```bash
npm install -g netlify-cli
```

#### Steps

1. **Login to Netlify**
```bash
netlify login
```

2. **Initialize Project**
```bash
netlify init
```

3. **Deploy**
```bash
# Deploy to production
netlify deploy --prod

# Or use drag-and-drop
cd frontend && npm run build
# Upload frontend/dist folder to Netlify UI
```

4. **Configure Environment Variables**

Go to Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_API_URL=https://your-backend-api.com
VITE_MONITORING_URL=https://your-monitoring-api.com
```

#### Netlify Configuration

The `netlify.toml` file is already configured:
- ✅ Build commands
- ✅ Redirect rules
- ✅ Security headers
- ✅ Cache optimization

---

## 🔧 Backend Deployment

### Option 1: Docker Compose (VPS/Cloud VM)

Deploy to AWS EC2, DigitalOcean, Google Cloud VM, etc.

#### Steps

1. **Provision VM**
```bash
# Minimum requirements:
# - 4GB RAM
# - 2 vCPUs
# - 50GB storage
# - Ubuntu 22.04 LTS
```

2. **Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

3. **Clone Repository**
```bash
git clone https://github.com/your-username/tensorfleet.git
cd tensorfleet
```

4. **Configure Environment**
```bash
cp .env.example .env
nano .env
# Update all passwords and URLs
```

5. **Deploy Services**
```bash
docker-compose up -d
```

6. **Setup Nginx Reverse Proxy**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/tensorfleet
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Gateway
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Model Service
    location /models {
        proxy_pass http://localhost:8083;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Monitoring
    location /monitoring {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/tensorfleet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Setup SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Kubernetes (Production)

Deploy to AWS EKS, Google GKE, Azure AKS, etc.

#### Steps

1. **Install kubectl**
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

2. **Configure kubectl**
```bash
# For AWS EKS
aws eks update-kubeconfig --name your-cluster-name

# For GKE
gcloud container clusters get-credentials your-cluster-name

# For local testing
minikube start
```

3. **Create Namespace**
```bash
kubectl apply -f k8s/namespace.yaml
```

4. **Create ConfigMaps and Secrets**
```bash
# Create secrets from .env file
kubectl create secret generic tensorfleet-secrets \
  --from-env-file=.env \
  -n tensorfleet
```

5. **Deploy Infrastructure**
```bash
kubectl apply -f k8s/storage.yaml
kubectl apply -f k8s/mongodb-ml.yaml
kubectl apply -f k8s/infrastructure.yaml
```

6. **Deploy Services**
```bash
kubectl apply -f k8s/orchestrator.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/frontend.yaml
```

7. **Deploy Monitoring**
```bash
kubectl apply -f k8s/monitoring.yaml
```

8. **Setup Ingress**
```bash
kubectl apply -f k8s/ingress.yaml
```

9. **Verify Deployment**
```bash
kubectl get pods -n tensorfleet
kubectl get services -n tensorfleet
kubectl get ingress -n tensorfleet
```

### Option 3: Cloud Platform Services

#### AWS Deployment

**Frontend**: AWS Amplify or S3 + CloudFront
```bash
# Install AWS CLI
aws configure

# Deploy to Amplify
amplify init
amplify add hosting
amplify publish
```

**Backend**: ECS with Fargate or EC2
```bash
# Push images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

docker build -t tensorfleet-api ./api-gateway
docker tag tensorfleet-api:latest your-account.dkr.ecr.us-east-1.amazonaws.com/tensorfleet-api:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/tensorfleet-api:latest
```

**Database**: 
- MongoDB: AWS DocumentDB
- Redis: AWS ElastiCache
- Storage: S3 (instead of MinIO)

#### Google Cloud Deployment

**Frontend**: Firebase Hosting or Cloud Storage + CDN
```bash
firebase init hosting
firebase deploy --only hosting
```

**Backend**: Cloud Run or GKE
```bash
# Deploy to Cloud Run
gcloud run deploy tensorfleet-api \
  --source ./api-gateway \
  --region us-central1 \
  --allow-unauthenticated
```

**Database**:
- MongoDB: MongoDB Atlas
- Redis: Memorystore
- Storage: Cloud Storage

#### Azure Deployment

**Frontend**: Azure Static Web Apps
```bash
az staticwebapp create \
  --name tensorfleet \
  --resource-group myResourceGroup \
  --source ./frontend
```

**Backend**: Azure Container Instances or AKS
```bash
az container create \
  --resource-group myResourceGroup \
  --name tensorfleet-api \
  --image your-registry.azurecr.io/tensorfleet-api:latest \
  --ports 8080
```

---

## ✅ Pre-Deployment Checklist

### Code Preparation

- [ ] All environment variables configured in `.env`
- [ ] `.env` added to `.gitignore`
- [ ] Remove all `console.log()` statements from production code
- [ ] Update API URLs in frontend configuration
- [ ] Build and test locally: `docker-compose up -d`
- [ ] Run all tests: `npm test` (if tests exist)
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Optimize bundle size: `npm run build`

### Repository Cleanup

Run the cleanup script:
```bash
# Make script executable
chmod +x scripts/cleanup-for-deployment.sh

# Run cleanup
./scripts/cleanup-for-deployment.sh
```

Or manually:
```bash
# Remove development artifacts
rm -rf node_modules
rm -rf */node_modules
rm -rf **/__pycache__
rm -rf .pytest_cache
rm -rf .coverage

# Remove build artifacts
rm -rf frontend/dist
rm -rf */build
rm -rf */dist

# Remove local env files
rm -f .env.local

# Remove logs
rm -rf logs
rm -f *.log

# Remove temporary files
find . -name "*.tmp" -delete
find . -name "*.cache" -delete
find . -name ".DS_Store" -delete
```

### Security

- [ ] Change all default passwords
- [ ] Generate strong secret keys
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Setup firewall rules
- [ ] Enable rate limiting
- [ ] Setup backup strategy
- [ ] Configure monitoring alerts

### Performance

- [ ] Enable caching
- [ ] Optimize images and assets
- [ ] Enable gzip compression
- [ ] Configure CDN
- [ ] Setup database indexes
- [ ] Configure auto-scaling

---

## 🌍 Environment Configuration

### Production Environment Variables

Create `.env.production`:

```bash
# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=warning

# MongoDB (use managed service)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/tensorfleet?retryWrites=true&w=majority
MONGODB_DB=tensorfleet

# Redis (use managed service)
REDIS_ADDR=your-redis-instance.cloud.redislabs.com:12345

# MinIO/S3 (use managed service)
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_ACCESS_KEY=YOUR_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_SECRET_KEY
MINIO_SECURE=true

# API URLs (update with your domains)
VITE_API_URL=https://api.tensorfleet.com
VITE_MONITORING_URL=https://monitoring.tensorfleet.com

# Service Ports (cloud provider specific)
API_GATEWAY_PORT=8080
MODEL_SERVICE_PORT=8083
ML_WORKER_PORT=8000

# Security
GF_SECURITY_ADMIN_PASSWORD=STRONG_PASSWORD_HERE
```

---

## 💾 Database Setup

### MongoDB Atlas (Recommended)

1. **Create Account**: https://www.mongodb.com/cloud/atlas
2. **Create Cluster**: Choose cloud provider and region
3. **Configure Network Access**: Add your server IPs
4. **Create Database User**
5. **Get Connection String**:
```
mongodb+srv://username:password@cluster.mongodb.net/tensorfleet
```

### Redis Cloud (Recommended)

1. **Create Account**: https://redis.com/try-free/
2. **Create Database**
3. **Get Connection Details**:
```
redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
```

### Object Storage

**AWS S3**:
- Create S3 bucket
- Configure CORS
- Create IAM user with S3 permissions
- Get access key and secret key

**Google Cloud Storage**:
- Create bucket
- Configure permissions
- Create service account
- Download credentials JSON

---

## 📊 Monitoring Setup

### Prometheus + Grafana (Self-Hosted)

Already configured in `docker-compose.yml`:
- Prometheus: Port 9090
- Grafana: Port 3001

### Cloud Monitoring

**AWS CloudWatch**:
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

**Google Cloud Monitoring**:
```bash
# Install monitoring agent
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install
```

**Datadog**:
```bash
DD_API_KEY=your-api-key bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

---

## 🔍 Post-Deployment Verification

### Health Checks

```bash
# API Gateway
curl https://your-domain.com/health

# Model Service
curl https://your-domain.com/models/health

# ML Worker
curl https://your-domain.com/ml/health

# Monitoring
curl https://your-domain.com/monitoring/health
```

### Performance Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API
ab -n 1000 -c 10 https://your-domain.com/api/health
```

### Load Testing

```bash
# Install k6
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6

# Run load test
k6 run scripts/load-test.js
```

---

## 🆘 Troubleshooting

### Issue: Build Fails

**Solution**: Check Node.js version
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### Issue: API Connection Failed

**Solution**: Check CORS and API URLs
```bash
# Update frontend/.env
VITE_API_URL=https://your-backend-api.com
```

### Issue: Database Connection Failed

**Solution**: Check connection string and firewall
```bash
# Test MongoDB connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tensorfleet"
```

### Issue: SSL Certificate Errors

**Solution**: Verify certificate
```bash
sudo certbot renew --dry-run
sudo systemctl restart nginx
```

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Docker Documentation](https://docs.docker.com)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [AWS Documentation](https://docs.aws.amazon.com)

---

## 🎯 Quick Deploy Commands

### Vercel
```bash
cd frontend && vercel --prod
```

### Netlify
```bash
netlify deploy --prod --dir=frontend/dist
```

### Docker Compose
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

---

**Need help?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open an issue on GitHub.
