#!/usr/bin/env bash
# run.sh — Start the Hello World game (backend + frontend).
#
# 1. Kills any previously running backend/frontend processes.
# 2. Finds an available port for the backend, starts uvicorn.
# 3. Finds an available port for the frontend, starts vite dev server
#    with a proxy pointing at the backend.
# 4. Prints the URL (compatible with VS Code port forwarding).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Prefer a local .venv; fall back to the fixed Docker-image path.
if [[ -d "$BACKEND_DIR/.venv" ]]; then
  BACKEND_VENV="$BACKEND_DIR/.venv"
elif [[ -d /opt/backend-venv ]]; then
  BACKEND_VENV=/opt/backend-venv
else
  BACKEND_VENV="$BACKEND_DIR/.venv"
fi

# Docker-friendly defaults; override with env vars.
# Set BACKEND_PORT=auto or FRONTEND_PORT=auto to request dynamic assignment.
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# Find an available TCP port by briefly binding to port 0.
find_available_port() {
  python3 -c "
import socket
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind(('', 0))
    print(s.getsockname()[1])
"
}

# Kill processes that match a pattern, ignoring grep itself and this script.
kill_matching() {
  local pattern="$1"
  local pids
  pids=$(ps aux | grep -E "$pattern" | grep -v grep | grep -v "run.sh" | awk '{print $2}' || true)
  if [[ -n "$pids" ]]; then
    echo "Killing existing processes matching '$pattern': $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

echo "=== Stopping existing services ==="
kill_matching "uvicorn app.main:app"
kill_matching "vite.*hello-world-game"
kill_matching "node.*vite.*frontend"

if [[ "$BACKEND_PORT" == "auto" ]]; then
  BACKEND_PORT=$(find_available_port)
fi

if [[ "$FRONTEND_PORT" == "auto" ]]; then
  FRONTEND_PORT=$(find_available_port)
fi

echo ""
echo "Backend  port: $BACKEND_PORT"
echo "Frontend port: $FRONTEND_PORT"

echo ""
echo "=== Starting backend (FastAPI + uvicorn) ==="
cd "$BACKEND_DIR"

if [[ ! -x "$BACKEND_VENV/bin/python" ]]; then
  echo "Error: backend virtual environment not found at $BACKEND_VENV" >&2
  echo "Run ./install.sh first." >&2
  exit 1
fi

"$BACKEND_VENV/bin/python" -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "$BACKEND_PORT" \
  --log-level info &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait briefly for the backend to be ready.
for i in $(seq 1 20); do
  if curl -s "http://localhost:${BACKEND_PORT}/api/health" >/dev/null 2>&1; then
    echo "Backend is ready."
    break
  fi
  sleep 0.5
done

echo ""
echo "=== Starting frontend (Vite dev server) ==="
cd "$SCRIPT_DIR/frontend"
VITE_API_URL="http://localhost:${BACKEND_PORT}" \
  npx vite --host 0.0.0.0 --port "$FRONTEND_PORT" &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait briefly for the frontend to be ready.
for i in $(seq 1 20); do
  if curl -s "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

echo ""
echo "========================================"
echo "  Game is running!"
echo ""
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  Backend:  http://localhost:${BACKEND_PORT}"
echo "  API docs: http://localhost:${BACKEND_PORT}/docs"
echo ""
echo "  If running inside VS Code Server / devcontainer,"
echo "  the ports will be auto-forwarded to your host browser."
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both services."

# Trap SIGINT/SIGTERM so Ctrl+C cleanly stops both processes.
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BACKEND_PID" 2>/dev/null || true
  kill "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo "Done."
}
trap cleanup SIGINT SIGTERM

# Wait for either process to exit.
wait
