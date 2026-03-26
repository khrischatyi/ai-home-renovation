#!/bin/bash
set -e

echo "=== Pulling latest changes ==="
git pull origin main

echo "=== Rebuilding and restarting services ==="
docker compose -f docker-compose.prod.yml up -d --build

echo "=== Running database migrations ==="
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

echo "=== Cleaning up old images ==="
docker image prune -f

echo "=== Done! Checking service health ==="
docker compose -f docker-compose.prod.yml ps
