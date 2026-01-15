# Requirements: BD_Bot (Business Development Intelligence Portal)

## 1. Overview

The BD_Bot is a high-performance, cross-platform portal designed to automate the discovery and pursuit of government business development opportunities. It utilizes a background "bot" to scrape solicitation sites, an internal Large Language Model (LLM) to match opportunities to user expertise, and a collaborative dashboard to facilitate organizational "coalition building" and transparency.

## 2. Application Architecture

*   **Backend:** A single Go binary (Go 1.25.5+) designed for high-concurrency web traffic and automated tasks.
*   **Frontend:** A ReactJS Single Page Application (SPA) embedded directly into the Go binary using `go:embed`.
*   **CLI & TUI:** Integrated management commands built with the Cobra framework, utilizing Charmbracelet/huh for interactive forms and Bubble Tea for rich terminal feedback.
*   **Database:** PostgreSQL (selected for robust handling of concurrent writes and historical analytics).
*   **External AI:** Connectivity to an internal, OpenAI-compatible LLM server for contextual "narrative" matching.

## 3. Site Map & UX Design (Human-Centered)

### 3.1 Web Portal Structure

The web interface focuses on an inbox-style workflow to minimize cognitive load.

#### A. Public View (Unauthenticated)

*   **Global Library:** A searchable list of all scraped solicitations.
*   **Claim Visibility:** The name of the "Lead" (the first user to claim interest) is prominently displayed in the library view to prevent duplicate effort at a glance.
*   **Opportunity Detail Page:** View-only access to solicitation text, agency info, and due dates.
*   **Login Prompt:** Call-to-action to log in via SSO to claim or comment.

#### B. Authenticated Dashboard (The "Command Center")

*   **Personal Inbox (Primary View):**
    *   Features: AI-matched leads, items shared by colleagues, and a "Urgency" indicator based on due dates.
    *   Onboarding Banner: Persistent message until the Narrative is populated.
    *   Workflow: User reviews match -> Marks as "Interested", "Archive", or "Share". Matching skips users with empty narratives, though shared items still appear.
*   **Collaborative Workspace (Opportunities in Pursuit):**
    *   Features: List of all "Interested" items organization-wide.
    *   Visibility: Displays "Primary Claimer" and "Coalition Members."
    *   Detail View: Discussion thread, history/audit log, and the Draft URL (SharePoint/Google Docs link).
*   **User Profile & AI Narrative:**
    *   Narrative Editor: A free-form text box pre-populated with a best-practice template. Users have full authority to modify or replace this text with custom logic, instructions, or expertise descriptions for the LLM.
    *   Org Settings: Dropdowns to select/add Division, Department, and Team.
*   **Organizational Analytics (Manager View):**
    *   Aggregated Stats: Reporting is focused on the Organizational Level (e.g., "Engineering Department") rather than individuals, showing activity and capture rates per unit.

### 3.2 CLI & TUI Structure (The "Engine Room")

The CLI leverages the Charmbracelet ecosystem for a premium administrative experience.

*   **`bd_bot config init` (Assisted Configuration):**
    *   UX Pattern: Standard Forms via `huh`. Includes "Retest Connection" buttons for PostgreSQL and the AI API.
    *   Flexible Validation: Errors do not block progression; users can continue even if a connection is not yet successful.
    *   Silent Mode: `--silent` flag bypasses forms to generate the default `config.yaml`.
*   **`bd_bot scraper run-now` (Real-time Monitoring):**
    *   UX Pattern: Dual-view interface with a State-Based status table and a toggleable raw Log tab.
    *   Context: Can be used to manually trigger a run or monitor an already active background process.
*   **`bd_bot user` (Identity Management):**
    *   UX Pattern: A List View with "search-as-you-type" for managing identities and roles.

### 3.3 Visual & Terminal Design

*   **Styling:** Uses Lip Gloss with "Short Tide" color palettes (professional blues/teals).
*   **Terminal Awareness:** Graceful detection with fallback to ASCII; suggests upgrade if a basic terminal is detected.
*   **Help System:** Dedicated help key (`?`) in all TUI views for context-sensitive documentation.

## 4. Technical Requirements

*   **Database & Migrations:**
    *   Engine: PostgreSQL.
    *   Migrations: Handled via the CLI with SQL files embedded in the binary.
    *   Audit Log: Records all user interactions to generate aggregated organizational pursuit statistics.
*   **Security & Authentication:**
    *   SSO Integration: Authentication via organizational SSO (SAML/OIDC).
    *   Open Enrollment: Automatic user provisioning upon first successful login.
*   **Matching Engine (LLM):**
    *   Internal AI: OpenAI-compatible API connection.
    *   Matching Logic: The LLM processes the free-form user narrative (and any custom instructions/if-then logic therein) to decide on solicitation matches.
