#!/bin/sh
set -e
cd /app

# Persistent volume (e.g. /data/dev.db) — create parent dir if needed.
DB_PATH="${DATABASE_URL#file:}"
if [ -n "$DB_PATH" ]; then
  mkdir -p "$(dirname "$DB_PATH")"
fi

npx prisma db push
npx tsx prisma/seed.ts

exec node --import tsx src/server.ts
