# Requirements: JOSHUA (Business Development Intelligence Portal)

## 1. Overview

JOSHUA is a high-performance, cross-platform portal designed to automate the discovery and pursuit of government business development opportunities. It utilizes a background "bot" to scrape solicitation sites, an internal Large Language Model (LLM) to match opportunities to user expertise, and a collaborative dashboard to facilitate organizational "coalition building" and transparency.

## 2. Application Architecture

*   **Backend:** A single Go binary (Go 1.25.5+) designed for high-concurrency web traffic and automated tasks.
*   **Frontend:** A ReactJS Single Page Application (SPA) embedded directly into the Go binary using `go:embed`.
*   **CLI & TUI:** Integrated management commands built with the Cobra framework, utilizing Charmbracelet/huh for interactive forms and Bubble Tea for rich terminal feedback.
*   **Database:** PostgreSQL (selected for robust handling of concurrent writes and historical analytics).
*   **External AI:** Connectivity to an internal, OpenAI-compatible LLM server for contextual "narrative" matching.

## 3. Site Map & UX Design (Human-Centered)

### 3.1 Web Portal Structure

The web interface utilizes a hub-and-spoke model, starting from a central Landing Page.

#### A. Public View (Unauthenticated)

*   **Landing Page (`/`):** Central hub displaying available applications (BD_Bot, Feedback, Developer Tools).
*   **Login Prompt:** Modal dialog for authentication.

#### B. Applications (Authenticated)

*   **BD_Bot (`/library`, `/inbox`):**
    *   **Global Library:** Searchable list of solicitations with indicators for Leads/Interested parties.
    *   **Personal Inbox:** AI-scored matches tailored to the user's narrative.
    *   **Detail View:** Comprehensive solicitation details, team claims, and documents.
*   **Feedback App (`/feedback`):**
    *   Form to submit bug reports or feature requests for specific apps/views.
*   **Developer Tools (`/developer/tasks`, `/developer/requirements`):**
    *   **Requirements Editor:** Markdown editor for the system's `requirements.md`, supporting versioning and rollback.
    *   There should be a unique URL for each view. 
    *   *Access Control:* Restricted to 'admin' or 'developer' roles.
*   **User Profile (`/profile`):**
    *   Manage identity (Name, Email, Avatar), Organization, Security (Password), and AI Narrative.

### 3.2 CLI & TUI Structure (The "Engine Room")

The CLI leverages the Charmbracelet ecosystem for a premium administrative experience.

*   **`joshua config init` (Assisted Configuration):**
    *   UX Pattern: Standard Forms via `huh`. Includes "Retest Connection" buttons for PostgreSQL and the AI API.
    *   Flexible Validation: Errors do not block progression; users can continue even if a connection is not yet successful.
    *   Silent Mode: `--silent` flag bypasses forms to generate the default `config.yaml`.
*   **`joshua scraper run-now` (Real-time Monitoring):**
    *   UX Pattern: Dual-view interface with a State-Based status table and a toggleable raw Log tab.
    *   Context: Can be used to manually trigger a run or monitor an already active background process.
*   **`joshua user` (Identity Management):**
    *   **`list`**: View all users with ID, email, name, role, and last activity date.
    *   **`create`**: Manually provision a new user (useful for admin/testing).
    *   UX Pattern: Tabular output for lists; flag-based input for creation.

### 3.3 Visual & Terminal Design

*   **Styling:** Uses Lip Gloss with "Short Tide" color palettes (professional blues/teals).
*   **Theming:** The Web Portal supports multiple color schemes via a user-selectable setting.
    *   **WOPR (Default):** A "Phosphor-Modernism" aesthetic with Amber/Green terminals on deep Midnight Ebony backgrounds.
    *   **Light/Dark:** Standard variants for traditional business use.
    *   **Forest:** A calming green-based palette.
*   **Terminal Awareness:** Graceful detection with fallback to ASCII; suggests upgrade if a basic terminal is detected.
*   **Help System:** Dedicated help key (`?`) in all TUI views for context-sensitive documentation.

## 4. Technical Requirements

*   **Database & Migrations:**
    *   Engine: PostgreSQL.
    *   Migrations: Handled via the CLI with SQL files embedded in the binary.
    *   Audit Log: Records all user interactions to generate aggregated organizational pursuit statistics.
