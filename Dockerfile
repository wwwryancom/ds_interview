# 小猪 DS 面试准备 — 单容器：前端静态 + API + SQLite
FROM node:22-bookworm-slim AS web-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY src ./src
COPY --from=web-build /app/web/dist ./web/dist
RUN npx prisma generate

COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=file:/data/dev.db

EXPOSE 3001
VOLUME ["/data"]

ENTRYPOINT ["/entrypoint.sh"]
