# Environment Configuration Guide

## 📋 Overview

This guide explains how to configure environment variables for the TensorFleet distributed ML training platform.

## 🚀 Quick Start

### 1. Copy the Example File

```bash
cp .env.example .env
```

### 2. Update Credentials

Open `.env` and update these critical values:

```bash
# MongoDB
MONGO_INITDB_ROOT_PASSWORD=your_secure_password_here

# MinIO
MINIO_ROOT_PASSWORD=your_minio_password_here
MINIO_SECRET_KEY=your_minio_secret_here

# Grafana
GF_SECURITY_ADMIN_PASSWORD=your_grafana_password_here
```

### 3. Start Services

```bash
docker-compose up -d
```

## 🔐 Security Recommendations

### Production Deployment

For production environments, follow these best practices:

1. **Strong Passwords**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32
   ```

2. **Enable SSL/TLS**
   ```bash
   MINIO_SECURE=true
   # Add SSL certificates
   ```

3. **Restrict Network Access**
   ```bash
   # Use internal network IPs
   MONGODB_URL=mongodb://admin:password@10.0.1.10:27017/tensorfleet
   ```

4. **Use Secrets Management**
   - Docker Secrets
   - Kubernetes Secrets
   - HashiCorp Vault
   - AWS Secrets Manager

## 📝 Configuration Sections

### MongoDB Configuration

```bash
# Connection credentials
MONGO_INITDB_ROOT_USERNAME=admin          # Admin username
MONGO_INITDB_ROOT_PASSWORD=password123    # Admin password (CHANGE THIS!)
MONGO_INITDB_DATABASE=tensorfleet         # Default database

# Connection string
MONGODB_URL=mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin
MONGODB_DB=tensorfleet                    # Database name
MONGODB_PORT=27017                        # Port number
```

**What to customize:**
- `MONGO_INITDB_ROOT_PASSWORD`: Use a strong password (min 16 characters)
- `MONGODB_URL`: Update if using external MongoDB instance

### Redis Configuration

```bash
REDIS_ADDR=redis:6379                     # Redis server address
REDIS_PORT=6379                           # Redis port
```

**What to customize:**
- `REDIS_ADDR`: Change if using external Redis
- Add `REDIS_PASSWORD` if using authentication

### MinIO Configuration

```bash
MINIO_ROOT_USER=minioadmin                # Admin username
MINIO_ROOT_PASSWORD=minioadmin            # Admin password (CHANGE THIS!)
MINIO_ENDPOINT=minio:9000                 # Server endpoint
MINIO_ACCESS_KEY=minioadmin               # Access key
MINIO_SECRET_KEY=minioadmin               # Secret key (CHANGE THIS!)
MINIO_SECURE=false                        # Enable SSL (true for prod)
MINIO_PORT=9000                           # API port
MINIO_CONSOLE_PORT=9001                   # Console port
```

**What to customize:**
- `MINIO_ROOT_PASSWORD`: Strong password required
- `MINIO_SECRET_KEY`: Generate unique secret key
- `MINIO_SECURE`: Set to `true` in production

### Service Ports

```bash
ORCHESTRATOR_PORT=50051                   # gRPC orchestrator
WORKER_PORT=50052                         # gRPC worker
API_GATEWAY_PORT=8080                     # REST API
STORAGE_PORT=8081                         # Storage service
MONITORING_PORT=8082                      # Monitoring service
ML_WORKER_PORT=8000                       # ML Worker API
MODEL_SERVICE_PORT=8083                   # Model management
FRONTEND_PORT=3000                        # Web UI
PROMETHEUS_PORT=9090                      # Prometheus
GRAFANA_PORT=3001                         # Grafana dashboard
```

**What to customize:**
- Change ports if they conflict with existing services
- Update firewall rules accordingly

### Frontend Configuration

```bash
VITE_API_URL=http://localhost:8080        # API Gateway URL
VITE_MONITORING_URL=http://localhost:8082 # Monitoring URL
```

**What to customize:**
- Update URLs for production domain
- Use HTTPS in production: `https://api.yourdomain.com`

### Grafana Configuration

```bash
GF_SECURITY_ADMIN_USER=admin              # Admin username
GF_SECURITY_ADMIN_PASSWORD=admin          # Admin password (CHANGE THIS!)
GF_INSTALL_PLUGINS=grafana-piechart-panel # Plugins to install
```

