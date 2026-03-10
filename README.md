# Hello World Game

A minimal 3D collectible-sphere game built with **React + Babylon.js** on the frontend and **FastAPI + SQLite** on the backend.

## Tech Stack

| Layer    | Technology                                         |
| -------- | -------------------------------------------------- |
| Frontend | React 18, Babylon.js 7, Vite 5                    |
| Backend  | FastAPI 0.111, Uvicorn 0.29, SQLAlchemy 2.0        |
| Database | SQLite (file-based, zero config)                   |

## Quick Start

```bash
# 1. Install all dependencies (Python + Node)
bash install.sh

# 2. Start both backend and frontend
bash run.sh
```

`run.sh` automatically:
- Kills any previously running instances
- Uses fixed default ports (`8000` backend, `5173` frontend) for Docker/host mapping
- Proxies frontend `/api/*` requests to the backend
- Prints the URLs when ready

You can still request dynamic ports when running locally:

```bash
BACKEND_PORT=auto FRONTEND_PORT=auto bash run.sh
```

## Docker Test

Build and run from `gamedev-base/`:

```bash
docker build -t hello-world-game .
./docker-run.sh
```

`docker-run.sh` automatically resolves host port collisions (for example, if `5173` or `8000` is already in use), starts the container, and prints host-accessible URLs.

You can still force specific host ports if needed:

```bash
HOST_FRONTEND_PORT=5173 HOST_BACKEND_PORT=8000 ./docker-run.sh
```

## How to Play

1. Enter your name and click **Play**.
2. Click the glowing spheres floating above the arena to score points.
3. Your high score is saved to the leaderboard automatically.

## Project Structure

```
gamedev-base/
├── install.sh              # Dependency installer
├── run.sh                  # Launch script
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── database.py     # SQLAlchemy engine & session
│       ├── models.py       # Player ORM model
│       ├── schemas.py      # Pydantic request/response models
│       └── main.py         # FastAPI routes
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx         # Root component & player registration
        ├── GameScene.jsx   # Babylon.js 3D scene
        └── Leaderboard.jsx # Score sidebar
```

## API Endpoints

| Method | Path              | Description                        |
| ------ | ----------------- | ---------------------------------- |
| GET    | `/api/health`     | Health check                       |
| POST   | `/api/players`    | Register a new player              |
| POST   | `/api/scores`     | Submit / update a player's score   |
| GET    | `/api/leaderboard`| Top 10 players by high score       |
