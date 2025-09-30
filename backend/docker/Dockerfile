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

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]
