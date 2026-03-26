.PHONY: dev prod down migrate migration seed logs shell test lint clean

dev:
	docker compose up --build

dev-d:
	docker compose up --build -d

prod:
	docker compose -f docker-compose.prod.yml up --build -d

down:
	docker compose down

down-v:
	docker compose down -v

migrate:
	docker compose exec backend alembic upgrade head

migration:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

seed:
	docker compose exec backend python -m app.seed

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

shell:
	docker compose exec backend bash

shell-db:
	docker compose exec db psql -U renovation -d renovation

test:
	docker compose exec backend pytest -v

lint:
	docker compose exec backend ruff check app/

clean:
	docker compose down -v --rmi local
	rm -rf backend/__pycache__ backend/.pytest_cache

restart:
	docker compose restart $(service)
