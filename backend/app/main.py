"""FastAPI application entry point for the Hello World backend."""

from datetime import datetime
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATABASE_PATH = "matches.db"

app = FastAPI(title="Hello World API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MatchCreate(BaseModel):
    pgn: str
    result: str
    player_username: str
    ai_difficulty: str
    total_moves: int
    duration_seconds: int


def init_db() -> None:
    with sqlite3.connect(DATABASE_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pgn TEXT NOT NULL,
                result TEXT NOT NULL,
                player_username TEXT NOT NULL,
                ai_difficulty TEXT NOT NULL,
                total_moves INTEGER NOT NULL,
                duration_seconds INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.post("/matches/save")
def save_match(match: MatchCreate) -> dict[str, str]:
    created_at = datetime.utcnow().isoformat()
    with sqlite3.connect(DATABASE_PATH) as conn:
        conn.execute(
            """
            INSERT INTO matches (
                pgn, result, player_username, ai_difficulty, total_moves, duration_seconds, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                match.pgn,
                match.result,
                match.player_username,
                match.ai_difficulty,
                match.total_moves,
                match.duration_seconds,
                created_at,
            ),
        )
        conn.commit()
    return {"status": "saved"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Return a simple health status."""
    return {"status": "ok"}


@app.get("/api/hello")
def hello() -> dict[str, str]:
    """Return a hello world message."""
    return {"message": "Hello World"}
