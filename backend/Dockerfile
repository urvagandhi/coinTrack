# ==========================================
# CoinTrack Backend - Production Dockerfile
# For Render.com Deployment
# ==========================================

# 1. BUILD STAGE
# Using Maven with Eclipse Temurin Java 21 on Alpine for minimal footprint
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy POM first to cache dependencies (layer optimization)
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Download dependencies without building source
# Use -B for batch mode (no interactive prompts)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
# -DskipTests: Tests should be run in CI, not during container build
RUN mvn clean package -DskipTests -B

# 2. RUNTIME STAGE
# Use JRE instead of JDK for smaller image size and security
FROM eclipse-temurin:21-jre-alpine

# Security: Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install curl for healthcheck (wget may not be available)
RUN apk add --no-cache curl

WORKDIR /app

# Copy JAR from builder stage
# Use explicit JAR name to avoid ambiguity
COPY --from=builder /app/target/coinTrack-0.0.1-SNAPSHOT.jar app.jar

# Configuration: Set ownership to non-root user
RUN chown appuser:appgroup app.jar

# Security: Switch to non-root user
USER appuser

# Expose port (Documentation only, does not publish port)
EXPOSE 8080

# Environment variables (Defaults, can be overridden)
ENV SPRING_PROFILES_ACTIVE=prod
# Render uses PORT environment variable
ENV SERVER_PORT=${PORT:-8080}

# Healthcheck using curl instead of wget
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Launch application
# -XX:+UseContainerSupport: Make JVM aware of container CPU/Memory limits
# -XX:MaxRAMPercentage=75.0: Allow JVM to use 75% of container memory
# -Dserver.port: Use Render's PORT environment variable
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
