.PHONY: up down shell claude restart clean logs status

up:
	docker compose up -d --build
	@echo "Containers started. Use 'make shell' or 'make claude' to access dev environment"

down:
	docker compose down

shell:
	docker compose exec dev bash

claude:
	docker compose exec dev c

restart: down up

clean: down
	docker compose down --rmi all --volumes

logs:
	docker compose logs -f

ps:
	docker compose ps
