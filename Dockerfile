# Multi-stage build for BuildBoss SaaS App
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production
RUN cd server && npm ci --only=production
RUN cd client && npm ci

# Frontend build stage
FROM base AS frontend-build
WORKDIR /app/client
COPY client/ .
RUN npm run build

# Backend stage
FROM base AS backend
WORKDIR /app/server

# Copy server source
COPY server/ .

# Generate Prisma client
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS production

# Install system dependencies for production
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy server files
COPY --from=backend --chown=nodejs:nodejs /app/server ./server
COPY --from=frontend-build --chown=nodejs:nodejs /app/client/dist ./client/dist

# Copy root package.json for scripts
COPY --chown=nodejs:nodejs package*.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node server/healthcheck.js || exit 1

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server/server.js"] 