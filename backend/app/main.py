"""FastAPI application entry point for the Hello World backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Hello World API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Return a simple health status."""
    return {"status": "ok"}


@app.get("/api/hello")
def hello() -> dict[str, str]:
    """Return a hello world message."""
    return {"message": "Hello World"}
