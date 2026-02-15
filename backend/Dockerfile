# Build stage not required for Node backend - single stage

FROM node:20-alpine

WORKDIR /app

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies (npm install tolerates outdated lock file; use npm ci if lock is in sync)
RUN npm install --omit=dev && npm cache clean --force

# Copy application (must include database/init.pg.sql for auto-create tables)
COPY . .
RUN test -f /app/database/init.pg.sql || (echo "ERROR: database/init.pg.sql missing" && exit 1)

# Create logs dir for writable volume if needed
RUN mkdir -p logs && chown -R nodejs:nodejs /app

USER nodejs

ENV PORT=5000
EXPOSE 5000

# Health check – server listens immediately; /health returns 200 as soon as app is up
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
