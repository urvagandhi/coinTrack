# ==========================================
# CoinTrack Backend - Production Dockerfile
# ==========================================

# 1. BUILD STAGE
# Using Maven with Eclipse Temurin Java 21 on Alpine for minimal footprint
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy POM first to cache dependencies (layer optimization)
COPY pom.xml .
# Download dependencies without building source
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
# -DskipTests: Tests should be run in CI, not during container build
RUN mvn clean package -DskipTests

# 2. RUNTIME STAGE
# Use JRE instead of JDK for smaller image size and security
FROM eclipse-temurin:21-jre-alpine

# Security: Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Configuration: Set ownership to non-root user
RUN chown appuser:appgroup app.jar

# Security: Switch to non-root user
USER appuser

# Expose port (Documentation only, does not publish port)
EXPOSE 8080

# Environment variables (Defaults, can be overridden)
ENV SPRING_PROFILES_ACTIVE=prod

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

# Launch application
# -XX:+UseContainerSupport: Make JVM aware of container CPU/Memory limits
# -XX:MaxRAMPercentage=75.0: Allow JVM to use 75% of container memory
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
