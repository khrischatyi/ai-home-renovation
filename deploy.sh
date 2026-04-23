#!/bin/bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

echo "=== Pulling latest changes ==="
git pull origin main

echo "=== Rebuilding and restarting services ==="
docker compose -f "$COMPOSE_FILE" up -d --build

echo "=== Waiting for backend to be ready ==="
for i in $(seq 1 30); do
    if docker compose -f "$COMPOSE_FILE" exec -T backend curl -sf http://localhost:8000/api/v1/health >/dev/null 2>&1; then
        echo "Backend ready."
        break
    fi
    sleep 2
done

echo "=== Running database migrations ==="
docker compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head

echo "=== Seeding contractors (idempotent) ==="
docker compose -f "$COMPOSE_FILE" exec -T backend python -m app.seed || \
    echo "(seed step returned non-zero — continuing)"

echo "=== Cleaning up old images ==="
docker image prune -f

echo "=== Done! Service health ==="
docker compose -f "$COMPOSE_FILE" ps
