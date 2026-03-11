FROM swe-arena-base

ENV COMMIT_HASH=0f58ac0d6f3fbf509b7da4145af155ad18765d57
ENV REPO_URL=https://github.com/sharmahr/3d-chess.git
ENV REPO_NAME=3d-chess

RUN apt-get update && apt-get install -y \
  python3-pip \
  python3-venv \
  lsof \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /testbed/${REPO_NAME}

RUN git init && \
  git remote add origin ${REPO_URL} && \
  git fetch --depth 1 origin ${COMMIT_HASH} && \
  git checkout FETCH_HEAD && \
  git remote remove origin

RUN chmod +x install.sh run.sh

# Install backend Python dependencies at a fixed path so worktree overlays can find them
RUN python3 -m venv /opt/backend-venv && \
  /opt/backend-venv/bin/pip install --only-binary :all: \
    'fastapi>=0.115,<1' \
    'uvicorn>=0.34,<1' \
    'sqlalchemy>=2.0.30,<3' \
    'pydantic>=2.10,<3' \
    'python-jose>=3.3,<4' \
    'passlib>=1.7,<2'

# Install frontend Node dependencies (webpack-based)
RUN cd frontend && npm install

EXPOSE 8000 3000

ENV BACKEND_PORT=8000
ENV FRONTEND_PORT=3000

CMD ["bash", "run.sh"]
