# CoinTrack Backend — Docker & Deployment Guide

> **Role**: Senior DevOps Engineer
> **Status**: Production-Ready
> **Target**: Render / Cloud Containers

---

## 1. Purpose of Docker in CoinTrack

We use Docker to achieve **Environment Parity**. The code that runs on your local machine is exactly the same as the code running in production. This eliminates "it works on my machine" bugs.

By containerizing the Spring Boot backend, we ensure:
1.  **Isolation**: The app ships with its own Java 21 runtime.
2.  **Security**: Runs as a non-root user with strictly defined permissions.
3.  **Portability**: Can migrate from Render to AWS/GCP without code changes.

---

## 2. Folder Structure

All DevOps-related files are isolated in `backend/docker/`.

```
backend/docker/
├── Dockerfile          # Production multi-stage build definition
├── docker-compose.yml  # Local development orchestration (DB + App)
├── .dockerignore       # Strict exclusions to keep image small & secure
└── README.md           # This guide
```

---

## 3. Docker Architecture Overview

We use a **Multi-Stage Build** process to keep the final image approximately 150MB (vs 500MB+ if we included Maven).

```text
[Stage 1: Build]
Source Code ──> Maven Wrapper ──> mvn package ──> app.jar
                                     │
                                     │ Copy JAR
                                     ▼
[Stage 2: Runtime]
Alpine JRE 21 ──> Create appuser ──> java -jar app.jar
```

---

## 4. Environment Variables (CRITICAL)

The application is **Stateless** and **Configurable**. It reads behaviour from Environment Variables.

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SPRING_PROFILES_ACTIVE` | Config profile | YES | `prod` / `dev` |
| `MONGO_URI` | MongoDB Connection String | YES | `mongodb+srv://user:pass@cluster.mongocluster.com/cointrack` |
| `JWT_SECRET` | Signing key for JWTs (HS256) | YES | `long_random_string_min_32_chars` |
| `ENCRYPTION_KEY` | AES Key for encrypted DB fields | YES | `32_char_string_exactly_1234567` |
| `FRONTEND_URL` | CORS Origin Allowlist | YES | `https://cointrack-web.onrender.com` |

> [!WARNING]
> **NEVER** commit these values to Git. Use the Render Dashboard or a local `.env` file.
> **NOTE**: Broker credentials (API Key/Secret) are **NOT** env vars. They are stored encrypted in the MongoDB database per user.

---

## 5. Local Development Setup

To test the containerized stack locally:

1.  **Navigate to backend root**:
    ```bash
    cd backend
    ```

2.  **Build & Run with Compose**:
    ```bash
    # Uses -f to point to the docker-compose in docker/ folder
    docker-compose -f docker/docker-compose.yml up --build
    ```

3.  **Verify**:
    - Backend: `http://localhost:8080/health`
    - MongoDB: `localhost:27017`

> **Note**: The `docker-compose.yml` sets `SPRING_PROFILES_ACTIVE=dev`, which enables debug logging and uses the local MongoDB container.

---

## 6. Production Image Build

If you need to build the production image manually:

```bash
# Build context MUST be the backend/ root directory
docker build -t cointrack-backend:latest -f docker/Dockerfile .
```

---

## 7. Render Deployment Guide (VERY IMPORTANT)

Render does not use `docker-compose`. It manages containers directly.

### Step 1: Create Web Service
1.  Go to Render Dashboard → New → Web Service.
2.  Connect your GitHub repository.

### Step 2: Configure Environment
- **Runtime**: Docker
- **Root Directory**: `backend` (This is crucial so Docker finds `pom.xml`)
- **Dockerfile Path**: `docker/Dockerfile` (Relative to Root Directory)

### Step 3: Set Environment Variables
Add the keys from Section 4 (`MONGO_URI`, `JWT_SECRET`, etc.) in the Render "Environment" tab.

### Step 4: Health Check
Render will ask for a Health Check Path.
- **Path**: `/actuator/health` (or whatever your custom health endpoint is)

### Auto-Deploy
Render will automatically rebuild and redeploy whenever you push to the `main` branch.

---

## 8. Security Best Practices

1.  **Non-Root User**: The Dockerfile explicitly creates an `appuser`. If an attacker compromises the container, they only have restricted permissions, not root access to the host.
2.  **Minimal Base Image**: We use `alpine` limits the attack surface (fewer unneeded system binaries).
3.  **Encrypted Secrets**: Database fields for broker secrets are encrypted at rest using `EncryptionUtil` + `ENCRYPTION_KEY`.
4.  **No Hardcoded Secrets**: The codebase contains NO credentials.

---

## 9. Logging & Observability

- **Logs** are written to `STDOUT/STDERR`.
- Docker captures these streams automatically.
- **Render**: View logs in the "Logs" tab of your service.
- **Correlation**: Every log line includes `[requestId=...]` for tracing user requests across logs.

---

## 10. Scaling & Performance Notes

- **JVM Tuning**: The Dockerfile uses `-XX:MaxRAMPercentage=75.0`. This means if you give the Render instance 1GB RAM, Java will use ~750MB for Heap, leaving room for the OS overhead.
- **Horizontal Scaling**: The backend is stateless. You can scale to 2, 5, or 10 instances on Render. A Load Balancer will distribute traffic.

---

## 11. Troubleshooting Guide

**Problem**: Container crashes immediately with "Connection refused".
- **Cause**: Database connectivity.
- **Fix**: Check `MONGO_URI`. Ensure your Mongo Cluster allows connections from Render IPs (0.0.0.0/0 whitelist often needed for SaaS DBs).

**Problem**: `JwtFilter` throws errors.
- **Cause**: `JWT_SECRET` mismatch or missing.
- **Fix**: Verify env var is set and matches the one used to generate tokens.

**Problem**: Broker API fails with "Bad Credentials".
- **Cause**: Local DB has old/invalid encrypted secrets.
- **Fix**: Re-connect the broker account via the UI to update stored credentials.

---

## 12. Production Readiness Checklist

- [ ] `MONGO_URI` points to a secure Atlas/Cloud cluster (not localhost).
- [ ] `JWT_SECRET` is complex (random 64+ chars).
- [ ] `ENCRYPTION_KEY` is set.
- [ ] Render Health Check path is configured.
- [ ] Logging level is `INFO` (not DEBUG) via `SPRING_PROFILES_ACTIVE=prod`.

---

**CoinTrack Backend Engineering**
