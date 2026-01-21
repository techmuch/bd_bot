# Developer Documentation

This document provides a comprehensive guide for new developers working on the JOSHUA project.

## 1. Local Development Setup

### Prerequisites
*   **Go:** 1.25.5 or later.
*   **Node.js & npm:** For frontend development.
*   **Container Platform:** Docker or macOS `container` platform.
*   **Make:** For build automation.

### Quick Start
1.  **Clone & Install:**
    ```bash
    git clone github.com:techmuch/bd_bot.git
    cd bd_bot
    make deps
    ```
2.  **Database:**
    ```bash
    make db-up
    ./joshua config init
    # Note: On macOS/container, verify DB IP with `container ls` and edit config.yaml
    ./joshua migrate up
    ```
3.  **Create Admin User:**
    ```bash
    ./joshua user create -e admin@example.com -n "Admin User"
    ./joshua user passwd -e admin@example.com -p secret123
    # Optional: Set role to developer
    # container exec bd_bot-db psql -U user -d bd_bot -c "UPDATE users SET role = 'developer' WHERE email = 'admin@example.com';"
    ```
4.  **Run Full Stack:**
    ```bash
    make run
    # Access UI at http://localhost:8080
    ```

### Live Frontend Development (HMR)
For rapid UI iteration:
1.  Start Backend: `make build-go && ./joshua serve`
2.  Start Frontend: `cd web && npm run dev`
3.  Access: `http://localhost:5173` (Proxies API calls to backend).

## 2. Project Architecture

### Backend (`/internal`)
*   **`api/`**: REST handlers.
    *   `auth.go`: Login, Password, Session.
    *   `user.go`: Profile, Avatar, Organizations.
    *   `solicitations.go`: List, Detail, Claims.
    *   `feedback.go`: Feedback submission.
    *   `requirements.go`: Requirements versioning.
*   **`cli/`**: Cobra commands (`root`, `user`, `org`, `req`, `match`, `scraper`).
*   **`repository/`**: PostgreSQL data access logic.
*   **`ai/`**: LLM integration logic.
*   **`scraper/`**: GPR scraping engine.

### Frontend (`/web/src`)
*   **`components/`**:
    *   `LandingPage.tsx`: App hub.
    *   `SolicitationList.tsx`: Library view.
    *   `PersonalInbox.tsx`: AI matches.
    *   `SolicitationDetail.tsx`: Detail view + Claims.
    *   `UserProfile.tsx`: Profile, Org, Password, Narrative.
    *   `FeedbackApp.tsx`: Feedback form.
    *   `DeveloperApp.tsx`: Requirements editor.
*   **`context/`**: `AuthContext.tsx` handles session state.
    *   `ThemeContext.tsx`: Handles WOPR/Light/Dark theming.
*   **`hooks/`**: `useAnalytics.ts` encapsulates cross-filtering logic.

## 3. Key Workflows

### Authentication
The system supports Dual-Mode Auth:
1.  **Standalone (Local):** `bcrypt` password hashing. Managed via CLI. UI uses a Modal.
2.  **SSO (Future):** Schema supports `auth_provider`.

### Data Pipeline
1.  **Ingestion:** `make scrape` runs the scraper -> DB.
2.  **Matching:** `./joshua match [user_id]` runs LLM analysis -> `matches` table.
3.  **Consumption:** User views Inbox -> `PersonalInbox.tsx`.

### Task Management (Developer Workflow)
1.  **Define:** Edit `requirements.md` (locally or via Web UI).
2.  **Sync:** Run `./joshua task sync` to populate the `tasks` table.
3.  **Track:** Use the **Developer Tools** web UI to view tasks and flag items (`is_selected`) for active development.

### AI Development Loop
To accelerate development using the internal task list:
1.  Select tasks in the **Developer Tools** UI.
2.  Run `make develop` in your terminal.
    *   This command exports requirements, reads selected tasks, and prompts the AI (Gemini) to implement them.
    *   The AI will modify code, update docs, and push changes.
3.  The system automatically re-syncs tasks upon completion.

## 4. API Reference

| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---|
| `POST` | `/api/auth/login` | Login | No |
| `POST` | `/api/auth/password` | Change Password | Yes |
| `GET` | `/api/solicitations` | List opportunities | No |
| `GET` | `/api/solicitations/:id` | Detail View | No |
| `POST` | `/api/solicitations/:id/claim` | Take Lead/Interest | Yes |
| `POST` | `/api/solicitations/:id/comments` | Add Comment | Yes |
| `GET` | `/api/matches` | List user matches | Yes |
| `PUT` | `/api/user/profile` | Update Profile (incl. Threshold) | Yes |
| `POST` | `/api/feedback` | Submit Feedback | Yes |
| `GET` | `/api/requirements` | Get Requirements | Dev/Admin |
| `GET` | `/api/tasks` | List synced tasks | Dev/Admin |
| `POST` | `/api/tasks/:id/select` | Toggle selection | Dev/Admin |

## 5. CLI Reference

*   `joshua user list [--json]`: Manage users.
*   `joshua org list [--json]`: Manage organizations.
*   `joshua req export/import`: Version requirements.md.
*   `joshua task sync`: Sync tasks from requirements.md to DB.
*   `joshua task list [--selected] [--json]`: List tasks (Markdown default).
*   `joshua scraper run-now`: Manual scrape.

## 6. Coding Standards
*   **Go:** `gofmt`, `goimports`. Use `slog` for logging.
*   **React:** Functional components, Hooks (`useAuth`, `useAnalytics`).
*   **CSS:** Responsive, full-width layouts. Use CSS variables (`var(--text-primary)`, `var(--bg-body)`) to support the WOPR theme.