**What to customize:**
- `GF_SECURITY_ADMIN_PASSWORD`: Use strong password
- Add more plugins if needed

### ML Worker Configuration

```bash
ML_DEFAULT_ALGORITHM=random_forest        # Default algorithm
ML_DEFAULT_TEST_SIZE=0.2                  # Train/test split ratio
ML_DEFAULT_RANDOM_STATE=42                # Random seed
```

**Available algorithms:**
- `random_forest`
- `logistic_regression`
- `svm`
- `decision_tree`

### Environment Settings

```bash
ENVIRONMENT=development                   # development | production | staging
DEBUG=true                                # Enable debug logging
LOG_LEVEL=info                           # debug | info | warning | error
```

**What to customize:**
- Set `ENVIRONMENT=production` for prod
- Set `DEBUG=false` in production
- Adjust `LOG_LEVEL` based on needs

## 🌍 Environment-Specific Configurations

### Development (.env.development)

```bash
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug
MINIO_SECURE=false
MONGODB_URL=mongodb://admin:password123@localhost:27017/tensorfleet?authSource=admin
```

### Production (.env.production)

```bash
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=warning
MINIO_SECURE=true
MONGODB_URL=mongodb://admin:STRONG_PASSWORD@prod-mongodb:27017/tensorfleet?authSource=admin&ssl=true
VITE_API_URL=https://api.tensorfleet.com
```

### Staging (.env.staging)

```bash
ENVIRONMENT=staging
DEBUG=false
LOG_LEVEL=info
MINIO_SECURE=true
MONGODB_URL=mongodb://admin:STAGING_PASSWORD@staging-mongodb:27017/tensorfleet?authSource=admin
```

## 🔄 Loading Environment Variables

### Docker Compose

Docker Compose automatically loads `.env` file:

```bash
docker-compose up -d
```

### Manual Load (Shell)

```bash
# Load variables
export $(cat .env | xargs)

# Or source it
source .env
```

### Python Applications

```python
from dotenv import load_dotenv
import os

load_dotenv()

mongodb_url = os.getenv('MONGODB_URL')
```

### Go Applications

```go
import "github.com/joho/godotenv"

godotenv.Load()
mongodbURL := os.Getenv("MONGODB_URL")
```

## 🔍 Troubleshooting

### Issue: Services Can't Connect

**Solution:** Check service names match in both `.env` and `docker-compose.yml`

```bash
# .env
MONGODB_URL=mongodb://admin:password@mongodb:27017/...
                                     ^^^^^^^ 
# Must match service name in docker-compose.yml
```

### Issue: Permission Denied

**Solution:** Check volume permissions

```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./volumes
```

### Issue: Port Already in Use

**Solution:** Change port in `.env`

```bash
# If port 8080 is taken
API_GATEWAY_PORT=8081
```

Then update `docker-compose.yml`:
```yaml
ports:
  - "${API_GATEWAY_PORT}:8080"
```

## 📚 Environment Variable Reference

| Variable | Service | Required | Default | Description |
|----------|---------|----------|---------|-------------|
| `MONGODB_URL` | ML Worker, Model Service | ✅ | - | MongoDB connection string |
| `REDIS_ADDR` | Orchestrator | ✅ | redis:6379 | Redis server address |
| `MINIO_ENDPOINT` | Storage | ✅ | minio:9000 | MinIO server endpoint |
| `API_GATEWAY_PORT` | API Gateway | ✅ | 8080 | REST API port |
| `ML_WORKER_PORT` | ML Worker | ✅ | 8000 | ML training API port |
| `VITE_API_URL` | Frontend | ✅ | - | Backend API URL |

## 🔒 Security Checklist

- [ ] Changed all default passwords
- [ ] Generated unique secret keys
- [ ] Enabled SSL/TLS for production
- [ ] Restricted network access
- [ ] Added `.env` to `.gitignore`
- [ ] Used secrets management tool
- [ ] Rotated credentials regularly
- [ ] Enabled authentication on all services
- [ ] Configured firewall rules
- [ ] Set up monitoring and alerts

## 📖 Additional Resources

- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [MongoDB Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [MinIO Security Best Practices](https://min.io/docs/minio/linux/operations/security.html)
- [TensorFleet Documentation](./README.md)

---

**Need help?** Check the [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common commands and examples.
