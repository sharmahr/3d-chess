FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    lsof \
    procps \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app

RUN chmod +x /app/install.sh /app/run.sh

# install.sh is intended to run during image build.
RUN /app/install.sh

EXPOSE 8000 5173

ENV BACKEND_PORT=8000
ENV FRONTEND_PORT=5173

CMD ["/app/run.sh"]
