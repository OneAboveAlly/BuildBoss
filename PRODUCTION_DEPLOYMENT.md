# 🚀 BuildBoss Production Deployment Guide

Complete guide for deploying BuildBoss SaaS platform to production environments.

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Server Requirements](#server-requirements)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Application Deployment](#application-deployment)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Backup Strategy](#backup-strategy)
- [Security Hardening](#security-hardening)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software
- **Docker**: 24.0+ with Docker Compose v2
- **Git**: For code deployment
- **Certbot**: For SSL certificates (Let's Encrypt)
- **UFW**: Firewall management (Ubuntu/Debian)

### Domain & DNS Setup
1. Purchase domain (e.g., `yourbuildbot.com`)
2. Configure DNS A records:
   - `@` → Server IP (main domain)
   - `www` → Server IP (www subdomain)
   - `api` → Server IP (API subdomain, optional)

## 🖥️ Server Requirements

### Minimum Production Specs
- **CPU**: 2 cores (4+ recommended)
- **RAM**: 4GB (8GB+ recommended)
- **Storage**: 50GB SSD (100GB+ recommended)
- **Network**: 100 Mbps (1 Gbps recommended)
- **OS**: Ubuntu 22.04 LTS or Debian 12

### Recommended Cloud Providers
- **DigitalOcean**: $20-40/month droplet
- **Linode**: $24-48/month VPS
- **AWS**: t3.medium EC2 instance
- **Hetzner**: CPX21 or CPX31

## 🏗️ Initial Setup

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git ufw fail2ban nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Logout and login to apply docker group
```

### 2. User Setup
```bash
# Create application user
sudo adduser buildboss
sudo usermod -aG docker buildboss
sudo su - buildboss

# Setup SSH key authentication
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Copy your public key to ~/.ssh/authorized_keys
```

### 3. Firewall Configuration
```bash
# Reset UFW (if needed)
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if needed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
sudo ufw enable
```

## 🔐 Environment Configuration

### 1. Clone Repository
```bash
cd /home/buildboss
git clone https://github.com/your-username/buildboss.git
cd buildboss
```

### 2. Environment Variables
```bash
# Copy production environment template
cp env.docker.example .env

# Edit with production values
nano .env
```

### Required Production Environment Variables
```bash
# Database Configuration
POSTGRES_PASSWORD=your_super_secure_db_password_32_chars
DATABASE_URL=postgresql://buildboss:your_super_secure_db_password_32_chars@postgres:5432/buildboss

# Application Security
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
SESSION_SECRET=your_session_secret_minimum_32_characters
NODE_ENV=production
PORT=5000

# Domain Configuration
CLIENT_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api

# Email Configuration (Production SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=BuildBoss <noreply@yourdomain.com>

# Payment Processing (Stripe Production)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key

# OAuth (Google Production)
GOOGLE_CLIENT_ID=your_google_production_client_id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_production_client_secret

# Redis Configuration
REDIS_URL=redis://redis:6379

# Security Headers
HELMET_CSP_DIRECTIVES=default-src 'self'; script-src 'self' 'unsafe-inline' js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' api.stripe.com;

# File Upload Limits
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Generate Secure Secrets
```bash
# Generate strong passwords and secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For SESSION_SECRET  
openssl rand -base64 32  # For POSTGRES_PASSWORD
```

## 🗄️ Database Setup

### 1. Database Initialization
```bash
# Start only PostgreSQL first
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
docker-compose logs -f postgres

# Run database migrations
docker-compose exec postgres psql -U buildboss -d buildboss -c "SELECT version();"
```

### 2. Database Optimization
```bash
# Create production PostgreSQL config
sudo mkdir -p /opt/buildboss/postgres
sudo tee /opt/buildboss/postgres/postgresql.conf << EOF
# Production PostgreSQL Configuration
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4
EOF
```

## 🔒 SSL/TLS Configuration

### 1. Obtain SSL Certificate
```bash
# Stop nginx if running
sudo systemctl stop nginx

# Obtain certificate with Certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. SSL Configuration
```bash
# Create SSL directory
sudo mkdir -p /opt/buildboss/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/buildboss/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/buildboss/ssl/
sudo chown -R buildboss:buildboss /opt/buildboss/ssl/
```

### 3. Update Nginx Configuration
```nginx
# nginx.conf - Production SSL Configuration
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }
    
    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;
        
        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;
        
        # API Proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app:5000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Auth endpoints with stricter rate limiting
        location ~ ^/api/(auth|login|register) {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://app:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Static files
        location /uploads/ {
            alias /var/www/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Frontend
        location / {
            proxy_pass http://app:5000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## 🚀 Application Deployment

### 1. Build Production Image
```bash
# Build optimized production image
docker-compose build --no-cache

# Verify build
docker images | grep buildboss
```

### 2. Start Production Services
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# Monitor startup logs
docker-compose logs -f
```

### 3. Database Migration
```bash
# Run database migrations
docker-compose exec app npm run db:migrate

# Seed initial data (if needed)
docker-compose exec app npm run db:seed
```

### 4. Health Check Verification
```bash
# Test application health
curl -f http://localhost:5000/api/health || exit 1

# Test full health check
curl -f http://localhost:5000/api/health/detailed || exit 1

# Test HTTPS access
curl -f https://yourdomain.com/api/health || exit 1
```

## 📊 Monitoring & Health Checks

### 1. System Monitoring Script
```bash
# Create monitoring script
sudo tee /opt/buildboss/monitor.sh << 'EOF'
#!/bin/bash

# BuildBoss Production Monitoring Script
LOGFILE="/var/log/buildboss-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log messages
log_message() {
    echo "[$TIMESTAMP] $1" | sudo tee -a $LOGFILE
}

# Check Docker services
if ! docker-compose -f /home/buildboss/buildboss/docker-compose.yml ps | grep -q "Up"; then
    log_message "ERROR: Some Docker services are down"
    docker-compose -f /home/buildboss/buildboss/docker-compose.yml up -d
fi

# Check application health
if ! curl -sf http://localhost:5000/api/health > /dev/null; then
    log_message "ERROR: Application health check failed"
    docker-compose -f /home/buildboss/buildboss/docker-compose.yml restart app
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log_message "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.2f%%", $3*100/$2}' | sed 's/%//')
if [ $(echo "$MEM_USAGE > 90" | bc) -eq 1 ]; then
    log_message "WARNING: Memory usage is ${MEM_USAGE}%"
fi

log_message "INFO: Health check completed successfully"
EOF

# Make executable
sudo chmod +x /opt/buildboss/monitor.sh

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/buildboss/monitor.sh") | crontab -
```

### 2. Log Rotation
```bash
# Configure log rotation
sudo tee /etc/logrotate.d/buildboss << EOF
/var/log/buildboss-monitor.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}

/opt/buildboss/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
```

## 💾 Backup Strategy

### 1. Database Backup Script
```bash
# Create backup script
sudo tee /opt/buildboss/backup.sh << 'EOF'
#!/bin/bash

# BuildBoss Production Backup Script
BACKUP_DIR="/opt/buildboss/backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f /home/buildboss/buildboss/docker-compose.yml exec -T postgres pg_dump -U buildboss buildboss > $DB_BACKUP_FILE

# Uploads backup
docker run --rm -v buildboss_app_uploads:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads_backup_$TIMESTAMP.tar.gz /data

# Compress database backup
gzip $DB_BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
EOF

# Make executable
sudo chmod +x /opt/buildboss/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/buildboss/backup.sh") | crontab -
```

### 2. Remote Backup (Optional)
```bash
# Install AWS CLI for S3 backups
sudo apt install awscli

# Configure AWS credentials
aws configure

# Add S3 sync to backup script
echo 'aws s3 sync $BACKUP_DIR s3://your-backup-bucket/buildboss/' >> /opt/buildboss/backup.sh
```

## 🛡️ Security Hardening

### 1. Fail2Ban Configuration
```bash
# Configure Fail2Ban for Nginx
sudo tee /etc/fail2ban/jail.d/nginx.conf << EOF
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 10
bantime = 1800
EOF

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### 2. Security Updates
```bash
# Enable automatic security updates
sudo apt install unattended-upgrades

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Docker Security
```bash
# Set Docker daemon security options
sudo tee /etc/docker/daemon.json << EOF
{
  "userns-remap": "default",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true
}
EOF

# Restart Docker
sudo systemctl restart docker
```

## ⚡ Performance Optimization

### 1. System Optimization
```bash
# Optimize sysctl parameters
sudo tee -a /etc/sysctl.conf << EOF
# Network optimization
net.core.somaxconn = 65536
net.core.netdev_max_backlog = 65536
net.ipv4.tcp_max_syn_backlog = 65536
net.ipv4.tcp_fin_timeout = 10

# File system optimization
fs.file-max = 2097152
EOF

# Apply changes
sudo sysctl -p
```

### 2. Docker Resource Limits
```yaml
# Add to docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          memory: 1G
  
  postgres:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          memory: 512M
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose exec app env | grep -E "(NODE_ENV|DATABASE_URL)"

# Rebuild if needed
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U buildboss

# Check network connectivity
docker-compose exec app ping postgres

# Reset database if needed
docker-compose down -v
docker-compose up -d postgres
```

#### 3. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Renew certificate
sudo certbot renew --force-renewal

# Update nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Check system resources
htop
iotop

# Check application metrics
curl http://localhost:5000/api/health/system
```

### Emergency Procedures

#### 1. Quick Restart
```bash
cd /home/buildboss/buildboss
docker-compose restart
```

#### 2. Full Reset
```bash
cd /home/buildboss/buildboss
docker-compose down
docker system prune -f
docker-compose up -d
```

#### 3. Database Recovery
```bash
# Stop application
docker-compose stop app

# Restore from backup
gunzip -c /opt/buildboss/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
docker-compose exec -T postgres psql -U buildboss buildboss

# Start application
docker-compose start app
```

## 📈 Post-Deployment Checklist

### Immediate Verification
- [ ] Application accessible via HTTPS
- [ ] Health checks passing
- [ ] Database connectivity working
- [ ] File uploads functioning
- [ ] Email sending working
- [ ] Payment processing active (if applicable)
- [ ] User registration/login working
- [ ] SSL certificate valid

### Security Verification
- [ ] Firewall configured correctly
- [ ] Fail2Ban active
- [ ] Security headers present
- [ ] Rate limiting functional
- [ ] No sensitive data in logs

### Monitoring Setup
- [ ] Health check monitoring active
- [ ] Log rotation configured
- [ ] Backup script scheduled
- [ ] Disk space monitoring active
- [ ] Performance monitoring setup

### Documentation
- [ ] Environment variables documented
- [ ] Backup procedures documented
- [ ] Emergency contacts updated
- [ ] Deployment process documented

---

## 🚀 Next Steps

After successful deployment:
1. Set up external monitoring (e.g., UptimeRobot)
2. Configure alerting (email/Slack notifications)
3. Implement CI/CD pipeline for automated deployments
4. Set up staging environment
5. Plan scaling strategy

For support, refer to the [troubleshooting section](#troubleshooting) or contact the development team.

---

*Last updated: 2025-06-26* 