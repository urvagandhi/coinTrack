This folder contains Docker-related files for the backend service.

Files:
- Dockerfile            -> multi-stage Dockerfile used to build and run the Spring Boot JAR
- docker-compose.yml    -> convenience compose file to build and run the backend image (context: backend root)
- .dockerignore         -> copy for readability (actual build uses backend/.dockerignore)

Quick usage (from project root):

# Build with docker-compose (compose file is in backend/docker)
cd backend/docker
# This compose uses context: .. so it will build the backend using the Dockerfile in this folder
docker compose up --build

# Or build image directly from backend (recommended):
cd backend
docker build -t cointrack-backend:latest .

after building, run:

docker run --rm -p 8080:8080 cointrack-backend:latest

Notes:
- The docker-compose file sets the build context to the backend root ("..") so the Dockerfile path is docker/Dockerfile relative to that context.
- Keep `backend/.dockerignore` in place; Docker will use that when building with context set to backend.
