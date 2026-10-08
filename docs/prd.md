# Product Requirements Document (PRD): BookNest

## 1. Executive Summary
**BookNest** is a comprehensive, feature-rich web application designed for avid readers to organize their personal library, manage custom reading shelves, track reading progress, share shelves with collaborators under granular access controls (RBAC), lend books to other users on the platform, and experience real-time updates across shared interactions via WebSockets.

The application is built using a **Next.js** frontend, a **Python + FastAPI** backend, a **MongoDB** database, **JWT access/refresh authentication**, and native **FastAPI WebSockets**.

---

## 2. Goals & Objectives
- **Centralized Reading Hub**: Provide users with a sleek, performant interface to track books by status (`Want to Read`, `Reading`, `Finished`), log progress, and record ratings/notes.
- **Collaborative Shelf Management**: Enable users to create custom shelves and share them with other users with fine-grained permissions (`owner`, `editor`, `viewer`).
- **Robust Lending Engine**: Allow users to safely lend books to other registered platform users without double-lending or data corruption, ensuring single-borrower constraints and owner return controls.
- **Real-Time Synergy**: Deliver instant, sub-second UI updates via WebSockets when books are lent/returned or when shared shelves are modified, without requiring manual page refreshes.
- **Enterprise-Grade Security**: Enforce authentication (JWT + Refresh Tokens), password hashing (bcrypt), and strict backend authorization checks on every endpoint and WebSocket event.

---

## 3. Core Feature Scope

### 3.1 Authentication & User Management
1. **User Registration**:
   - Fields: `name`, `email`, `password`.
   - Email format validation (standard RFC 5322 regex).
   - Password policy enforcement: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (`!@#$%^&*`).
   - Secure password hashing using `bcrypt` (Passlib).
2. **JWT Authentication & Token Lifecycle**:
   - Short-lived Access Token (15 minutes) passed in the `Authorization: Bearer <token>` header.
   - Longer-lived Refresh Token (7 days) stored in a secure HTTP-only cookie and verified against MongoDB `refresh_tokens` collection.
   - Silent token refresh flow: client automatically intercepts `401 Unauthorized` responses, invokes `/api/auth/refresh`, updates access token, and retries the original failed request seamlessly.
3. **Data Scope Isolation**:
   - Backend middleware & Pydantic validation guarantee users can only read/write their own records, unless shared shelf roles or lending records grant explicit cross-user access.
   - Unauthenticated access returns HTTP 401. Unauthorized cross-tenant actions return HTTP 403.

### 3.2 Book Management & Discovery
1. **Book Schema & Operations**:
   - Fields: `id`, `owner_id`, `title`, `author`, `status` (`Want to Read`, `Reading`, `Finished`), `total_pages`, `current_page`, `rating` (1 to 5 stars, optional), `notes` (optional), `finished_date`, `created_at`, `updated_at`.
   - Full CRUD: Add, View, Edit, Delete.
   - Safe Deletion: Deleting a book automatically cleans up references in shelf arrays and active lendings without leaving orphaned data.
2. **Filter & Search Engine**:
   - **Combined Server-Side Filtering & Search**: Active simultaneously in MongoDB queries (e.g., status=`Reading` AND title/author regex search).
   - **Server-Side Pagination**: `page` (1-indexed) and `limit` (e.g., 10 or 25 items per page).
   - **Server-Side Sorting**: Sort by `title` (asc/desc), `rating` (asc/desc), or `created_at` (asc/desc).
   - *Requirement*: Client passes `page`, `limit`, `status`, `search`, `sort_by`, `sort_order` to FastAPI. Backend executes MongoDB query and returns metadata (`total_items`, `total_pages`, `current_page`).

### 3.3 Shelves & Many-to-Many Organization
1. **Custom Shelves**:
   - Fields: `id`, `owner_id`, `name`, `description` (optional), `book_ids` (array of book ObjectIds), `created_at`.
   - Many-to-Many Relationship: A book can belong to multiple shelves; a shelf holds references to multiple books.
2. **Shelf Book Operations**:
   - Add book to shelf, remove book from shelf, view books on a specific shelf.
   - **Referential Integrity**:
     - Deleting a shelf does NOT delete its books.
     - Deleting a book automatically removes its ID from all shelf `book_ids` arrays.

