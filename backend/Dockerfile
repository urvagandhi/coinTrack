# ==========================================
# CoinTrack Backend - Production Dockerfile
# For Render.com Deployment
# ==========================================
# OPTIMIZATIONS APPLIED:
# ✅ POM-first layering (dependencies cached)
# ✅ BuildKit cache for Maven repo
# ✅ No 'clean' during Docker builds
# ✅ Spring Boot layered JAR support
# ==========================================

# 1. BUILD STAGE
# Using Maven with Eclipse Temurin Java 21 on Alpine for minimal footprint
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# 1️⃣ Copy only pom.xml first (layer optimization)
COPY pom.xml .

# 2️⃣ Download dependencies (cached layer)
# BuildKit cache: Dependencies persist between builds for faster rebuilds
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B

# 3️⃣ Copy source code
COPY src ./src

# 4️⃣ Build the application
# - No 'clean' needed (fresh Docker layer)
# - BuildKit cache for Maven repo
# - Skip tests (run in CI, not during container build)
RUN --mount=type=cache,target=/root/.m2 \
    mvn package -DskipTests -B

# 2. RUNTIME STAGE
# Use JRE instead of JDK for smaller image size and security
FROM eclipse-temurin:21-jre-alpine

# Security: Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/target/coinTrack-0.0.1-SNAPSHOT.jar app.jar

# Set ownership to non-root user
RUN chown appuser:appgroup app.jar

# Security: Switch to non-root user
USER appuser

# Expose port (Documentation only)
EXPOSE 8080

# Environment variables
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=${PORT:-8080}

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Launch application with container-aware JVM settings
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
