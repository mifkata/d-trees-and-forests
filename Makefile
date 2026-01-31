.PHONY: setup link worktree worktree.rm tree forest gradient compare ui devcontainer.start devcontainer.stop devcontainer.restart devcontainer.build devcontainer.rebuild devcontainer.shell

ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

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

worktree:
	@if [ -z "$(word 2,$(MAKECMDGOALS))" ]; then echo "Usage: make worktree <name>"; exit 1; fi
	git worktree add -b $(word 2,$(MAKECMDGOALS)) $(ROOT)worktrees/$(word 2,$(MAKECMDGOALS))
	ln -s $(ROOT)frontend/public/output $(ROOT)worktrees/$(word 2,$(MAKECMDGOALS))/frontend/public/output
	ln -s $(ROOT)frontend/node_modules $(ROOT)worktrees/$(word 2,$(MAKECMDGOALS))/frontend/node_modules

worktree.rm:
	@if [ -z "$(word 2,$(MAKECMDGOALS))" ]; then echo "Usage: make worktree.rm <name>"; exit 1; fi
	git worktree remove $(ROOT)worktrees/$(word 2,$(MAKECMDGOALS))

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

# Catch-all to allow positional arguments (e.g., make worktree <name>)
%:
	@:
