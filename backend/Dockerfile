# Build stage not required for Node backend - single stage

FROM node:20-alpine

WORKDIR /app

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies (npm install tolerates outdated lock file; use npm ci if lock is in sync)
RUN npm install --omit=dev && npm cache clean --force

# Copy application
COPY . .

# Create logs dir for writable volume if needed
RUN mkdir -p logs && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
