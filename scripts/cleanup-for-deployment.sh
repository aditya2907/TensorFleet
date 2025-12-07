#!/bin/bash

# ============================================================================
# TensorFleet - Repository Cleanup Script for Deployment
# ============================================================================
# This script cleans up development artifacts and prepares the repo for
# production deployment (Vercel, Netlify, Docker, Kubernetes, etc.)
# ============================================================================

set -e  # Exit on error

echo "🧹 TensorFleet Repository Cleanup Starting..."
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# ============================================================================
# 1. Clean Node.js artifacts
# ============================================================================
echo ""
echo "📦 Cleaning Node.js artifacts..."

if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_status "Removed root node_modules"
fi

if [ -d "frontend/node_modules" ]; then
    rm -rf frontend/node_modules
    print_status "Removed frontend/node_modules"
fi

# Clean package-lock files (optional - uncomment if needed)
# find . -name "package-lock.json" -type f -delete
# print_status "Removed package-lock.json files"

# ============================================================================
# 2. Clean Python artifacts
# ============================================================================
echo ""
echo "🐍 Cleaning Python artifacts..."

# Remove __pycache__ directories
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
print_status "Removed __pycache__ directories"

# Remove .pyc files
find . -type f -name "*.pyc" -delete 2>/dev/null || true
print_status "Removed .pyc files"

# Remove .pyo files
find . -type f -name "*.pyo" -delete 2>/dev/null || true
print_status "Removed .pyo files"

# Remove Python build artifacts
rm -rf build/ dist/ *.egg-info 2>/dev/null || true
find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
print_status "Removed Python build artifacts"

# Remove pytest cache
rm -rf .pytest_cache 2>/dev/null || true
find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
print_status "Removed pytest cache"

# Remove coverage files
rm -f .coverage 2>/dev/null || true
rm -rf htmlcov/ 2>/dev/null || true
print_status "Removed coverage files"

# ============================================================================
# 3. Clean Go artifacts
# ============================================================================
echo ""
echo "🔷 Cleaning Go artifacts..."

# Remove Go build artifacts
find . -name "*.exe" -type f -delete 2>/dev/null || true
find . -name "*.test" -type f -delete 2>/dev/null || true
find . -name "*.out" -type f -delete 2>/dev/null || true
print_status "Removed Go build artifacts"

# ============================================================================
# 4. Clean build outputs
# ============================================================================
echo ""
echo "🏗️ Cleaning build outputs..."

if [ -d "frontend/dist" ]; then
    rm -rf frontend/dist
    print_status "Removed frontend/dist"
fi

if [ -d "frontend/build" ]; then
    rm -rf frontend/build
    print_status "Removed frontend/build"
fi

# ============================================================================
# 5. Clean logs and temporary files
# ============================================================================
echo ""
echo "📋 Cleaning logs and temporary files..."

# Remove log files
find . -name "*.log" -type f -delete 2>/dev/null || true
print_status "Removed .log files"

# Remove temporary files
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*.temp" -type f -delete 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true
print_status "Removed temporary files"

# Remove swap files
find . -name "*.swp" -type f -delete 2>/dev/null || true
find . -name "*.swo" -type f -delete 2>/dev/null || true
print_status "Removed swap files"

# Remove logs directory if it exists
if [ -d "logs" ]; then
    rm -rf logs
    print_status "Removed logs directory"
fi

# ============================================================================
# 6. Clean OS-specific files
# ============================================================================
echo ""
echo "💻 Cleaning OS-specific files..."

# macOS
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
print_status "Removed .DS_Store files"

# Windows
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
find . -name "Desktop.ini" -type f -delete 2>/dev/null || true
print_status "Removed Windows artifacts"

# ============================================================================
# 7. Clean cache directories
# ============================================================================
echo ""
echo "🗄️ Cleaning cache directories..."

# Remove various cache directories
rm -rf .cache 2>/dev/null || true
rm -rf .npm 2>/dev/null || true
rm -rf .yarn 2>/dev/null || true
find . -type d -name ".cache" -exec rm -rf {} + 2>/dev/null || true
print_status "Removed cache directories"

# ============================================================================
# 8. Clean Docker artifacts (optional)
# ============================================================================
echo ""
echo "🐳 Docker cleanup options..."

read -p "Do you want to clean Docker images and containers? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down 2>/dev/null || true
    print_status "Stopped Docker containers"
    
    read -p "Remove Docker volumes too? This will delete all data! (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v 2>/dev/null || true
        print_status "Removed Docker volumes"
    fi
else
    print_warning "Skipped Docker cleanup"
fi

# ============================================================================
# 9. Clean environment files
# ============================================================================
echo ""
echo "🔐 Environment files check..."

if [ -f ".env.local" ]; then
    print_warning "Found .env.local - keeping for local development"
fi

if [ -f ".env" ]; then
    print_warning "Found .env - ensure it's in .gitignore before committing"
fi

# ============================================================================
# 10. Verify .gitignore
# ============================================================================
echo ""
echo "📝 Verifying .gitignore..."

if [ -f ".gitignore" ]; then
    print_status ".gitignore exists"
    
    # Check if .env is in .gitignore
    if grep -q "^\.env$" .gitignore || grep -q "^\*\.env$" .gitignore; then
        print_status ".env is properly ignored"
    else
        print_error ".env is NOT in .gitignore! Add it before committing!"
    fi
else
    print_error ".gitignore not found! Create one before committing!"
fi

# ============================================================================
# 11. Git status check
# ============================================================================
echo ""
echo "🔍 Git status check..."

if [ -d ".git" ]; then
    echo ""
    echo "Current git status:"
    git status --short
    echo ""
    
    # Check for large files
    echo "Checking for large files (>10MB)..."
    find . -type f -size +10M ! -path "./.git/*" ! -path "*/node_modules/*" -exec ls -lh {} \; | awk '{print $9, $5}'
    
    # Count files
    total_files=$(git ls-files | wc -l)
    print_status "Total tracked files: $total_files"
else
    print_warning "Not a git repository"
fi

# ============================================================================
# 12. Summary
# ============================================================================
echo ""
echo "=============================================="
echo "✨ Cleanup Complete!"
echo "=============================================="
echo ""
echo "📊 Summary:"
echo "  ✓ Node.js artifacts removed"
echo "  ✓ Python artifacts removed"
echo "  ✓ Go artifacts removed"
echo "  ✓ Build outputs removed"
echo "  ✓ Logs and temporary files removed"
echo "  ✓ OS-specific files removed"
echo "  ✓ Cache directories removed"
echo ""
echo "📋 Next Steps:"
echo "  1. Review git status above"
echo "  2. Commit your changes: git add . && git commit -m 'Clean up for deployment'"
echo "  3. Push to repository: git push"
echo "  4. Deploy to Vercel/Netlify: vercel --prod OR netlify deploy --prod"
echo ""
echo "🔗 Deployment Resources:"
echo "  - Vercel: vercel --prod"
echo "  - Netlify: netlify deploy --prod"
echo "  - Docker: docker-compose up -d"
echo "  - See DEPLOYMENT.md for detailed instructions"
echo ""
print_status "Repository is ready for deployment! 🚀"
