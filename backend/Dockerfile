# Backend Dockerfile
# ──────────────────
# Multi-stage build:
# Stage 1 (builder): Install deps and compile TypeScript
# Stage 2 (runner):  Only copy the compiled JS + production deps

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (including devDeps for build)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source and run TypeScript compiler
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Production stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001

# Copy only what's needed at runtime
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create logs directory
RUN mkdir -p logs && chown -R appuser:nodejs logs

USER appuser

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.js"]
