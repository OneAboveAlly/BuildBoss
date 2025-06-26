#!/bin/bash

# BuildBoss Production Deployment Script
# Usage: ./deploy.sh [environment] [version]
# Example: ./deploy.sh production v1.2.0

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
PROJECT_NAME="buildboss"
DEPLOY_USER="buildboss"
DEPLOY_DIR="/home/$DEPLOY_USER/$PROJECT_NAME"
BACKUP_DIR="/opt/$PROJECT_NAME/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as deploy user
    if [ "$USER" != "$DEPLOY_USER" ]; then
        error "This script must be run as user: $DEPLOY_USER"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if in project directory
    if [ ! -f "docker-compose.yml" ]; then
        error "docker-compose.yml not found. Are you in the project directory?"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check environment file
    if [ ! -f ".env" ]; then
        error "Environment file .env not found"
        exit 1
    fi
    
    # Check required environment variables
    source .env
    REQUIRED_VARS=("POSTGRES_PASSWORD" "JWT_SECRET" "SESSION_SECRET")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if services are running
    if docker compose ps | grep -q "Up"; then
        warning "Some services are already running"
    fi
    
    success "Pre-deployment checks passed"
}

# Create backup
create_backup() {
    log "Creating backup before deployment..."
    
    TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    
    # Create backup directory if it doesn't exist
    sudo mkdir -p $BACKUP_DIR
    sudo chown $DEPLOY_USER:$DEPLOY_USER $BACKUP_DIR
    
    # Database backup
    if docker compose ps postgres | grep -q "Up"; then
        log "Creating database backup..."
        docker compose exec -T postgres pg_dump -U buildboss buildboss > "$BACKUP_DIR/pre_deploy_db_$TIMESTAMP.sql"
        gzip "$BACKUP_DIR/pre_deploy_db_$TIMESTAMP.sql"
        success "Database backup created"
    fi
    
    # Uploads backup
    if docker volume ls | grep -q "${PROJECT_NAME}_app_uploads"; then
        log "Creating uploads backup..."
        docker run --rm \
            -v ${PROJECT_NAME}_app_uploads:/data \
            -v $BACKUP_DIR:/backup \
            alpine tar czf /backup/pre_deploy_uploads_$TIMESTAMP.tar.gz /data
        success "Uploads backup created"
    fi
    
    success "Backup completed"
}

# Pull latest code
pull_code() {
    log "Pulling latest code..."
    
    # Store current commit hash
    CURRENT_COMMIT=$(git rev-parse HEAD)
    echo $CURRENT_COMMIT > "$BACKUP_DIR/last_commit.txt"
    
    # Pull latest changes
    git fetch origin
    
    if [ "$VERSION" = "latest" ]; then
        git checkout main
        git pull origin main
    else
        git checkout "$VERSION"
    fi
    
    NEW_COMMIT=$(git rev-parse HEAD)
    log "Deployed commit: $NEW_COMMIT"
    
    success "Code updated"
}

# Build application
build_application() {
    log "Building application..."
    
    # Build Docker images
    docker compose build --no-cache
    
    success "Application built"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Start database if not running
    if ! docker compose ps postgres | grep -q "Up"; then
        docker compose up -d postgres
        
        # Wait for database to be ready
        log "Waiting for database to be ready..."
        timeout 60 bash -c 'until docker compose exec postgres pg_isready -U buildboss; do sleep 2; done'
    fi
    
    # Run migrations
    docker compose exec app npm run db:migrate
    
    success "Database migrations completed"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Stop services gracefully
    docker compose down --timeout 30
    
    # Start services
    docker compose up -d
    
    # Wait for application to be ready
    log "Waiting for application to be ready..."
    timeout 120 bash -c 'until curl -sf http://localhost:5000/api/health > /dev/null; do sleep 5; done'
    
    success "Application deployed"
}

# Post-deployment verification
post_deployment_verification() {
    log "Running post-deployment verification..."
    
    # Check service status
    if ! docker compose ps | grep -q "Up"; then
        error "Some services are not running"
        return 1
    fi
    
    # Check health endpoints
    if ! curl -sf http://localhost:5000/api/health > /dev/null; then
        error "Health check failed"
        return 1
    fi
    
    if ! curl -sf http://localhost:5000/api/health/detailed > /dev/null; then
        error "Detailed health check failed"
        return 1
    fi
    
    # Check database connectivity
    if ! docker compose exec postgres pg_isready -U buildboss; then
        error "Database is not ready"
        return 1
    fi
    
    # Check logs for errors
    if docker compose logs --since=5m | grep -i error; then
        warning "Found errors in recent logs"
    fi
    
    success "Post-deployment verification passed"
}

# Cleanup old images and volumes
cleanup() {
    log "Cleaning up old images and volumes..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old backups (keep last 30 days)
    find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
    
    success "Cleanup completed"
}

# Rollback function
rollback() {
    error "Deployment failed. Starting rollback..."
    
    # Get last commit
    if [ -f "$BACKUP_DIR/last_commit.txt" ]; then
        LAST_COMMIT=$(cat "$BACKUP_DIR/last_commit.txt")
        log "Rolling back to commit: $LAST_COMMIT"
        git checkout $LAST_COMMIT
    fi
    
    # Stop current services
    docker compose down
    
    # Restore database if backup exists
    LATEST_DB_BACKUP=$(ls -t $BACKUP_DIR/pre_deploy_db_*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_DB_BACKUP" ]; then
        log "Restoring database from backup..."
        docker compose up -d postgres
        timeout 60 bash -c 'until docker compose exec postgres pg_isready -U buildboss; do sleep 2; done'
        gunzip -c "$LATEST_DB_BACKUP" | docker compose exec -T postgres psql -U buildboss buildboss
    fi
    
    # Start services
    docker compose up -d
    
    warning "Rollback completed"
}

# Main deployment function
main() {
    log "Starting deployment of $PROJECT_NAME ($ENVIRONMENT environment, version: $VERSION)"
    
    # Change to project directory
    cd $DEPLOY_DIR
    
    # Set trap for rollback on error
    trap rollback ERR
    
    check_prerequisites
    pre_deployment_checks
    create_backup
    pull_code
    build_application
    run_migrations
    deploy_application
    post_deployment_verification
    cleanup
    
    # Disable trap
    trap - ERR
    
    success "Deployment completed successfully!"
    log "Application is available at: https://$(hostname -f)"
    log "Health check: https://$(hostname -f)/api/health"
    
    # Display service status
    echo ""
    log "Service status:"
    docker compose ps
}

# Help function
show_help() {
    echo "BuildBoss Production Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [version]"
    echo ""
    echo "Arguments:"
    echo "  environment    Deployment environment (default: production)"
    echo "  version        Git tag or branch to deploy (default: latest)"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy latest to production"
    echo "  $0 production v1.2.0         # Deploy specific version"
    echo "  $0 staging main              # Deploy main branch to staging"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac 