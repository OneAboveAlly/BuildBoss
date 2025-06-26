# ⚡ BuildBoss Quick Start Guide

Get BuildBoss running in production in 15 minutes!

## 🚀 Super Quick Deployment

### 1. Server Setup (5 minutes)
```bash
# On fresh Ubuntu 22.04 server
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt install git -y
newgrp docker
```

### 2. Clone & Configure (3 minutes)
```bash
# Clone repository
git clone https://github.com/your-username/buildboss.git
cd buildboss

# Quick environment setup
cp env.docker.example .env

# Generate secure secrets
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
```

### 3. Deploy (5 minutes)
```bash
# Start production environment
docker-compose up -d

# Wait for services to be ready
docker-compose logs -f app

# Verify deployment
curl http://localhost:5000/api/health
```

### 4. Access Your Application (2 minutes)
- **Application**: http://your-server-ip:5000
- **Health Check**: http://your-server-ip:5000/api/health
- **Admin Panel**: http://your-server-ip:5000/admin

## 🔧 Production Hardening

### SSL Setup (10 minutes)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Update environment
echo "CLIENT_URL=https://yourdomain.com" >> .env
docker-compose restart
```

### Basic Security (5 minutes)
```bash
# Setup firewall
sudo ufw enable
sudo ufw allow 22,80,443/tcp

# Enable auto-updates
sudo apt install unattended-upgrades -y
```

## 📋 Essential Commands

### Service Management
```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f [service]

# Restart services
docker-compose restart

# Update application
git pull && docker-compose up -d --build
```

### Health Monitoring
```bash
# Quick health check
curl http://localhost:5000/api/health

# Detailed health check
curl http://localhost:5000/api/health/detailed

# System metrics
curl http://localhost:5000/api/health/system
```

### Backup Commands
```bash
# Database backup
docker-compose exec -T postgres pg_dump -U buildboss buildboss > backup.sql

# Restore backup
cat backup.sql | docker-compose exec -T postgres psql -U buildboss buildboss
```

## 🛠️ Common Configuration

### Environment Variables Quick Reference
```bash
# Required (generate with: openssl rand -base64 32)
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Optional - Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional - Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional - OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Docker Compose Profiles
```bash
# Development
docker-compose --profile dev up

# Production (default)
docker-compose up -d

# Monitoring stack
docker-compose --profile monitoring up -d
```

## 🚨 Troubleshooting

### Application Won't Start
1. Check logs: `docker-compose logs app`
2. Verify environment: `docker-compose exec app env | grep NODE_ENV`
3. Rebuild: `docker-compose down && docker-compose up -d --build`

### Database Issues
1. Check status: `docker-compose exec postgres pg_isready -U buildboss`
2. Reset database: `docker-compose down -v && docker-compose up -d`

### Network Problems
1. Check ports: `docker-compose ps`
2. Test connectivity: `curl http://localhost:5000/api/health`
3. Check firewall: `sudo ufw status`

## 📊 Monitoring Setup

### Basic Monitoring (1 minute)
```bash
# Add to crontab
echo "*/5 * * * * curl -sf http://localhost:5000/api/health || echo 'Health check failed' | mail -s 'BuildBoss Alert' admin@yourdomain.com" | crontab -
```

### Advanced Monitoring
For comprehensive monitoring, see [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md#monitoring--health-checks)

## 🔄 Automated Deployment

### Using Deploy Script
```bash
# Make executable
chmod +x deployment-scripts/deploy.sh

# Deploy latest
./deployment-scripts/deploy.sh

# Deploy specific version
./deployment-scripts/deploy.sh production v1.2.0
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Deploy to Production
  run: |
    ssh user@server 'cd /path/to/buildboss && ./deployment-scripts/deploy.sh production ${{ github.ref_name }}'
```

## 📚 Next Steps

1. **Security**: Follow [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md#security-hardening) security guide
2. **Backup**: Setup automated backups
3. **Monitoring**: Configure external monitoring (UptimeRobot, etc.)
4. **Scaling**: Plan for horizontal scaling
5. **CI/CD**: Setup automated deployments

## 🆘 Support

- **Documentation**: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- **Docker Guide**: [DOCKER.md](DOCKER.md)
- **Issues**: Check application logs and health endpoints
- **Community**: Submit issues on GitHub

---

**BuildBoss SaaS** - Empowering construction teams across Europe! 🏗️

*Need help? Check our comprehensive [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md)* 