# BD_Bot: Business Development Intelligence Portal

BD_Bot is an automated intelligence platform designed to revolutionize how organizations discover and pursue government business opportunities. It combines high-performance web scraping with local Large Language Models (LLM) to deliver personalized, actionable leads directly to your inbox.

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
./bd_bot config init
```
*   *Tip:* If running on macOS/Container, use `container ls` to find the DB IP address.

### Step 4: Database Schema
Apply the latest migrations:
```bash
./bd_bot migrate up
```

---

## 2. Administration

BD_Bot includes a powerful CLI for administration.

### User Management
```bash
# Create/List Users
./bd_bot user create -e admin@example.com -n "System Admin"
./bd_bot user list --json

# Set Password (Standalone Auth)
./bd_bot user passwd -e admin@example.com -p StrongPassword123!
```

### Organization Management
```bash
# Manage Organizations
./bd_bot org list
./bd_bot org rename --old "Acme Inc" --new "Acme Corp"
./bd_bot org move-users --from "Acme Inc" --to "Acme Corp"
```

### System Tools
```bash
# Manual Scrape
./bd_bot scraper run-now

# Export/Import Requirements (Versioning)
./bd_bot req export --out requirements_v1.md
./bd_bot req import --file new_requirements.md --user admin@example.com
```

---

## 3. Usage Guide

### Getting Started
1.  Start the server: `./bd_bot serve`
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

BD_Bot is designed as a **Single Binary Deployment**. The React frontend is embedded into the Go binary.

1.  **Build:** Run `make build` to generate the `bd_bot` binary.
2.  **Deploy:** Copy `bd_bot` and `config.yaml` to your server.
3.  **Run:** Execute `./bd_bot serve`.
    *   *Production Tip:* Use a systemd service or Docker container to keep it running.
    *   *Env Vars:* Configuration can be overridden with environment variables (see `config.go`).

## Documentation Links
- [Requirements & Architecture](requirements.md)
- [Developer Guide (Internals)](development.md)
