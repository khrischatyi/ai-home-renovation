.PHONY: dev dev-d prod down down-v migrate migration seed logs logs-backend shell shell-db test lint clean restart browser stripe-listen stripe-check up deploy deploy-remote ship seed-remote logs-remote shell-remote

dev:
	docker compose up --build

dev-d:
	docker compose up --build -d

# Convenience alias that boots the stack (detached) AND opens the browser
# to the intake page so you can click straight into testing.
up: dev-d browser

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

# Open the site at the project-intake page in Chrome. Works on macOS out of the
# box; falls back to xdg-open on Linux and 'start' on Windows (via MSYS/WSL).
URL ?= http://127.0.0.1/project/new
browser:
	@echo "Opening $(URL) in Chrome…"
	@if [ "$$(uname)" = "Darwin" ]; then \
		open -a "Google Chrome" "$(URL)" || open "$(URL)"; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		xdg-open "$(URL)"; \
	elif command -v start >/dev/null 2>&1; then \
		start "$(URL)"; \
	else \
		echo "No known opener; visit $(URL) manually."; \
	fi

# Forward Stripe webhook events from the Stripe CLI to the local backend.
# Requires: `brew install stripe/stripe-cli/stripe && stripe login`.
# Copy the printed whsec_... into .env as STRIPE_WEBHOOK_SECRET and `make restart service=backend`.
stripe-listen:
	@command -v stripe >/dev/null 2>&1 || { \
		echo "Stripe CLI not found."; \
		echo "Install:  brew install stripe/stripe-cli/stripe"; \
		echo "Login:    stripe login"; \
		exit 1; \
	}
	stripe listen --forward-to http://127.0.0.1/api/v1/payments/webhook

# Quick sanity check: are all containers up and is /health green?
stripe-check:
	@docker compose ps --status running --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}' || true
	@echo
	@echo "Backend /health:"
	@curl -sf http://127.0.0.1/api/v1/health || echo "  (unreachable)"

# ───────────────────────────── Remote deploy (AWS) ─────────────────────────────
#
# Override these per-shell or in your ~/.zshrc if your server isn't at the
# defaults. `make deploy` prints what it would do until you set a real host.
#
#   DEPLOY_HOST=ubuntu@helpico.ai DEPLOY_PATH=/home/ubuntu/ai-home-renovation
#
# `make ship m="fix login"` = stage + commit + push + remote deploy in one shot.
#
DEPLOY_HOST ?= ubuntu@helpico.ai
DEPLOY_PATH ?= /home/ubuntu/ai-home-renovation
REMOTE      = ssh $(DEPLOY_HOST)

# Run deploy.sh on the server (it pulls, rebuilds, migrates, seeds).
deploy-remote:
	@echo "→ ssh $(DEPLOY_HOST) \"cd $(DEPLOY_PATH) && ./deploy.sh\""
	$(REMOTE) 'cd $(DEPLOY_PATH) && ./deploy.sh'

# Ship: add + commit + push + remote deploy. Requires m="commit message".
ship:
	@if [ -z "$(m)" ]; then \
		echo "Usage: make ship m=\"your commit message\""; exit 1; \
	fi
	git add -A
	git diff --cached --quiet || git commit -m "$(m)"
	git push origin main
	$(MAKE) deploy-remote

# Same as `deploy-remote`, named `deploy` for muscle memory.
deploy: deploy-remote

# Run the contractor seed against the prod DB (idempotent).
seed-remote:
	$(REMOTE) 'cd $(DEPLOY_PATH) && docker compose -f docker-compose.prod.yml exec -T backend python -m app.seed'

# Tail prod backend logs.
logs-remote:
	$(REMOTE) 'cd $(DEPLOY_PATH) && docker compose -f docker-compose.prod.yml logs -f --tail 200 backend caddy'

# Open a shell in the prod backend container.
shell-remote:
	$(REMOTE) -t 'cd $(DEPLOY_PATH) && docker compose -f docker-compose.prod.yml exec backend bash'