### 3.4 Shared Shelves & Role-Based Access Control (RBAC)
1. **Collaborator Roles**:
   - **Owner**: The user who created the shelf. Full privileges (manage shelf, share with others, assign/revoke roles, delete shelf, add/remove books).
   - **Editor**: Can add and remove books on the shared shelf. Cannot delete shelf, share shelf, or manage collaborators.
   - **Viewer**: Read-only access. Can view shelf details and books on the shelf. Rejects any attempt to add or remove books.
2. **Sharing Mechanism**:
   - Owner shares shelf by entering target user's registered email address.
   - Owner can update collaborator role (`editor` <-> `viewer`) or remove a collaborator.
3. **Backend Access Enforcement**:
   - FastAPI `require_shelf_access` dependency validates user identity and shelf permissions before performing operations:
     - Direct API call by a `viewer` to add/remove a book returns HTTP `403 Forbidden` with message: `"Forbidden: Viewers cannot modify shelf content"`.
     - Direct API call by `editor` or `viewer` to invite collaborators, change roles, or delete shelf returns HTTP `403 Forbidden`.
4. **"Shared With Me" View**:
   - Dedicated dashboard section displaying shelves shared with the current user, displaying shelf details, owner info, and assigned role.

### 3.5 Reading Progress Engine
1. **Progress Tracking**:
   - Log `current_page` for books in `Reading` status.
   - Compute percentage dynamically: `(current_page / total_pages) * 100`.
2. **Strict Validation Constraints**:
   - Reject `current_page > total_pages` (Error: `"Current page cannot exceed total pages"`).
   - Reject `current_page < 0` (Error: `"Current page cannot be negative"`).
   - Reject progress updates if `total_pages` is unset or invalid (Error: `"Total pages must be set before updating progress"`).
   - Display validation errors inline without app crash or alert boxes.
3. **Auto-Completion Trigger**:
   - When `current_page == total_pages`, status auto-updates to `Finished` and `finished_date` is recorded.

### 3.6 Lending Engine (Cross-User State Rules)
1. **Lending Protocol**:
   - Owner marks book as "Lent to" another user by target email address.
2. **Borrower View ("Borrowed from others")**:
   - Borrower views list of books currently lent to them.
   - Read-only: Borrower cannot modify title, status, notes, or progress of the owner's book.
3. **Single-Borrower & Lending Constraints**:
   - A book currently lent cannot be lent to a second user (Error: `"Book is currently lent to another user"`).
   - User cannot lend a book to themselves (Error: `"You cannot lend a book to yourself"`).
   - User cannot lend a book that does not exist or is not owned by them (HTTP 403/404).
4. **Return Protocol**:
   - Owner can mark book as "Returned", deleting the lending document and restoring full single-owner control.

### 3.7 Activity Feed & Audit Logging
1. **Logged Events**:
   - `BOOK_ADDED`, `STATUS_CHANGED`, `BOOK_LENT`, `BOOK_RETURNED`, `SHELF_SHARED`, `ROLE_CHANGED`, `COLLABORATOR_REMOVED`.
2. **Feed Display**:
   - Simple reverse-chronological activity feed on the main dashboard.
   - Real-time auto-insertion of new events for the logged-in user.

### 3.8 Real-Time WebSockets (FastAPI WebSockets)
1. **Security & Authentication**:
   - WebSocket connection authenticated via JWT token in connection query or auth frame. Unauthenticated socket connections are immediately closed.
2. **Targeted Event Scoping**:
   - Socket events are joined to private connection rooms: `user:<user_id>` and `shelf:<shelf_id>`.
   - **No global broadcasts**.
3. **Resilience & Fallback**:
   - Client automatically reconnects on disconnect.
   - If socket drops, app continues operating via REST API calls.

---

## 4. Frontend UX & Quality Standards
- **Loading States**: Skeletons or spinners displayed during API fetches.
- **Error States**: User-friendly banner/card displays with retry options on request failure.
- **Inline Validation**: Form inputs highlight red with descriptive helper messages for invalid fields.
- **Double-Submit Prevention**: Action buttons disable and display spinner state while requests are pending.
- **Responsive Design**: Adaptable UI with Amber Slate visual theme.
