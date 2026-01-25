.PHONY: tree forest devcontainer.start devcontainer.stop devcontainer.restart devcontainer.build devcontainer.rebuild devcontainer.shell

define pyrun
	python $(1) $(if $(MASK),--mask $(MASK)) $(if $(USE_OUTPUT),--use-output $(USE_OUTPUT))
endef

tree:
	$(call pyrun,train-tree.py)

forest:
	$(call pyrun,train-forest.py)

devcontainer.start:
	docker compose -f .devcontainer/docker-compose.yml up -d --remove-orphans

devcontainer.stop:
	docker compose -f .devcontainer/docker-compose.yml down

devcontainer.restart:
	docker compose -f .devcontainer/docker-compose.yml restart

devcontainer.build:
	docker compose -f .devcontainer/docker-compose.yml build

devcontainer.rebuild:
	docker compose -f .devcontainer/docker-compose.yml build --no-cache

devcontainer.shell:
	docker compose -f .devcontainer/docker-compose.yml exec dtf_devcontainer zsh
