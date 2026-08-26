# ==========================================
# CoinTrack Frontend - Multi-Stage Dockerfile
# Production Optimized for Next.js (Standalone)
# ==========================================

# ------------------------------------------
# 1. DEPENDENCIES STAGE
# ------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package descriptors
COPY package.json package-lock.json ./

# Install dependencies using clean install
RUN npm ci

# ------------------------------------------
# 2. BUILDER STAGE
# ------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Arguments for NEXT_PUBLIC Environment Variables (passed from build context)
ARG NEXT_PUBLIC_API_BASE=http://localhost:8080
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ARG NEXT_PUBLIC_APP_NAME=CoinTrack
ARG NEXT_PUBLIC_APP_VERSION=3.0.0
ARG NEXT_PUBLIC_ENABLE_WEBSOCKETS=true
ARG NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
ARG NEXT_PUBLIC_DEBUG=false

ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_PUBLIC_ENABLE_WEBSOCKETS=${NEXT_PUBLIC_ENABLE_WEBSOCKETS}
ENV NEXT_PUBLIC_ENABLE_NOTIFICATIONS=${NEXT_PUBLIC_ENABLE_NOTIFICATIONS}
ENV NEXT_PUBLIC_DEBUG=${NEXT_PUBLIC_DEBUG}

# Set environment for build time optimization
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Disable husky during docker build
ENV HUSKY=0

# Build Next.js application
RUN npm run build

# ------------------------------------------
# 3. RUNNER STAGE (Production Image)
# ------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a system group and non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache wget

# Create static cache directory and set correct permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Security: Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
