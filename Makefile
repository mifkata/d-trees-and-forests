.PHONY: setup link tree forest gradient compare ui devcontainer.start devcontainer.stop devcontainer.restart devcontainer.build devcontainer.rebuild devcontainer.shell

define pyrun
	python $(1) $(if $(MASK),--mask $(MASK)) $(if $(SPLIT),--split $(SPLIT)) $(if $(USE_OUTPUT),--use-output $(USE_OUTPUT)) $(if $(IMPUTE),--impute) $(if $(IMAGES),--images) $(if $(JSON),--json) $(if $(DATASET),--dataset $(DATASET))
endef

tree:
	$(call pyrun,train-tree.py)

forest:
	$(call pyrun,train-forest.py)

gradient:
	$(call pyrun,train-gradient-forest.py)

compare:
	python compare.py

setup:
	pip install -r requirements.txt
	cd frontend && pnpm install

link:
	ln -s ../../frontend/node_modules ./frontend/node_modules

dev:
	cd frontend && pnpm run dev

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

devcontainer:
	docker compose -f .devcontainer/docker-compose.yml exec dtf_devcontainer zsh
