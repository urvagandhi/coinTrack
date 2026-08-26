# 🐳 coinTrack Docker & Containerization Guide

[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-v2.0+-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](#)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-000000?style=for-the-badge&logo=next.js&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#)

Welcome to the official **coinTrack** Containerization & Docker Setup Guide. This guide provides industry-standard, production-grade instructions for building, deploying, running, and scaling the entire coinTrack application stack using **Docker** and **Docker Compose**.

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Prerequisites & System Requirements](#-prerequisites--system-requirements)
- [Quick Start Guide](#-quick-start-guide)
- [Environment Configuration & Secrets](#-environment-configuration--secrets)
- [Detailed Service Breakdown](#-detailed-service-breakdown)
  - [1. MongoDB Database (`mongodb`)](#1-mongodb-database-mongodb)
  - [2. Backend Service (`backend`)](#2-backend-service-backend)
  - [3. Frontend Service (`frontend`)](#3-frontend-service-frontend)
- [Building & Running Standalone Images](#-building--running-standalone-images)
- [Production Deployment Playbook](#-production-deployment-playbook)
  - [Deploying Backend to Render.com](#deploying-backend-to-rendercom)
  - [Deploying Frontend to Vercel / Railway](#deploying-frontend-to-vercel--railway)
  - [Deploying Stack to AWS ECS / GCP Cloud Run](#deploying-stack-to-aws-ecs--gcp-cloud-run)
- [Security Hardening & Best Practices](#-security-hardening--best-practices)
- [Operations, Monitoring & Maintenance](#-operations-monitoring--maintenance)
  - [Viewing Logs](#viewing-logs)
  - [Health Checks & Diagnostics](#health-checks--diagnostics)
  - [Database Backups & Restoration](#database-backups--restoration)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🏗️ Architecture Overview

The coinTrack container architecture is structured as a decoupled 3-tier micro-service system connected over a dedicated, isolated internal Docker bridge network (`cointrack-network`).

```mermaid
graph TD
    Client[📱 Web Browser / Client]
    
    subgraph Docker Host Environment
        subgraph cointrack-network [Docker Bridge Network: cointrack-network]
            FrontendContainer["🎨 Frontend Container (Next.js 16)<br/>Port: 3000 | User: nextjs"]
            BackendContainer["⚙️ Backend Container (Spring Boot 3)<br/>Port: 8080 | User: appuser"]
            MongoContainer["🗄️ Database Container (MongoDB 7.0)<br/>Port: 27017 | Auth Enabled"]
        end

        MongoVolume[("💾 Persistent Named Volume<br/>mongo-data")]
    end

    Client -->|HTTP / Port 3000| FrontendContainer
    Client -->|REST API / Port 8080| BackendContainer
    FrontendContainer -->|Internal Proxy / HTTP 8080| BackendContainer
    BackendContainer -->|MongoDB Protocol / Port 27017| MongoContainer
    MongoContainer --- MongoVolume

    classDef container fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef database fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef volume fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff;
    
    class FrontendContainer,BackendContainer container;
    class MongoContainer database;
    class MongoVolume volume;
```

### Key Architectural Highlights
1. **Multi-Stage Builds:** Lightweight runtime images created using Alpine Linux base images (`node:20-alpine`, `eclipse-temurin:21-jre-alpine`).
2. **Layer Caching:** Dependency resolution is isolated from source code changes (Spring Boot `layertools` & NPM cache layering).
3. **Least Privilege Security:** Containers run as non-root users (`nextjs` UID 1001, `appuser` GID appgroup).
4. **Resilient Startup & Health Probes:** Services utilize `healthcheck` dependencies ensuring Spring Boot starts only when MongoDB is healthy, and Next.js starts only after Spring Boot is ready.

---

## 💻 Prerequisites & System Requirements

### Recommended System Specifications
- **CPU:** Dual-core 2.0 GHz or higher (x86_64 or ARM64 / Apple Silicon)
- **RAM:** Minimum 4 GB RAM (8 GB recommended for concurrent builds)
- **Disk Space:** 5 GB free disk space

### Required Software
Make sure you have installed:
- [Docker Engine](https://docs.docker.com/get-docker/) (v24.0.0+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20.0+ included with Docker Desktop / CLI)

Verify installation in your terminal:
```bash
docker --version
docker compose version
```

---

## 🚀 Quick Start Guide

Spin up the complete coinTrack stack locally with a single command:

### 1. Clone the Repository & Navigate to Root
```bash
git clone https://github.com/urvagandhi/coinTrack.git
cd coinTrack
```

### 2. Prepare Environment Variables
Copy the provided `.env.docker.example` file to `.env`:
```bash
cp .env.docker.example .env
```

> [!NOTE]
> For local development, `.env.docker.example` contains safe working defaults. No immediate edits are required to get the stack running.

### 3. Launch the Stack with Docker Compose
```bash
docker compose up -d --build
```

### 4. Verify Service Status
Check that all containers are healthy:
```bash
docker compose ps
```

Expected Output:
```text
NAME                 IMAGE               COMMAND                  SERVICE             STATUS
cointrack-backend    cointrack-backend   "sh -c 'exec java $J…"   backend             running (healthy)
cointrack-frontend   cointrack-frontend  "docker-entrypoint.s…"   frontend            running (healthy)
cointrack-mongodb    mongo:7.0-noble     "docker-entrypoint.s…"   mongodb             running (healthy)
```

### 5. Access the Application
- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Backend Actuator Health:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **MongoDB Database:** `mongodb://cointrack_admin:cointrack_secure_password_123@localhost:27017/Finance?authSource=admin`

---

## 🔑 Environment Configuration & Secrets

The application consumes environment variables injected at container startup. Below is the reference matrix:

### Configuration Reference Matrix

| Parameter | Required | Target Service | Description |
| :--- | :---: | :---: | :--- |
| `SPRING_PROFILES_ACTIVE` | No | Backend | Active Spring profile (`dev` / `prod`) |
| `PORT` | No | Backend / Frontend | Server port (default: `8080` backend, `3000` frontend) |
| `MONGODB_URI` | **Yes** | Backend | MongoDB connection URI (`mongodb://...` or Atlas `mongodb+srv://...`) |
| `MONGODB_DB` | No | Backend | Target database name (default: `Finance`) |
| `JWT_SECRET` | **Yes** | Backend | HMAC-SHA256 256-bit signing key for JWT tokens |
| `ENCRYPTION_SECRET_KEY` | **Yes** | Backend | AES-256-GCM secret key (exactly 32 characters) |
| `TOTP_ENCRYPTION_KEY` | **Yes** | Backend | Encryption key for 2FA / TOTP secrets (64 hex characters) |
| `EMAIL_MAGIC_LINK_SECRET` | **Yes** | Backend | Passwordless authentication magic link key |
| `BREVO_API_KEY` | Optional | Backend | Brevo API key for transactional email delivery |
| `BREVO_SENDER_EMAIL` | Optional | Backend | Transactional email sender address |
| `BREVO_SENDER_NAME` | Optional | Backend | Transactional email sender display name |
| `EMAIL_SUPPORT` | Optional | Backend | Support email address |
| `EMAIL_BASE_URL` | **Yes** | Backend | Public frontend URL for email links |
| `EMAIL_API_BASE_URL` | **Yes** | Backend | Backend API base URL for static email logo assets |
| `GOLDAPI_KEY` | Optional | Backend | GoldAPI.io key for live precious metal pricing |
| `GOOGLE_CLIENT_ID` | Optional | Backend | Google OAuth Client ID for backend token validation |
| `GOOGLE_CLIENT_SECRET` | Optional | Backend | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | Optional | Backend | Google OAuth redirect callback URI |
| `FRONTEND_URL` | **Yes** | Backend | Public frontend URL for OAuth redirects |
| `CORS_ALLOWED_ORIGINS` | **Yes** | Backend | Comma-separated list of permitted CORS origins |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Frontend | Public application base URL |
| `NEXT_PUBLIC_API_BASE` | **Yes** | Frontend | Backend API base URL for Next.js proxy/requests |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | Frontend | Google OAuth Client ID for frontend button |
| `IFSC_API_KEY` | Optional | Frontend | Bank IFSC Lookup API key |
| `NEXT_PUBLIC_APP_NAME` | No | Frontend | Application display name (default: `CoinTrack`) |
| `NEXT_PUBLIC_APP_VERSION` | No | Frontend | Application version (default: `3.0.0`) |
| `NEXT_PUBLIC_ENABLE_WEBSOCKETS` | No | Frontend | WebSocket feature flag (`true`/`false`) |
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | No | Frontend | Notification feature flag (`true`/`false`) |
| `NEXT_PUBLIC_DEBUG` | No | Frontend | Debug mode flag (`true`/`false`) |

> [!CAUTION]
> **Strict Secret Security:** To prevent credential leaks, secrets are **NEVER hardcoded** inside `docker-compose.yml` or Dockerfiles. Docker Compose automatically reads variables directly from the gitignored `.env` file at container startup.


---

## 🧩 Detailed Service Breakdown

### 1. MongoDB Database (`mongodb`)
- **Base Image:** `mongo:7.0-noble`
- **Container Name:** `cointrack-mongodb`
- **Exposed Port:** `27017`
- **Persistence:** Volume `mongo-data` mapped to `/data/db`
- **Health Check Command:**
  ```bash
  mongosh --eval "db.runCommand('ping').ok" --quiet
  ```

### 2. Backend Service (`backend`)
- **Dockerfile Path:** `./backend/Dockerfile`
- **Base Build Image:** `maven:3.9.9-eclipse-temurin-21-alpine`
- **Base Runtime Image:** `eclipse-temurin:21-jre-alpine`
- **Security Context:** Runs under non-root user `appuser`
- **JVM Optimization Flags:**
  ```text
  -XX:+UseContainerSupport 
  -XX:MaxRAMPercentage=75.0 
  -XX:+ExitOnOutOfMemoryError 
  -XX:+UseG1GC 
  -XX:MaxGCPauseMillis=200
  ```
- **Health Check Command:**
  ```bash
  curl -f http://localhost:8080/actuator/health
  ```

### 3. Frontend Service (`frontend`)
- **Dockerfile Path:** `./frontend/Dockerfile`
- **Base Image:** `node:20-alpine`
- **Build Output Mode:** `standalone` (`next.config.mjs`)
- **Security Context:** Runs under non-root user `nextjs` (UID 1001)
- **Health Check Command:**
  ```bash
  wget --no-verbose --tries=1 --spider http://localhost:3000/
  ```

---

## 📦 Building & Running Standalone Images

If you prefer building and running images individually without Docker Compose:

### Building Backend Image
```bash
docker build -t cointrack-backend:latest ./backend
```

### Running Backend Container
```bash
docker run -d \
  --name cointrack-backend-standalone \
  -p 8080:8080 \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/Finance" \
  -e JWT_SECRET="your-secure-jwt-secret-key-32chars" \
  -e ENCRYPTION_SECRET_KEY="12345678901234567890123456789012" \
  -e TOTP_ENCRYPTION_KEY="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2" \
  cointrack-backend:latest
```

### Building Frontend Image
```bash
docker build -t cointrack-frontend:latest ./frontend
```

### Running Frontend Container
```bash
docker run -d \
  --name cointrack-frontend-standalone \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE="http://localhost:8080" \
  cointrack-frontend:latest
```

---

## 🚢 Production Deployment Playbook

### Deploying Backend to Render.com
1. Connect your repository to Render.
2. Select **New Web Service** -> Choose `backend` directory.
3. Environment: **Docker**.
4. Set Dockerfile Path: `Dockerfile` (or `backend/Dockerfile`).
5. In the Render Dashboard, add required Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `ENCRYPTION_SECRET_KEY`, `TOTP_ENCRYPTION_KEY`, `FRONTEND_URL`, etc.).
6. Set Health Check Path: `/actuator/health`.

### Deploying Frontend to Vercel / Railway
1. **Vercel:** Import `frontend` project directly. Vercel automatically detects Next.js framework settings. Add environment variable `NEXT_PUBLIC_API_BASE` pointing to your backend URL.
2. **Railway / Cloud Run:** Use `./frontend/Dockerfile`. Railway automatically builds using multi-stage Next.js standalone container.

### Deploying Stack to AWS ECS / GCP Cloud Run
1. Push built images to **Amazon ECR** or **Google Artifact Registry**:
   ```bash
   docker tag cointrack-backend:latest gcr.io/YOUR_PROJECT_ID/cointrack-backend:latest
   docker push gcr.io/YOUR_PROJECT_ID/cointrack-backend:latest
   ```
2. Deploy backend service on Cloud Run / ECS Fargate with container memory limits set to at least `1 GiB`.
3. Wire MongoDB Atlas connection string into environment variables.

---

## 🔒 Security Hardening & Best Practices

1. **Non-Root Execution:** All production runtime containers explicitly enforce unprivileged user execution (`USER appuser` / `USER nextjs`) to prevent container breakout vulnerabilities.
2. **Minimal Surface Attack Area:** Base images utilize minimal Alpine distributions (`alpine`), eliminating unnecessary shell utilities, compilers, and packages.
3. **No Embedded Credentials:** Secrets are strictly injected via runtime environment variables and excluded from image layers via `.dockerignore`.
4. **PID 1 Signal Propagation:** Entrypoints utilize `exec` form (e.g. `exec java $JAVA_OPTS ...`) ensuring SIGTERM signals reach Java / Node processes directly for clean shutdown without data corruption.
5. **Image Vulnerability Scanning:** Regularly scan built images using Trivy or Docker Scout:
   ```bash
   docker scout cves cointrack-backend:latest
   docker scout cves cointrack-frontend:latest
   ```

---

## 🛠️ Operations, Monitoring & Maintenance

### Viewing Logs
View realtime aggregated logs for all services:
```bash
docker compose logs -f
```

View logs for a specific service:
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### Health Checks & Diagnostics
Check live resource usage stats (CPU, RAM, Network I/O):
```bash
docker stats
```

Inspect health status details of containers:
```bash
docker inspect --format='{{json .State.Health}}' cointrack-backend | jq .
```

### Database Backups & Restoration

#### Backup MongoDB Database
To create a compressed dump of your local MongoDB container data:
```bash
docker exec -t cointrack-mongodb mongodump \
  --username cointrack_admin \
  --password cointrack_secure_password_123 \
  --authenticationDatabase admin \
  --db Finance \
  --archive=/data/db/backup_$(date +%Y%m%d_%H%M%S).gz --gzip
```

#### Restore MongoDB Database
To restore a backup dump into the container:
```bash
docker exec -i cointrack-mongodb mongorestore \
  --username cointrack_admin \
  --password cointrack_secure_password_123 \
  --authenticationDatabase admin \
  --db Finance \
  --archive=/data/db/backup_FILE.gz --gzip
```

### Stopping and Cleaning Up
Stop all running containers:
```bash
docker compose stop
```

Stop containers and remove network resources (preserves database volume):
```bash
docker compose down
```

Stop containers and **purge all persistent database data**:
```bash
docker compose down -v
```

---

## ❓ Troubleshooting & FAQ

| Symptom / Error | Root Cause | Resolution Step |
| :--- | :--- | :--- |
| `backend` container fails startup with `IllegalArgumentException: Secret key must be 32 characters` | `ENCRYPTION_SECRET_KEY` is missing or not exactly 32 characters long. | Provide a 32-character string in `.env` (e.g. `12345678901234567890123456789012`). |
| `backend` container stuck in `starting` status | Waiting for MongoDB health check to pass or slow initial Maven/Java startup. | Verify MongoDB container status (`docker compose ps`). Allow up to 40s for initial Spring Boot warmup. |
| CORS error in browser when calling `/api/*` | `CORS_ALLOWED_ORIGINS` or `FRONTEND_URL` mismatch with host origin. | Ensure `CORS_ALLOWED_ORIGINS` includes `http://localhost:3000` in `.env`. |
| Next.js build fails with `output standalone not found` | Next.js configuration missing standalone output flag. | Ensure `output: 'standalone'` is set in `frontend/next.config.mjs`. |
| MongoDB container fails with permission denied | Docker volume permissions issue on Linux host. | Run `docker compose down -v` and recreate volume with default user permissions. |
| Out of Memory (OOM) error during Maven build | Container default memory limit too low for Java compilation. | Allocate at least 4 GB RAM to Docker Desktop engine settings. |

---

<p align="center">
  <b>coinTrack Containerization System</b> • Built with Spring Boot, Next.js & Docker
</p>
