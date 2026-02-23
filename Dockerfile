# Stage 1: Build
FROM node:22-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY corona-control-ultimate/package*.json ./corona-control-ultimate/
WORKDIR /app/corona-control-ultimate
RUN npm ci
COPY corona-control-ultimate ./
RUN npm run build

# Stage 2: Runner (Debian-slim für VS Code Web Dev Mode Kompatibilität)
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends git curl procps && rm -rf /var/lib/apt/lists/*

# User 1000 erstellen (HuggingFace Standard)
RUN userdel -r node 2>/dev/null; useradd -m -u 1000 user || true

WORKDIR /home/user/app

# Gebaute Dateien und Server kopieren
COPY --from=build --chown=1000:1000 /app/corona-control-ultimate/dist ./dist
COPY --chown=1000:1000 corona-control-ultimate/server.cjs ./server.cjs
COPY --chown=1000:1000 corona-control-ultimate/package*.json ./

RUN chown -R 1000:1000 /home/user

USER 1000

ENV NODE_ENV=production
ENV PORT=7860

EXPOSE 7860

CMD ["node", "server.cjs"]
