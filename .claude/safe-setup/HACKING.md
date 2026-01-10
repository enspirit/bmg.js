# Hacking on Bmg with Claude Code

This Docker setup provides a sandboxed environment with all tools needed to hack on Bmg:
- Node.js
- Claude Code CLI

## Prerequisites

1. Docker and Docker Compose installed
2. A Claude Code account

## Getting Started

```bash
cd .claude/safe-setup

# Create your .env file from template
cp .env.example .env

# Edit .env to set your git identity
# GIT_USER_NAME=Your Name
# GIT_USER_EMAIL=your.email@example.com

# Build and start containers
make up

# Enter the dev environment
make shell
```

## Persistent Data

- **Claude history**: Stored in a named Docker volume (`claude-history`) that persists across container restarts
- **Git configuration**: Automatically set from `GIT_USER_NAME` and `GIT_USER_EMAIL` environment variables

## Inside the Container

You're now user `bmg` in `/workspace` (the Bmg project root).

```bash
# Install project dependencies
npm install

# Run tests
npm run test

# Use Claude Code
claude
```

PostgreSQL is pre-configured via environment variables. Just run `psql` to connect.

## Commands

| Command | Description |
|---------|-------------|
| `make up` | Build and start containers |
| `make down` | Stop containers |
| `make shell` | Enter dev container |
| `make restart` | Restart everything |
| `make logs` | Follow container logs |
| `make ps` | Show container status |
| `make clean` | Remove containers and images |
| `make claude` | Directly launch claude |
