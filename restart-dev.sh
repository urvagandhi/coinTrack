#!/usr/bin/env bash
# Stop anything already running on the backend/frontend ports, then start fresh instances.
# The PreBootIndexMigration in backend/src/main/java/com/urva/myfinance/coinTrack/migration/
# automatically fixes any conflicting MongoDB indexes (e.g. the 15s price_ttl_index) on boot.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
LOG_DIR="$ROOT/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

mkdir -p "$LOG_DIR"

info() { printf '%s\n' "$*"; }
warn() { printf 'WARN: %s\n' "$*" >&2; }

stop_port() {
  local port="$1" label="$2"
  local pids
  pids="$(lsof -ti "tcp:${port}" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    info "Stopping ${label} on port ${port} (pids: ${pids//$'\n'/,})..."
    kill $pids 2>/dev/null || true
    sleep 2
    pids="$(lsof -ti "tcp:${port}" 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      info "Process ignored SIGTERM — force killing ${label} on port ${port}..."
      kill -9 $pids 2>/dev/null || true
      sleep 1
    fi
  else
    info "Port ${port} (${label}) is free."
  fi
}

wait_port() {
  local port="$1" label="$2" timeout="${3:-180}"
  local i=0
  while (( i < timeout )); do
    if lsof -ti "tcp:${port}" >/dev/null 2>&1; then
      info "${label} is UP on port ${port}."
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  warn "${label} did not bind port ${port} within ${timeout}s. Check ${LOG_DIR}/${label}.log"
  return 1
}

info "Stopping existing servers..."
stop_port "$BACKEND_PORT" "backend"
stop_port "$FRONTEND_PORT" "frontend"

info ""
info "Starting backend (./mvnw spring-boot:run) on port ${BACKEND_PORT}..."
(
  cd "$BACKEND_DIR"
  exec ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
) >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
wait_port "$BACKEND_PORT" "backend" 300

info "Starting frontend (npm run dev) on port ${FRONTEND_PORT}..."
(
  cd "$FRONTEND_DIR"
  exec npm run dev
) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
wait_port "$FRONTEND_PORT" "frontend" 180

info ""
info "==========================================="
info "  Backend  : http://localhost:${BACKEND_PORT}  (pid ${BACKEND_PID})"
info "  Frontend : http://localhost:${FRONTEND_PORT}  (pid ${FRONTEND_PID})"
info "  Logs     : ${BACKEND_LOG}"
info "            ${FRONTEND_LOG}"
info "==========================================="