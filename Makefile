IMAGE := culture-run-claude
AUTH_DIR := $(HOME)/.claude-docker
CONTEXT_DOCS := README.md docs/roadmap.md docs/game-design.md docs/technical-requirements.md docs/redesign-3d.md

SEED_PROMPT := Read these project files to get context: $(CONTEXT_DOCS). \
	The project is a 3D browser runner game (Vite + TypeScript). \
	Spawn Sonnet subagents for implementation tasks, use Opus for planning. \
	Wait for my next instruction.

.PHONY: claude claude-build claude-login

claude-build:
	docker build -f Dockerfile.claude -t $(IMAGE) .

claude-login: claude-build
	mkdir -p $(AUTH_DIR)
	docker run -it --rm \
		-v $(AUTH_DIR):/home/node/.claude \
		$(IMAGE) \
		claude

claude: claude-build
	mkdir -p $(AUTH_DIR)
	docker run -it --rm \
		-v $(PWD):/workspace \
		-v $(AUTH_DIR):/home/node/.claude \
		$(IMAGE) \
		claude --dangerously-skip-permissions --model opus \
		"$(SEED_PROMPT)"
