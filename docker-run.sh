#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="${IMAGE_NAME:-hello-world-game:test}"
CONTAINER_NAME="${CONTAINER_NAME:-hello-world-game-test}"

PREFERRED_FRONTEND_PORT="${HOST_FRONTEND_PORT:-3000}"
PREFERRED_BACKEND_PORT="${HOST_BACKEND_PORT:-8000}"

find_free_port() {
  python3 -c "
import socket
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind(('', 0))
    print(s.getsockname()[1])
"
}

is_port_free() {
  local port="$1"
  if lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
    return 1
  fi
  return 0
}

pick_host_port() {
  local preferred="$1"
  if is_port_free "$preferred"; then
    echo "$preferred"
    return
  fi

  while true; do
    local candidate
    candidate="$(find_free_port)"
    if is_port_free "$candidate"; then
      echo "$candidate"
      return
    fi
  done
}

# Always build the image to ensure it's up to date
echo "Building Docker image '$IMAGE_NAME'..."
docker build --no-cache -t "$IMAGE_NAME" "$SCRIPT_DIR"
echo "Image built successfully."
echo

HOST_FRONTEND_PORT="$(pick_host_port "$PREFERRED_FRONTEND_PORT")"
HOST_BACKEND_PORT="$(pick_host_port "$PREFERRED_BACKEND_PORT")"

echo "Using host frontend port: ${HOST_FRONTEND_PORT} (container 3000)"
echo "Using host backend port:  ${HOST_BACKEND_PORT} (container 8000)"

cd "$SCRIPT_DIR"

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${HOST_FRONTEND_PORT}:3000" \
  -p "${HOST_BACKEND_PORT}:8000" \
  "$IMAGE_NAME" >/dev/null

for _ in $(seq 1 40); do
  if curl -sf "http://localhost:${HOST_BACKEND_PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -sf "http://localhost:${HOST_BACKEND_PORT}/api/health" >/dev/null 2>&1; then
  echo "Backend did not become reachable on host port ${HOST_BACKEND_PORT}." >&2
  docker logs --tail 80 "$CONTAINER_NAME" >&2 || true
  exit 1
fi

for _ in $(seq 1 40); do
  if curl -sf "http://localhost:${HOST_FRONTEND_PORT}" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -sf "http://localhost:${HOST_FRONTEND_PORT}" >/dev/null 2>&1; then
  echo "Frontend did not become reachable on host port ${HOST_FRONTEND_PORT}." >&2
  docker logs --tail 80 "$CONTAINER_NAME" >&2 || true
  exit 1
fi

echo
echo "Container is running and accessible from host browser:"
echo "Frontend: http://localhost:${HOST_FRONTEND_PORT}"
echo "Backend:  http://localhost:${HOST_BACKEND_PORT}"
echo "API docs: http://localhost:${HOST_BACKEND_PORT}/docs"
echo
echo "Stop with: docker rm -f ${CONTAINER_NAME}"
