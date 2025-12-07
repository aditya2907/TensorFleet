# Pre-Commit Checklist for Deployment

## 🎯 Essential Tasks

### 1. Code Quality
- [ ] All code compiles/builds without errors
- [ ] No `console.log()` or debug statements in production code
- [ ] All TODO comments reviewed and addressed
- [ ] Code follows project style guidelines
- [ ] All linting errors fixed

### 2. Dependencies
- [ ] All dependencies updated to stable versions
- [ ] No security vulnerabilities: `npm audit`
- [ ] Unused dependencies removed
- [ ] `package-lock.json` or `yarn.lock` committed

### 3. Environment Variables
- [ ] `.env` file created and configured
- [ ] `.env` added to `.gitignore`
- [ ] `.env.example` updated with all required variables
- [ ] No hardcoded credentials in source code
- [ ] All API URLs configured for production

### 4. Configuration Files
- [ ] `vercel.json` configured (if using Vercel)
- [ ] `netlify.toml` configured (if using Netlify)
- [ ] `docker-compose.yml` production ready
- [ ] Kubernetes manifests updated

### 5. Security
- [ ] All default passwords changed
- [ ] Strong passwords generated for databases
- [ ] API keys and secrets not committed
- [ ] CORS configured properly
- [ ] Security headers configured
- [ ] SSL/TLS enabled for production

### 6. Build & Test
- [ ] Frontend builds successfully: `cd frontend && npm run build`
- [ ] Backend builds successfully: `docker-compose build`
- [ ] All tests passing (if tests exist)
- [ ] No broken imports or missing files
- [ ] Production build tested locally

### 7. Documentation
- [ ] README.md updated with latest information
- [ ] API documentation current
- [ ] Deployment instructions clear
- [ ] Environment variables documented
- [ ] Architecture diagrams updated

### 8. Git Repository
- [ ] All large files removed (>10MB)
- [ ] `.gitignore` configured properly
- [ ] No sensitive data in commit history
- [ ] Meaningful commit messages
- [ ] Branch up to date with main

### 9. Cleanup
- [ ] `node_modules/` removed
- [ ] `__pycache__/` removed
- [ ] Build artifacts removed
- [ ] Log files removed
- [ ] Temporary files removed
- [ ] `.DS_Store` and OS files removed

### 10. Deployment Preparation
- [ ] Backend services containerized
- [ ] Database connections configured
- [ ] CDN configured for static assets
- [ ] Monitoring and logging setup
- [ ] Backup strategy in place
- [ ] Rollback plan documented

## 🚀 Quick Commands

### Run Cleanup Script
```bash
./scripts/cleanup-for-deployment.sh
```

### Check for Large Files
```bash
find . -type f -size +10M ! -path "./.git/*" ! -path "*/node_modules/*" -ls
```

### Check for Sensitive Data
```bash
# Check for potential API keys
grep -r "api_key\|apikey\|api-key" --include="*.js" --include="*.py" --include="*.go" .

# Check for passwords
grep -r "password\s*=\s*['\"]" --include="*.js" --include="*.py" --include="*.go" .
```

### Verify Build
```bash
# Frontend
cd frontend && npm run build

# Backend (Docker)
docker-compose build

# Backend (Kubernetes)
kubectl apply --dry-run=client -f k8s/
```

### Security Audit
```bash
# Node.js
npm audit

# Python
pip install safety
safety check

# Docker images
docker scan tensorfleet-api-gateway
```

## ✅ Final Verification

### Local Testing
```bash
# 1. Start all services
docker-compose up -d

# 2. Wait for services to be healthy
sleep 30

# 3. Test endpoints
curl http://localhost:8080/health
curl http://localhost:8083/health
curl http://localhost:8000/health
curl http://localhost:3000

# 4. Stop services
docker-compose down
```

### Git Status
```bash
# Check status
git status

# Check what will be committed
git diff --cached

# Verify .gitignore
cat .gitignore | grep -E "^\.env$|node_modules|__pycache__"
```

### Size Check
```bash
# Check repository size
du -sh .git

# Count files
git ls-files | wc -l

# Find largest files
git ls-files | xargs -I {} ls -lh {} | sort -k5 -hr | head -20
```

## 🔍 Common Issues

### Issue: Large Repository Size
**Fix**: Remove large files from git history
```bash
# Install BFG Repo-Cleaner
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Remove large files
bfg --strip-blobs-bigger-than 10M
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Issue: Sensitive Data in History
**Fix**: Remove sensitive files from history
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

### Issue: Build Fails on Deployment Platform
**Fix**: Test build locally first
```bash
# Simulate Vercel build
cd frontend && npm install && npm run build

# Simulate Netlify build
cd frontend && npm install && npm run build
```

## 📋 Deployment Platform Checklist

### Vercel
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login: `vercel login`
- [ ] Environment variables configured in dashboard
- [ ] Domain configured (if custom domain)
- [ ] Build settings verified

### Netlify
- [ ] Install Netlify CLI: `npm i -g netlify-cli`
- [ ] Login: `netlify login`
- [ ] Environment variables configured in dashboard
- [ ] Build settings verified
- [ ] Redirect rules configured

### Docker/VPS
- [ ] Server provisioned with adequate resources
- [ ] Docker and Docker Compose installed
- [ ] Domain DNS configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Nginx configured as reverse proxy
- [ ] Firewall rules configured

### Kubernetes
- [ ] Cluster created and configured
- [ ] kubectl installed and configured
- [ ] Secrets created
- [ ] Persistent volumes configured
- [ ] Ingress controller installed
- [ ] Load balancer configured

## 🎉 Ready to Deploy!

Once all checkboxes are complete:

```bash
# 1. Commit changes
git add .
git commit -m "chore: prepare for deployment"

# 2. Push to repository
git push origin main

# 3. Deploy
# For Vercel:
vercel --prod

# For Netlify:
netlify deploy --prod

# For Docker:
docker-compose up -d

# For Kubernetes:
kubectl apply -f k8s/
```

## 📚 Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) - Environment configuration
- [README.md](./README.md) - Project documentation
- [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) - System architecture

---

**Good luck with your deployment! 🚀**