*   **Security & Authentication:**
    *   **Dual-Mode Authentication:** Support for both standalone (Email/Password) and SSO (SAML/OIDC) authentication methods.
    *   **Standalone:** Secure local storage of credentials using industry-standard hashing (bcrypt).
    *   **SSO Integration:** Authentication via organizational SSO (SAML/OIDC) for enterprise users.
    *   **Open Enrollment:** Automatic user provisioning upon first successful login (SSO only) or self-registration (Standalone).
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
2.  Generate configuration: `joshua config init`
3.  Run Migrations: `joshua migrate up`
4.  Start the Portal: `joshua serve`

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
    *   Implement basic CLI structure (`joshua root`, `joshua version`).
    *   Create `joshua config init` with basic `huh` forms.

### Phase 2: Identity & Basic Data Ingestion
*   **Goal:** Enable user login and start populating the system with data.
*   **Status:** Mostly Complete.
*   **Tasks:**
    *   [x] Implement Database Schema for Users and Solicitations.
    *   [x] Build Scraper engine foundation and implement one primary data source (GPR).
    *   [x] Implement Detail Page Scraping and Document Storage.
    *   [x] Develop "Global Library" API and Frontend view (read-only) with Analytics Dashboard.
    *   [x] Implement Basic Authentication (Standalone with bcrypt) and Mock SSO.

### Phase 3: Intelligence & Personalization
*   **Goal:** Connect the "Brain" (LLM) and enable user-specific features.
*   **Status:** Complete.
*   **Tasks:**
    *   [x] Integrate OpenAI-compatible API client.
    *   [x] Build "Narrative Editor" (Frontend) and storage (Backend).
    *   [x] Implement the Matching Engine logic (Solication vs. Narrative).
    *   [x] Add Match Threshold Configuration (Slider 0-100) and Rubric support in Prompt.
    *   [x] Create the "Personal Inbox" view and logic.

### Phase 4: Collaboration & Workflow
*   **Goal:** Transform the tool from a reader to a workspace.
*   **Status:** In Progress.
*   **Tasks:**
    *   [x] Implement "Claim" (Take Lead/Interested) workflow.
    *   [ ] Implement "Share" and "Archive" workflows.
    *   [x] Build "Collaborative Workspace" functionality (integrated into Library/Inbox/Details).
    *   [x] Implement Solicitation Comments.
    *   [x] Add Organization Management (CLI & Profile Sync).
    *   [ ] Add Audit Logging for user actions.
    *   [ ] Develop TUI Monitoring command (`joshua scraper run-now`).
    *   [x] Update the URL to map directly each view (including `/developer/tasks`, `/developer/requirements`)

### Phase 5: Polish & Scale
*   **Goal:** Prepare for production deployment and organizational rollout.
*   **Status:** In Progress.
*   **Tasks:**
    *   [ ] Implement full SSO (SAML/OIDC).
    *   [ ] Add Email and Slack notifications.
    *   [ ] Build Organizational Analytics dashboard.
        *   [x] Implement Landing Page & App Hub.
            *   [x] Implement Feedback App & Developer Tools.
                *   [x] Developer Task List (Sync from requirements.md).
                        *   [x] Automatic Task Sync on Save (Web UI trigger).
                                    *   [x] Upgrade Requirements Editor (Monaco, Version History, Revert).
                                    *   [x] Narrative Versioning & Monaco Editor in User Profile.
                                    *   [x] Direct URL mapping for each view (/tasks, /requirements).
                                        *   [x] Consolidate sub-navigation tabs into the main Navbar for consistency.
            *   [x] UI/UX Polish (Full-width Web Layout, CLI JSON Output).
                    *   [x] Rebranding to JOSHUA and WOPR Theme implementation.
        *   [x] Implement Interactive Chat Interface (Streaming).
        *   [ ] Finalize CI/CD pipelines and comprehensive unit testing.

### Phase 6: Strategic Growth (IRAD)

*   **Goal:** Implement a comprehensive IRAD management system to balance creative flexibility with strategic oversight.

*   **Status:** In Progress.

*   **Tasks:**

    *   [x] Establish IRAD Data Schema and API foundation.

    *   [x] Implement Strategy Dashboard (Sunburst Chart, Gap Heatmap, ROI Tracker).

        *   [ ] Build Roadmap Builder (Interactive Gantt, Dependency Mapper, Resource Histogram).

        *   [ ] Develop Researcher Sandbox (Collaborative Space, Similarity Engine, Template Library).

            *   [x] Create Reviewer Portal (Comparison Tools, Scorecards, Budget Toggles).

            *   [x] Establish Core Workflows (Strategy Definition, Proposal Submission, Execution Tracking).

        

    
