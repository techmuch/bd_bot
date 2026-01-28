# JOSHUA: Lab Management & Business Intelligence Portal

JOSHUA is an automated platform designed to revolutionize lab management and government business pursuits. It combines high-performance web scraping with local Large Language Models (LLM) to deliver personalized, actionable leads directly to your inbox, alongside comprehensive strategic planning and IRAD tracking tools.

## Key Features

*   **Automated Discovery:** A background bot scrapes government solicitation portals (e.g., Georgia Procurement Registry) daily.
*   **Intelligent Matching:** An internal AI analyzes your organizational "Narrative" against thousands of opportunities to score relevance.
*   **Collaborative Dashboard:** A centralized portal for teams to review, claim, and track pursuits.
*   **Dual-Mode Authentication:** Supports both standalone (local password) and Enterprise SSO integration.
*   **Developer Ecosystem:** Integrated feedback loop and requirements management tools.

---

## 1. Installation & Setup

### Prerequisites
*   **Docker** (for PostgreSQL database)
*   **Go 1.25+** (for backend)
*   **Node.js 20+** (for frontend build)

### Step 1: Clone and Build
```bash
git clone https://github.com/techmuch/bd_bot.git
cd bd_bot

# Install Go dependencies
make deps

# Build the unified binary (Frontend + Backend)
make build
```

### Step 2: Infrastructure
Start the database container:
```bash
make db-up
```

### Step 3: Configuration
Run the interactive setup wizard to generate `config.yaml`:
```bash
./joshua config init
```
*   *Tip:* If running on macOS/Container, use `container ls` to find the DB IP address.

### Step 4: Database Schema
Apply the latest migrations:
```bash
./joshua migrate up
```

---

## 2. Administration

JOSHUA includes a powerful CLI for administration.

### User Management
```bash
# Create/List Users
./joshua user create -e admin@example.com -n "System Admin"
./joshua user list --json

# Set Password (Standalone Auth)
./joshua user passwd -e admin@example.com -p StrongPassword123!
```

### Organization Management
```bash
# Manage Organizations
./joshua org list
./joshua org rename --old "Acme Inc" --new "Acme Corp"
./joshua org move-users --from "Acme Inc" --to "Acme Corp"
```

### System Tools
```bash
# Manual Scrape
./joshua scraper run-now

# Export/Import Requirements (Versioning)
./joshua req export --out requirements_v1.md
./joshua req import --file new_requirements.md --user admin@example.com

# Task Management
./joshua task sync   # Parse requirements.md -> DB
./joshua task list            # View tasks (Markdown)
./joshua task list --selected # View selected tasks
./joshua task list --needs-revision # View tasks needing plans
./joshua task update --id 1 --file plan.json # Update plan via JSON
./joshua task list --json     # View tasks (JSON)

# Feedback Management
./joshua feedback list --new
./joshua feedback update --id 1 --status reviewed

# AI Development Loop
make develop         # Process selected tasks with Gemini
```

---

## 3. Usage Guide

### Getting Started
1.  Start the server: `./joshua serve`
2.  Navigate to `http://localhost:8080`.
3.  Click **Login** and enter your credentials.

### The App Hub
Upon login, you will see the **Landing Page**, your central hub for accessing:
*   **BD_Bot:** The core intelligence portal (Library/Inbox).
*   **Feedback:** Submit bug reports or feature requests directly to the team.
*   **Developer Tools:** (Admin/Dev only) Manage system requirements via an integrated Markdown editor.

### Key Workflows
*   **Set Your Narrative:** Go to **Profile** > **Narrative** to teach the AI about your business.
*   **View Matches:** Check your **Personal Inbox** for AI-scored opportunities.
*   **Claim Opportunities:** Click "Mark Interest" or "Take Lead" on any solicitation to coordinate with your team.

---

## 4. Deployment

JOSHUA is designed as a **Single Binary Deployment**. The React frontend is embedded into the Go binary.

1.  **Build:** Run `make build` to generate the `joshua` binary.
2.  **Deploy:** Copy `joshua` and `config.yaml` to your server.
3.  **Run:** Execute `./joshua serve`.
    *   *Production Tip:* Use a systemd service or Docker container to keep it running.
    *   *Env Vars:* Configuration can be overridden with environment variables (see `config.go`).

## Documentation Links
- [Requirements & Architecture](requirements.md)
- [Developer Guide (Internals)](development.md)