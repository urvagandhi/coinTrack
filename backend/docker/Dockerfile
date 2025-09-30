# Stage 1: build the application
FROM maven:3.9.4-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only pom and download dependencies (cached layer)
COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

# Copy the rest of the source
COPY src ./src

# Build the jar (uses spring-boot-maven-plugin to create executable jar)
RUN mvn -B -DskipTests package

# Stage 2: create lightweight runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy jar from builder stage (wildcard in case of -SNAPSHOT naming)
COPY --from=build /app/target/*.jar app.jar
## In production, ensure Spring binds to the port Render assigns via the PORT env var.
# Also disable Spring DevTools restart/livereload in the runtime container to avoid
# unexpected restarts.
ENV SPRING_DEVTOOLS_RESTART_ENABLED=false \
	SPRING_DEVTOOLS_LIVERELOAD_ENABLED=false

EXPOSE 8080

# Use sh -c so we can expand the PORT env var with a default of 8080.
# This sets the Spring property server.port from the PORT environment variable
# provided by Render (or falls back to 8080 locally).
ENTRYPOINT ["sh","-c","java -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
