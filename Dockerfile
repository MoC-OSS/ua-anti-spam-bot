# @tensorflow/tfjs-node ships pre-built binaries only for linux/amd64.
# linux/arm64 is not in its ALL_SUPPORTED_COMBINATION list, so we pin the
# platform explicitly. On Apple Silicon hosts this runs via Rosetta 2.
# hadolint ignore=DL3029
FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:24

WORKDIR /usr/src/app

# Ensure native build tools are available so @tensorflow/tfjs-node can
# compile its C++ binding from source when no pre-built binary is found.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY patches ./patches

RUN npm ci

COPY . .

# Create non-root user and switch to it for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /usr/src/app
USER appuser

CMD ["npm", "run", "start:bot:prod"]
