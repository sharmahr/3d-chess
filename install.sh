#!/usr/bin/env bash
# install.sh — Install all dependencies for the Hello World game.
#
# Installs Python backend packages (via pip) and Node.js frontend packages
# (via npm). Run this once before using run.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Prefer a local .venv; fall back to the fixed Docker-image path.
if [[ -d /opt/backend-venv ]]; then
  BACKEND_VENV=/opt/backend-venv
else
  BACKEND_VENV="$BACKEND_DIR/.venv"
fi

ensure_backend_venv() {
	if [[ ! -d "$BACKEND_VENV" ]]; then
		echo "Creating backend virtual environment at $BACKEND_VENV"
		python3 -m venv "$BACKEND_VENV"
	fi
}

install_backend_deps() {
	if "$BACKEND_VENV/bin/python" -m pip --version >/dev/null 2>&1; then
		"$BACKEND_VENV/bin/python" -m pip install --quiet -r requirements.txt
		return
	fi

	echo "pip not found in backend venv; attempting bootstrap via ensurepip..."
	if "$BACKEND_VENV/bin/python" -m ensurepip --upgrade >/dev/null 2>&1; then
		"$BACKEND_VENV/bin/python" -m pip install --quiet -r requirements.txt
		return
	fi

	if command -v uv >/dev/null 2>&1; then
		echo "ensurepip unavailable; falling back to uv pip installer..."
		uv pip install --python "$BACKEND_VENV/bin/python" -r requirements.txt
		return
	fi

	echo "Error: No pip available and unable to bootstrap it (ensurepip/uv unavailable)." >&2
	exit 1
}

echo "=== Installing backend dependencies ==="
cd "$BACKEND_DIR"
ensure_backend_venv
install_backend_deps

echo "=== Installing frontend dependencies ==="
cd "$SCRIPT_DIR/frontend"
npm install

echo ""
echo "All dependencies installed. Run ./run.sh to start the game."