*   **Logging System:**
    *   Centralized logging for all application components.
    *   Support for timestamped entries and configurable log levels (DEBUG, INFO, WARN, ERROR).
    *   Output to both standard output and a configurable log file with rotation.

## 5. Feature Specifications

*   **The Scraper (Midnight Bot):**
    *   Frequency: Daily at midnight.
    *   Configurable Sources: All targets defined in `config.yaml` (Federal, GA Tech, State/Local GA).
    *   State of Georgia Logic: Must handle decentralized city/county/municipal portals with configurable rules.
    *   Behavior: Web/API scraping (No initial PDF parsing).
*   **Notifications:**
    *   Email (Daily Digest): One summary email every 24 hours.
    *   Slack Integration: Real-time Direct Messages for immediate events (Claims, Comments, Direct Shares). Shared solicitations bypass the digest for immediate delivery.

## 6. Configuration (`config.yaml`)

Extensive inline documentation for:
*   PostgreSQL connection and pool settings.
*   SSO metadata URLs and client credentials.
*   LLM API endpoints and model settings.
*   Slack Bot tokens and DM triggers.
*   Log file path and level configuration.
*   Scraper targets with specific CSS/API rules.
*   Organizational levels (Division > Department > Team).

## 7. Quality Assurance & CI/CD

*   **Unit Testing:** Development must include a comprehensive suite of unit tests for both the Go backend and React frontend.
*   **Coverage Targets:** Core logic (Scraper, LLM matching parser, SSO handshake) must have high test coverage.
*   **CI/CD Pipeline:** A fully automated pipeline is required for linting, security scanning, automated testing, building the unified binary, and artifact storage.
*   **Deployment Gate:** The application must pass all unit tests and pipeline stages before being considered for deployment.

## 8. Getting Started

1.  Clone the repository.
2.  Generate configuration: `bd_bot config init`
3.  Run Migrations: `bd_bot migrate up`
4.  Start the Portal: `bd_bot serve`

## 9. Developer Documentation

A `development.md` file must be created and maintained. This file will serve as a comprehensive guide for new developers, capturing all necessary details to facilitate a smooth onboarding process. It should include, but not be limited to, local development setup, architectural deep-dives, and coding conventions.

## 10. Phased Development Approach

To ensure a structured and manageable implementation, development will follow these five phases:

### Phase 1: Foundation & Core Infrastructure
*   **Goal:** Establish the project skeleton, database connectivity, and basic application lifecycle.
*   **Tasks:**
    *   Initialize Go module and project structure (Backend).
    *   Scaffold React frontend with Vite/Next.js and configure `go:embed`.
    *   Set up PostgreSQL container and Go migration framework.
    *   Implement basic CLI structure (`bd_bot root`, `bd_bot version`).
    *   Create `bd_bot config init` with basic `huh` forms.

### Phase 2: Identity & Basic Data Ingestion
*   **Goal:** Enable user login and start populating the system with data.
*   **Status:** Mostly Complete.
*   **Tasks:**
    *   [x] Implement Database Schema for Users and Solicitations.
    *   [x] Build Scraper engine foundation and implement one primary data source (GPR).
    *   [x] Implement Detail Page Scraping and Document Storage.
    *   [x] Develop "Global Library" API and Frontend view (read-only) with Analytics Dashboard.
    *   [ ] Implement Basic Authentication (or Mock SSO) for development.

### Phase 3: Intelligence & Personalization
*   **Goal:** Connect the "Brain" (LLM) and enable user-specific features.
*   **Status:** Complete.
*   **Tasks:**
    *   [x] Integrate OpenAI-compatible API client.
    *   [x] Build "Narrative Editor" (Frontend) and storage (Backend).
    *   [x] Implement the Matching Engine logic (Solication vs. Narrative).
    *   [x] Create the "Personal Inbox" view and logic.

### Phase 4: Collaboration & Workflow
*   **Goal:** Transform the tool from a reader to a workspace.
*   **Tasks:**
    *   Implement "Claim," "Share," and "Archive" workflows.
    *   Build "Collaborative Workspace" view for teams.
    *   Add Audit Logging for user actions.
    *   Develop TUI Monitoring command (`bd_bot scraper run-now`).

### Phase 5: Polish & Scale
*   **Goal:** Prepare for production deployment and organizational rollout.
*   **Tasks:**
    *   Implement full SSO (SAML/OIDC).
    *   Add Email and Slack notifications.
    *   Build Organizational Analytics dashboard.
    *   Finalize CI/CD pipelines and comprehensive unit testing.
    *   UI/UX Polish (Lip Gloss for CLI, Tailwind for Web).