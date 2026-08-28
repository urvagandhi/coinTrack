#!/usr/bin/env bash
set -e

# Color definitions
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log_box() {
  local title="$1"
  local color="${2:-$CYAN}"
  echo -e "\n${color}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${color}║ ${title} ║${NC}"
  echo -e "${color}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

run_step() {
  local step_num="$1"
  local step_name="$2"
  shift 2
  local start_time=$(date +%s)

  echo -e "${BOLD}${CYAN}▶ Executing: ${step_num}. ${step_name}${NC}"
  
  if "$@"; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo -e "${GREEN}✔ ${step_num}. ${step_name} passed cleanly in ${duration}s${NC}\n"
    return 0
  else
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo -e "${RED}✖ ${step_num}. ${step_name} failed after ${duration}s${NC}\n"
    return 1
  fi
}

OVERALL_START=$(date +%s)
log_box "⚡ STARTING END-TO-END BACKEND PRODUCTION PIPELINE            " "$MAGENTA"

cd "$(dirname "$0")/.."

# Phase 1: Java Source Compilation
run_step 1 "Java Source & Test Compilation" ./mvnw test-compile

# Phase 2: Production Package Build
run_step 2 "SpringBoot Production Package (Layered JAR)" ./mvnw clean package -DskipTests

OVERALL_END=$(date +%s)
TOTAL_DURATION=$((OVERALL_END - OVERALL_START))

log_box "🎉 ALL PIPELINE PHASES PASSED! BACKEND IS PRODUCTION READY   " "$GREEN"
echo -e "${BOLD}${BLUE}Pipeline Summary Report:${NC}"
echo -e "  ✔ 1. Java Compilation               : ${GREEN}PASSED${NC}"
echo -e "  ✔ 2. Production Layered Package Build: ${GREEN}PASSED${NC}"
echo -e "\n${BOLD}Total Duration:${NC} ${TOTAL_DURATION}s\n"
