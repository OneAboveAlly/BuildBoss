# Docker Deployment Guide

## Quick Start

### Development Environment

1. **Copy environment file:**
   ```bash
   cp env.docker.example .env
   ```

2. **Edit environment variables:**
   Update `.env` with your configuration:
   - Database passwords
   - JWT secrets
   - Email configuration
   - Payment processor keys

3. **Start development environment:**
   ```bash
   npm run docker:dev
   ```

4. **Access the application:**
   - Application: http://localhost:5000
   - Database: localhost:5432
   - Redis: localhost:6379

### Production Environment

1. **Build production image:**
   ```bash
   npm run docker:build
   ```

2. **Start production environment:**
   ```bash
   npm run docker:prod
   ```

3. **Check logs:**
   ```bash
   npm run docker:logs
   ```

## Services

The Docker setup includes:

- **App**: Node.js application (buildboss-app)
- **Database**: PostgreSQL 15 (buildboss-db)
- **Cache**: Redis 7 (buildboss-redis)
- **Proxy**: Nginx (buildboss-nginx)

## Health Checks

All services include health checks:
- **App**: HTTP check on `/api/health`
- **Database**: PostgreSQL connection check
- **Redis**: Redis ping check
- **Nginx**: Built-in health check

## Storage

Persistent volumes:
- `postgres_data`: Database storage
- `redis_data`: Redis persistence
- `app_uploads`: File uploads
- `app_logs`: Application logs

## Security Features

### Application Security
- Non-root user (nodejs:nodejs)
- Security headers via Nginx
- Rate limiting on API routes
- CSRF protection
- Input validation

### Network Security
- Internal Docker network
- Only necessary ports exposed
- Nginx reverse proxy

### Data Security
- Encrypted environment variables
- Secure session handling
- File upload restrictions

## Environment Variables

### Required Variables
```bash
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### Optional Variables
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_CLIENT_ID=your-google-client-id
```

## Database Setup

### Initial Setup
The database is automatically initialized with:
- User: `buildboss`
- Database: `buildboss`
- Migrations: Auto-applied on startup

### Manual Migration
```bash
docker-compose exec app npm run db:migrate
```

### Database Console
```bash
docker-compose exec postgres psql -U buildboss -d buildboss
```

## Backup & Recovery

### Database Backup
```bash
docker-compose exec postgres pg_dump -U buildboss buildboss > backup.sql
```

### Database Restore
```bash
docker-compose exec -T postgres psql -U buildboss buildboss < backup.sql
```

### Volume Backup
```bash
docker run --rm -v buildboss_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Monitoring

### Container Status
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

### Application Logs
```bash
# All services
npm run docker:logs

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f nginx
```

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
```

### Load Balancing
Nginx automatically load balances between app replicas.

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   docker-compose down
   sudo fuser -k 5000/tcp
   ```

2. **Database connection error:**
   ```bash
   docker-compose logs postgres
   docker-compose restart postgres
   ```

3. **Permission denied:**
   ```bash
   sudo chown -R $USER:$USER .
   ```

4. **Out of disk space:**
   ```bash
   docker system prune -a
   docker volume prune
   ```

### Reset Everything
```bash
npm run docker:clean
docker-compose up --build
```

## Performance Optimization

### Production Recommendations

1. **Use environment-specific images:**
   ```dockerfile
   FROM node:18-alpine AS production
   ```

2. **Enable caching:**
   - Redis for sessions
   - Nginx for static assets

3. **Resource limits:**
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

4. **Health check intervals:**
   ```yaml
   healthcheck:
     interval: 30s
     timeout: 10s
     retries: 3
   ```

## Security Checklist

- [ ] Change default passwords
- [ ] Use secure JWT secrets
- [ ] Configure HTTPS (production)
- [ ] Enable firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup encryption
- [ ] Network segmentation

## SSL/HTTPS Setup

For production with SSL:

1. **Place certificates:**
   ```
   ssl/
   ├── cert.pem
   └── key.pem
   ```

2. **Update nginx.conf:**
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
   }
   ```

3. **Restart nginx:**
   ```bash
   docker-compose restart nginx
   ``` 