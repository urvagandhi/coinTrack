#!/usr/bin/env bash
# ==============================================================================
# CoinTrack - Sync Environment Variables for Docker Compose
# Assembles backend/.env and frontend/.env into the root .env with defaults
# ==============================================================================
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Syncing backend/.env and frontend/.env into root .env..."

cat << 'EOF' > .env
# ==============================================================================
# CoinTrack - Unified Docker Environment Configuration (.env)
# Automatically assembled from backend/.env and frontend/.env with container defaults
# ==============================================================================

# --- Container / Database Defaults ---
MONGO_INITDB_ROOT_USERNAME=cointrack_admin
MONGO_INITDB_ROOT_PASSWORD=cointrack_secure_password_123
MONGO_DATABASE=Finance
BREVO_SENDER_EMAIL=cointrack.urva@gmail.com
BREVO_SENDER_NAME=CoinTrack Support
EMAIL_SUPPORT=cointrack.urva@gmail.com

EOF

if [ -f "backend/.env" ]; then
  echo "# --- Backend Configuration (backend/.env) ---" >> .env
  cat "backend/.env" >> .env
  echo "" >> .env
fi

if [ -f "frontend/.env" ]; then
  echo "# --- Frontend Configuration (frontend/.env) ---" >> .env
  cat "frontend/.env" >> .env
  echo "" >> .env
fi

echo "✓ Root .env generated successfully."
