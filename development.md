# Developer Documentation

This document provides a guide for developers working on the BD_Bot project.

## 1. Local Development Setup

### Prerequisites
*   **Go:** 1.25.5 or later.
*   **Node.js & npm:** For frontend development.
*   **Container Platform:** Either `docker` or the `container` platform (macOS).
*   **Make:** For build automation.

### Installation
1.  Clone the repository:
    ```bash
    git clone github.com:techmuch/bd_bot.git
    cd bd_bot
    ```
2.  Install dependencies:
    ```bash
    make deps
    ```

### Configuration
1.  Start the database:
    ```bash
    make db-up
    ```
2.  Initialize the configuration:
    ```bash
    ./bd_bot config init
    ```
    *   *Note for macOS (container platform):* Use `container ls` to find the container's IP address (e.g., `192.168.64.2`) and update the `database_url` in `config.yaml` accordingly. Default is set to match common container VM IPs.
3.  Run migrations:
    ```bash
    ./bd_bot migrate up
    ```
4.  Test connectivity:
    ```bash
    ./bd_bot config test
    ```

### Running the Application
*   **Full Stack:** `make run` (Builds web, builds go, and starts the server on `:8080`).
*   **Scraper Only:** `make scrape` (Triggers a manual run of the midnight bot).

## 2. Architectural Deep-Dive

### Project Structure
*   `cmd/bd_bot/`: Entry point for the application.
*   `internal/api/`: REST API handlers and router.
*   `internal/cli/`: Cobra command implementations.
*   `internal/config/`: Configuration loading and structures.
*   `internal/db/`: Database connection pooling.
*   `internal/logger/`: Structured logging using `slog` and `lumberjack`.
*   `internal/repository/`: Data access layer (PostgreSQL).
*   `internal/scraper/`: Scraper engine and specialized source implementations.
*   `migrations/`: SQL migration files embedded into the binary.
*   `web/`: React frontend (Vite + TypeScript).

### Database Schema
*   `users`: Identity, roles, and capability narratives.
*   `solicitations`: Scraped opportunities with metadata and raw source data.
*   `claims`: Join table tracking user interest and leads on opportunities.
*   `documents`: Stored as a JSONB column within `solicitations` for flexibility.

### Scraper Engine
The scraper uses a Strategy Pattern. Each source (like `georgia-gpr`) implements the `Scraper` interface. The `Engine` manages concurrent execution and persistence.

## 3. Coding Conventions

### Go Backend
*   **Style:** Follow standard `gofmt` and `goimports`.
*   **Logging:** Use the global `slog` logger. Avoid `fmt.Println` for system events.
*   **Errors:** Wrap errors with context using `%w`.
*   **Migrations:** Never modify existing migration files. Always create a new one for schema changes.

### React Frontend
*   **Style:** Use Functional Components with Hooks.
*   **UI Libraries:**
    *   **Recharts:** For analytics dashboards and histograms.
    *   **Lucide React:** For consistent iconography.
*   **Types:** All API responses must have corresponding TypeScript interfaces in `web/src/types`.
*   **Routing:** Client-side routing is handled by the React app; the Go server is configured to fallback to `index.html` for non-API routes.

### API Endpoints
*   `GET /api/solicitations`: Returns a JSON list of all solicitations, including metadata and document links.

### Git Workflow
*   **Commits:** Use descriptive, multi-line commit messages.
*   **Branches:** Feature-based branching is recommended.
*   **Push:** Always ensure `make build` passes before pushing.
