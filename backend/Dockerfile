# ==========================================
# CoinTrack Backend - Production Dockerfile
# For Render.com Deployment
# ==========================================
# OPTIMIZATIONS APPLIED:
# - POM-first layering (dependency layer cached)
# - BuildKit cache for Maven repo
# - Spring Boot layertools (real layer splitting, not just a fat JAR copy)
# - Non-root user for security
# - exec form entrypoint -> Java is PID 1, gets signals directly (fast/clean shutdown)
# ==========================================

# 1. BUILD STAGE
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# 1. Copy only pom.xml first (dependency layer caching)
COPY pom.xml .

# 2. Download dependencies (cached layer)
# BuildKit cache: Dependencies persist between builds for faster rebuilds
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B

# 3. Copy source code
COPY src ./src

# 4. Build the application
# - No 'clean' needed (fresh Docker layer)
# - BuildKit cache for Maven repo
# - Skip tests (run in CI, not during container build)
RUN --mount=type=cache,target=/root/.m2 \
    mvn package -DskipTests -B

# Extract layers from the fat JAR (dependencies / spring-boot-loader / snapshot-deps / application)
RUN java -Djarmode=layertools -jar target/coinTrack-0.0.1-SNAPSHOT.jar extract --destination extracted

# 2. RUNTIME STAGE
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && apk add --no-cache curl

WORKDIR /app

# Copy layers in order of change-frequency (least -> most likely to change)
# This means a code-only change only invalidates the last layer.
COPY --from=builder /app/extracted/dependencies/ ./
COPY --from=builder /app/extracted/spring-boot-loader/ ./
COPY --from=builder /app/extracted/snapshot-dependencies/ ./
COPY --from=builder /app/extracted/application/ ./

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

# Security: Switch to non-root user
USER appuser

# Expose port (Documentation only)
EXPOSE 8080

# ==========================================
# Environment Variables
# ==========================================
# Required (set in Render dashboard / env):
#   MONGODB_URI             - MongoDB Atlas connection string
#   JWT_SECRET              - 256-bit JWT signing key (hex)
#   ENCRYPTION_SECRET_KEY   - AES-256 key (exactly 32 chars)
#   TOTP_ENCRYPTION_KEY     - TOTP secret encryption (64 hex chars)
#   BREVO_API_KEY           - Brevo transactional email API key
#   FRONTEND_URL            - Frontend origins (comma-separated)
#   EMAIL_BASE_URL          - Base URLs for email links (comma-separated)
#   EMAIL_API_BASE_URL      - Backend API URLs for email assets (comma-separated)
#   CORS_ALLOWED_ORIGINS    - Allowed CORS origins (comma-separated)
#
# Optional:
#   PORT                    - Server port (default: 8080)
#   SPRING_PROFILES_ACTIVE  - Profile (default: prod)
# ==========================================

ENV SPRING_PROFILES_ACTIVE=prod

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# JVM flags for container-awareness + fast, predictable GC pauses
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Djava.security.egd=file:/dev/./urandom -Dfile.encoding=UTF-8"

# exec form: Java runs as PID 1, receives SIGTERM directly -> fast graceful shutdown
# org.springframework.boot.loader.launch.JarLauncher is the entrypoint for layered JARs (Boot 3.2+)
# If you're on Boot < 3.2, use: org.springframework.boot.loader.JarLauncher
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} -Dserver.port=${PORT:-8080} org.springframework.boot.loader.launch.JarLauncher"]