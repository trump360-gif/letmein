# =============================================================================
# Beauti CMS - Multi-stage Dockerfile for CodeB Blue-Green Deployment
# =============================================================================
# Build from repo root: docker build -f apps/web/Dockerfile -t beauti-cms .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Install build tools for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package.json package-lock.json turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/

# Install dependencies (security: ignore postinstall scripts)
RUN npm ci --ignore-scripts

# -----------------------------------------------------------------------------
# Stage 2: Prisma Generation
# -----------------------------------------------------------------------------
FROM node:20-alpine AS prisma
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY packages/db ./packages/db

# Generate Prisma client (dummy URL for build time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

# -----------------------------------------------------------------------------
# Stage 3: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies and prisma client
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/packages/db ./packages/db

# Copy source code
COPY package.json package-lock.json turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the web app
RUN npm run build --workspace=apps/web

# Ensure public folder exists
RUN mkdir -p /app/apps/web/public

# -----------------------------------------------------------------------------
# Stage 4: Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install openssl for Prisma engine detection (OpenSSL 3.x on Alpine 3.17+)
RUN apk add --no-cache openssl

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

# Create upload directory for bot images
RUN mkdir -p /app/uploads/bot && chown -R nextjs:nodejs /app

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/health || exit 1

ENV PORT=3000
EXPOSE 3000

# Start Next.js
CMD ["sh", "-c", "cd /app/apps/web && node /app/node_modules/.bin/next start -p ${PORT}"]
