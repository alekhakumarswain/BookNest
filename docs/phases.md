# Phased Development Roadmap: BookNest (FastAPI + MongoDB + Next.js)

## Phase 1: Environment Setup & Project Foundation
- **Goal**: Initialize full-stack repository structure (`/backend` Python FastAPI and `/frontend` Next.js), environment variables, MongoDB database connection, and Pydantic schemas.
- **Tasks**:
  1. Set up project directory structure (`/backend` and `/frontend`).
  2. Configure Python virtual environment, `requirements.txt` (`fastapi`, `uvicorn`, `motor`, `pydantic`, `pyjwt`, `passlib[bcrypt]`, `websockets`), `.env.example`.
  3. Configure MongoDB Motor async client connection (`app/database.py`).
  4. Define Pydantic models for MongoDB documents (`User`, `RefreshToken`, `Book`, `Shelf`, `ShelfShare`, `Lending`, `ActivityLog`).
  5. Initialize Next.js 14 App Router frontend with Tailwind CSS, TypeScript, and Lucide icons.

---

## Phase 2: Authentication & JWT Refresh Token Engine
- **Goal**: Implement secure user registration, password hashing with passlib/bcrypt, access token issuing, refresh token storage in MongoDB, and silent client auto-refresh flow.
- **Tasks**:
  1. Implement `/api/auth/signup` with email formatting & password validation rules using `passlib.context.CryptContext(schemes=["bcrypt"])`.
  2. Implement `/api/auth/login` issuing short-lived access JWT (15 mins) and setting `RefreshToken` (7 days) HTTP-only cookie + MongoDB record.
  3. Implement `/api/auth/refresh` endpoint to rotate access and refresh tokens.
  4. Implement `/api/auth/logout` and `/api/auth/me`.
  5. Write FastAPI dependency `get_current_user` to protect routes.
  6. Configure Next.js Axios client with automatic 401 response interceptor for transparent refresh retries.

---

## Phase 3: Book Management & Discovery Engine
- **Goal**: Build full book CRUD with server-side pagination, combined status filtering, title/author search, and multi-field sorting using MongoDB queries.
- **Tasks**:
  1. Build `POST /api/books` (create book), `PUT /api/books/{id}`, `DELETE /api/books/{id}` (delete with cascade shelf array cleanup).
  2. Build `GET /api/books` with MongoDB regex search, status filtering, sorting, and pagination metadata.
  3. Build React Book Library view with search bar, status dropdown, sort selector, and pagination controls.
  4. Ensure loading skeleton states and error handling UI.

---

## Phase 4: Custom Shelves & Many-to-Many Relationships
- **Goal**: Implement custom shelf management and book-shelf assignment via MongoDB `book_ids` arrays without orphaned references.
- **Tasks**:
  1. Build `POST /api/shelves` (create shelf), `GET /api/shelves` (list user shelves), `GET /api/shelves/{id}` (shelf detail), `DELETE /api/shelves/{id}` (delete shelf without deleting books).
  2. Build `POST /api/shelves/{id}/books` (add book ID to shelf array) and `DELETE /api/shelves/{id}/books/{book_id}` (remove book ID).
  3. Ensure deleting a book cleans up book ID references in all shelf documents.
  4. Build Custom Shelves UI view and shelf detail modal.

---

## Phase 5: Shared Shelves & Role-Based Access Control (RBAC)
- **Goal**: Implement shelf sharing with `owner`, `editor`, and `viewer` roles, enforcing RBAC strictly via FastAPI dependencies.
- **Tasks**:
  1. Build `POST /api/shelves/{id}/shares` (share shelf by collaborator email with role).
  2. Build `PATCH /api/shelves/{id}/shares/{share_id}` (update role) and `DELETE /api/shelves/{id}/shares/{share_id}` (remove collaborator).
  3. Build `GET /api/shelves/shared` ("Shared with me" view listing assigned role).
  4. Create FastAPI dependency `require_shelf_access(minimum_role)` to block `viewer` roles from adding/removing books (returns 403 Forbidden).
  5. Build Shared Shelves UI with collaborator drawer and role badges.

---

## Phase 6: Reading Progress & Validation Logic
- **Goal**: Implement page logging with percent calculation, strict validation rules, and auto-finish status update.
- **Tasks**:
  1. Build `PATCH /api/books/{id}/progress` endpoint.
  2. Implement backend validation:
     - Reject `current_page > total_pages`.
     - Reject negative pages.
     - Reject updates if `total_pages` is missing/zero.
  3. Implement auto-completion trigger: if `current_page == total_pages`, set `status = FINISHED` and `finished_date = datetime.utcnow()`.
  4. Build inline progress logger UI modal with validation error feedback.

---

## Phase 7: Lending Engine (Cross-User State Rules)
- **Goal**: Implement lending books to registered users with single-borrower constraints and return controls.
- **Tasks**:
  1. Build `POST /api/lending` (lend book to user by email).
  2. Enforce rules in MongoDB:
     - Cannot lend a book currently lent to another person.
     - Cannot lend a book to yourself.
     - Cannot lend a book you don't own.
  3. Build `GET /api/lending/borrowed` ("Borrowed from others" read-only view).
  4. Build `POST /api/lending/{id}/return` (owner marks book returned, deleting lending record).
  5. Build Lending Modal and Borrowed Books UI tab.

---

## Phase 8: Activity Log & Real-Time WebSockets
- **Goal**: Broadcast live updates for lending, shared shelf edits, and activity feed across isolated WebSocket rooms in FastAPI.
- **Tasks**:
  1. Create activity logger helper function (`BOOK_ADDED`, `STATUS_CHANGED`, `BOOK_LENT`, `BOOK_RETURNED`, `SHELF_SHARED`, `ROLE_CHANGED`, `COLLABORATOR_REMOVED`).
  2. Create `GET /api/activity` endpoint to fetch user's reverse-chronological activity feed.
  3. Build FastAPI `ConnectionManager` class with JWT handshake auth.
  4. Implement room connection logic (`user:<user_id>` and `shelf:<shelf_id>`).
  5. Broadcast real-time websocket events on backend actions:
     - `LENDING_CREATED` & `LENDING_RETURNED` -> Emit to borrower room.
     - `SHELF_UPDATED` -> Emit to shelf room.
     - `ACTIVITY_LOGGED` -> Emit to user room.
  6. Connect WebSocket client in Next.js to auto-update Borrowed list, Shared Shelf contents, and Activity Feed in real-time.

---

## Phase 9: Dashboard & Frontend Polish
- **Goal**: Assemble main dashboard metrics and refine UI quality across all screens.
- **Tasks**:
  1. Build `GET /api/dashboard/stats` endpoint returning aggregated status counts, books finished this year, average rating, largest shelf, count lent out, count shared with me.
  2. Assemble Dashboard UI displaying 6 metric cards + live activity feed.
  3. Polish loading skeleton states, error alert banners, and disabled button spinners across all forms.

---

## Phase 10: Seed Script, Testing & Deliverables Preparation
- **Goal**: Provide automated Python seed data script, comprehensive README instructions, and video walkthrough prep.
- **Tasks**:
  1. Create `backend/seed.py` seeding:
     - User 1 (Alice - Owner) and User 2 (Bob - Borrower/Collaborator).
     - Books with various statuses, ratings, and notes.
     - Custom shelves, including a shelf shared with Bob as `EDITOR` and another as `VIEWER`.
     - Active book lending record from Alice to Bob.
  2. Verify clean clone setup instructions and `.env.example`.
  3. Prepare video recording script covering side-by-side multi-user demonstration.
