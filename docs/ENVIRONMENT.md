# TensorFleet Environment Management

This directory contains environment configurations for different deployment stages of TensorFleet.

## Available Environments

### 🛠️ Development Environment (`.env.development`)
- Local development setup
- Debug features enabled
- Mock data and development tools
- Local service URLs
- Development database with sample data
- Relaxed security settings

### 🚀 Production Environment (`.env.production`)
- Production-ready configuration
- Security optimized
- Performance tuned
- Cloud service URLs
- Production database settings
- SSL/TLS enabled
- Monitoring and backup enabled

### 📋 Template (`.env.example`)
- Base template for environment variables
- Copy and customize for new environments
- Documents all available configuration options

## Quick Start

### 1. Setup Development Environment
```bash
# Copy development configuration
cp .env.development .env

# Or use the environment script
./scripts/env-config.sh setup dev
```

### 2. Setup Production Environment
```bash
# Copy production configuration
cp .env.production .env

# Update sensitive values (REQUIRED!)
# - JWT_SECRET
# - MONGODB_URI
# - SMTP credentials
# - API keys

# Or use the environment script
./scripts/env-config.sh setup prod
```

### 3. Validate Configuration
```bash
# Validate development environment
./scripts/env-config.sh validate dev

# Validate production environment
./scripts/env-config.sh validate prod
```

## Environment Script Usage

The `scripts/env-config.sh` script provides convenient environment management:

```bash
# Setup/switch environment
./scripts/env-config.sh setup dev
./scripts/env-config.sh setup prod

# List available environments
./scripts/env-config.sh list

# Show current environment status
./scripts/env-config.sh status

# Validate environment configuration
./scripts/env-config.sh validate dev
./scripts/env-config.sh validate prod
```

## Docker Compose Environments

### Development
```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.development.yml up

# With additional development tools
docker-compose -f docker-compose.yml -f docker-compose.development.yml --profile dev-tools up
```

### Production
```bash
# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# With scaling
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d --scale worker=4
```

## Key Configuration Sections

### 🌐 API & Services
- `REACT_APP_API_BASE_URL`: Frontend API endpoint
- `REACT_APP_*_SERVICE_URL`: Individual service endpoints

### 🗄️ Database
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection for caching and queues

### 🔐 Security
- `JWT_SECRET`: JSON Web Token secret key
- `CORS_ORIGIN`: Allowed CORS origins
- Rate limiting configuration

### 📁 Storage
- `STORAGE_PATH`: File storage location
- `UPLOAD_MAX_SIZE`: Maximum file upload size
- `ALLOWED_FILE_TYPES`: Permitted file extensions

### 🔍 Monitoring
- `PROMETHEUS_ENDPOINT`: Metrics collection
- `GRAFANA_URL`: Monitoring dashboard
- `LOG_LEVEL`: Application logging level

### ⚙️ ML Configuration
- `DEFAULT_WORKER_COUNT`: Default training workers
- `MAX_CONCURRENT_JOBS`: Maximum simultaneous jobs
- `TRAINING_TIMEOUT`: Training timeout duration

## Environment Variables Reference

### Required Variables
- `NODE_ENV`: Application environment (development/production)
- `REACT_APP_API_BASE_URL`: API gateway URL
- `MONGODB_URI`: Database connection
- `JWT_SECRET`: Authentication secret

### Optional Variables
- `ENABLE_DEBUG`: Enable debug features
- `ENABLE_MOCK_DATA`: Use mock data for development
- `RATE_LIMIT_MAX_REQUESTS`: API rate limiting
- `BACKUP_ENABLED`: Enable automated backups

## Security Considerations

### Development
- Uses weak passwords for convenience
- Debug features enabled
- Relaxed CORS settings
- Local service URLs

### Production
- Strong authentication required
- Debug features disabled
- Strict CORS configuration
- HTTPS/SSL enforced
- Rate limiting enabled
- Automated backups

## Best Practices

### 🔄 Environment Switching
```bash
# Always validate after switching
./scripts/env-config.sh setup prod
./scripts/env-config.sh validate prod
```

### 🔒 Secret Management
```bash
# Use environment-specific secrets
# Never commit real production secrets to version control
# Use tools like HashiCorp Vault, AWS Secrets Manager, etc.
```

### 🧪 Testing
```bash
# Test configuration before deployment
docker-compose config
docker-compose -f docker-compose.yml -f docker-compose.production.yml config
```

### 📊 Monitoring
- Always enable monitoring in production
- Set up alerts for critical metrics
- Monitor resource usage and performance

## Troubleshooting

### Common Issues

1. **Missing environment file**
   ```bash
   # Create from template
   cp .env.example .env.development
   ```

2. **Invalid configuration**
   ```bash
   # Validate configuration
   ./scripts/env-config.sh validate dev
   ```

3. **Docker compose conflicts**
   ```bash
   # Clean up and rebuild
   docker-compose down -v
   docker-compose build --no-cache
   ```

4. **Permission issues**
   ```bash
   # Fix script permissions
   chmod +x scripts/env-config.sh
   ```

### Environment Debugging
```bash
# Check current environment
./scripts/env-config.sh status

# View environment variables
cat .env

# Test service connectivity
curl http://localhost:8080/health
```

## Migration Guide

### From Single Environment to Multi-Environment
1. Backup current `.env` file
2. Copy to appropriate environment file
3. Update configurations as needed
4. Test both environments
5. Update deployment scripts

### Adding New Environment (e.g., staging)
1. Copy `.env.example` to `.env.staging`
2. Update environment-specific values
3. Create `docker-compose.staging.yml` if needed
4. Update environment script to support staging
5. Test new environment thoroughly
