# Contributing to TensorFleet

Thank you for your interest in contributing!

## Getting Started
- Fork the repo and create a feature branch.
- Run locally with Docker Compose: `docker-compose -f docker-compose.development.yml up -d`.
- Use `make build`, `make test`, `make lint`.

## Code Style
- Python: Black, isort, flake8.
- Go: `go fmt`, `golangci-lint`.
- Frontend: ESLint + Prettier.

## Tests
- Add unit tests for Python/Go services.
- Add API integration tests under `tests/` and ensure `make test` runs them.

## Pull Requests
- Use conventional commits.
- Include description, screenshots/logs when relevant.
- Ensure CI passes.

## Security
- Do not commit secrets. Use `.env.example` and GitHub Secrets.

## License
By contributing, you agree your contributions will be licensed under the MIT License.
