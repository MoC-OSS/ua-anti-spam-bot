# syntax=docker/dockerfile:1.7

# @tensorflow/tfjs-node ships pre-built binaries only for linux/amd64.
# linux/arm64 is not in its ALL_SUPPORTED_COMBINATION list, so we pin the
# platform explicitly. On Apple Silicon hosts this runs via Rosetta 2.
# hadolint ignore=DL3029
FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:24

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV APP_WRITABLE_DIRS="/usr/src/app/src/tensor/temp /usr/src/app/src/shared/video/temp"

WORKDIR /usr/src/app

# Ensure native build tools are available so @tensorflow/tfjs-node can
# compile its C++ binding from source when no pre-built binary is found.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack install -g pnpm@10.17.1

COPY package.json pnpm-lock.yaml .npmrc ./
COPY patches ./patches

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --store-dir /pnpm/store

COPY . .

RUN set -eu; \
    for dir in $APP_WRITABLE_DIRS; do \
      mkdir -p "$dir"; \
    done; \
    chown -R node:node $APP_WRITABLE_DIRS

USER node

CMD ["pnpm", "run", "start:bot:prod"]
