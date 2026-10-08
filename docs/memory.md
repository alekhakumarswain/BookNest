# Project Memory & Context Tracker: BookNest

## 1. Project Meta Information
- **Project Name**: BookNest
- **Workspace Location**: `f:\Projects\BookNest`
- **Primary Goal**: Building a modern, full-stack, real-time reading tracker application with custom shelves, granular RBAC shelf sharing, cross-user book lending rules, reading progress validation, activity audit feed, and WebSockets real-time updates.

---

## 2. Technical Stack & Key Architecture Decisions
- **Frontend Framework**: Next.js 14 (App Router) + React + TypeScript
- **Styling & UI**: Tailwind CSS (Dark Slate & Amber Gold palette), Lucide Icons
- **Backend Framework**: Python 3.11+ & FastAPI + Pydantic v2 + Uvicorn
- **Database & Driver**: MongoDB + Motor (Async Driver)
- **Authentication**: JWT Access Tokens (15 min in-header) + Refresh Tokens (7 days HTTP-only cookie & MongoDB storage) + Direct Bcrypt Security Utility
- **Real-Time Protocol**: FastAPI Native WebSockets with JWT query token handshake auth and room broadcasting (`user:<id>`, `shelf:<id>`)
- **API Architecture**: RESTful API + Axios client with silent HTTP 401 interceptor auto-refresh

---

## 3. Data Model Snapshot (MongoDB Document Models)
- `users`: `id`, `name`, `email`, `password_hash`, `created_at`, `updated_at`
- `refresh_tokens`: `id`, `token`, `user_id`, `expires_at`, `created_at`
- `books`: `id`, `owner_id`, `title`, `author`, `status`, `total_pages`, `current_page`, `rating`, `notes`, `finished_date`
- `shelves`: `id`, `owner_id`, `name`, `description`, `book_ids` (Array of Book ObjectIds)
- `shelf_shares`: `id`, `shelf_id`, `user_id`, `role` (`editor` | `viewer`)
- `lendings`: `id`, `book_id` (Unique), `lender_id`, `borrower_id`, `borrowed_at`
- `activity_logs`: `id`, `user_id`, `action`, `details`, `metadata`, `created_at`

---

## 4. Key Engineering Constraints & Business Rules
- **Authentication**: Email regex format check + password policy (>=8 chars, uppercase, lowercase, number, special char). Passwords hashed with bcrypt.
- **Access Isolation**: Backend enforces `owner_id` checks or verified `shelf_shares`/`lendings` documents. Direct unauthenticated/unauthorized calls return 401/403.
- **RBAC**: `owner` (full control), `editor` (add/remove shelf books), `viewer` (read-only). Backend helper `get_shelf_user_role` rejects `viewer` modifications with 403 Forbidden.
- **Reading Progress**: Validate `current_page <= total_pages`, `current_page >= 0`, `total_pages > 0`. When `current_page == total_pages`, auto-update status to `Finished` with `finished_date`.
- **Lending Rules**: Single borrower only (cannot lend already-lent book). Cannot lend to self. Must own the book. Owner or borrower can mark returned.
- **Real-Time WebSockets**: Authenticated via JWT handshake. Scoped room broadcasts (`user:<user_id>`, `shelf:<shelf_id>`). Auto-reconnect handling on drop.

---

## 5. Documentation Directory Map
- [`prd.md`](file:///f:/Projects/BookNest/docs/prd.md) - Complete Product Requirements & Scope
- [`architecture.md`](file:///f:/Projects/BookNest/docs/architecture.md) - System Architecture, MongoDB Schemas, FastAPI Specs & WebSocket Scoping
- [`design.md`](file:///f:/Projects/BookNest/docs/design.md) - Visual Aesthetics, Dark Mode Palette, UI Layouts & UX Guidelines
- [`phases.md`](file:///f:/Projects/BookNest/docs/phases.md) - 10-Phase Step-by-Step Implementation Roadmap
- [`rules.md`](file:///f:/Projects/BookNest/docs/rules.md) - Core Business Logic, Security Constraints & Backend Validation Rules
- [`tasks.md`](file:///f:/Projects/BookNest/docs/tasks.md) - Checkable Task List for Execution Tracking
- [`memory.md`](file:///f:/Projects/BookNest/docs/memory.md) - Project Context & Architecture Memory Log

---

## 6. Project Status Log
- **[2026-10-06]**: User specified stack update: **Next.js** (Frontend) + **Python FastAPI** (Backend) + **MongoDB** (Database) + **JWT Refresh Tokens** + **WebSockets** + **Attractive Dark/Amber Styling**. All architecture and specification documents updated.
- **[2026-10-06]**: **Phase 1 Completed**. Monorepo directory structure setup, Python virtual environment, FastAPI + Pydantic v2 document models, MongoDB Motor driver + index initializations, and Next.js 14 frontend structure configured.
- **[2026-10-06]**: **Phase 2 Completed**. Implemented JWT authentication & refresh token flow, password rules & bcrypt hashing, FastAPI `get_current_user` guard dependency, silent Axios 401 interceptor auto-refresh flow, and Next.js AuthContext, Signup, and Login pages.
- **[2026-10-06]**: **Phase 3 Completed**. Implemented server-side paginated & filtered books API, title/author regex search, multi-field sorting, automatic reading completion triggers, referential cascade cleanup on deletion, and complete React Book Library page.
- **[2026-10-08]**: **Phases 4-10 Completed**. Implemented Custom Shelves & Many-to-Many relationships, Shared Shelves with RBAC permissions (`editor` & `viewer`), Reading Progress PATCH endpoint with validation and auto-finish rules, Lending Engine with single-borrower constraints & cross-user state tracking, Activity feed service & real-time WebSocket connection manager with JWT handshake, Dashboard overview with 6 metric cards, and automated Python database seed script (`backend/seed.py`).
