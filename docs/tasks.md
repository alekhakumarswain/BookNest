# Task Execution List: BookNest (FastAPI + MongoDB + Next.js)

## Phase 1: Environment Setup & Project Foundation
- [x] **Task 1.1**: Initialize monorepo or dual-folder structure (`/backend` Python FastAPI and `/frontend` Next.js).
- [x] **Task 1.2**: Set up Python virtual environment, `requirements.txt` (`fastapi`, `uvicorn[standard]`, `motor`, `pydantic`, `pyjwt`, `passlib[bcrypt]`, `websockets`), `.env.example`.
- [x] **Task 1.3**: Configure MongoDB Motor async client connection in `backend/app/database.py`.
- [x] **Task 1.4**: Define Pydantic document schemas in `backend/app/models/` (`User`, `RefreshToken`, `Book`, `Shelf`, `ShelfShare`, `Lending`, `ActivityLog`).
- [x] **Task 1.5**: Initialize Next.js 14 App Router frontend with TypeScript, Tailwind CSS, and Lucide icons.

---

## Phase 2: Authentication & JWT Refresh Engine
- [x] **Task 2.1**: Implement user password hashing utility using `passlib` with `bcrypt`.
- [x] **Task 2.2**: Implement `/api/auth/signup` endpoint with RFC email regex and strong password validation.
- [x] **Task 2.3**: Implement `/api/auth/login` endpoint issuing short-lived access JWT (15 mins) and setting `RefreshToken` (7 days) HTTP-only cookie + MongoDB record.
- [x] **Task 2.4**: Implement `/api/auth/refresh` endpoint to rotate access and refresh tokens.
- [x] **Task 2.5**: Implement `/api/auth/logout` endpoint clearing HTTP-only cookie and revoking database refresh token.
- [x] **Task 2.6**: Create FastAPI `get_current_user` dependency to protect private routes.
- [x] **Task 2.7**: Implement Axios client interceptor on Next.js frontend to silently catch HTTP 401 errors, invoke token refresh, and retry original requests seamlessly.

---

## Phase 3: Book Management & Discovery Engine
- [x] **Task 3.1**: Create `POST /api/books` endpoint to create a book with `title`, `author`, `status`, `total_pages`, optional `rating`, and `notes`.
- [x] **Task 3.2**: Create `GET /api/books` endpoint with server-side pagination (`page`, `limit`), filtering (`status`), regex search (`title`/`author`), and sorting (`title`, `rating`, `created_at`).
- [x] **Task 3.3**: Create `GET /api/books/{id}` and `PUT /api/books/{id}` endpoints.
- [x] **Task 3.4**: Create `DELETE /api/books/{id}` endpoint ensuring cleanup from shelf `book_ids` arrays and lendings.
- [x] **Task 3.5**: Build Next.js Book Library UI page with search bar, status dropdown filter, sort dropdown selector, pagination footer, and shimmer skeleton loading states.

---

## Phase 4: Custom Shelves & Many-to-Many Relationships
- [x] **Task 4.1**: Create `POST /api/shelves` (create shelf) and `GET /api/shelves` (list user shelves).
- [x] **Task 4.2**: Create `GET /api/shelves/{id}` (fetch shelf detail + shelf books) and `DELETE /api/shelves/{id}` (delete shelf without deleting books).
- [x] **Task 4.3**: Create `POST /api/shelves/{id}/books` (add book ID to shelf array) and `DELETE /api/shelves/{id}/books/{book_id}` (remove book ID from shelf array).
- [x] **Task 4.4**: Build Custom Shelves UI view and Shelf Detail view with book selection modal.

---

## Phase 5: Shared Shelves & Role-Based Access Control (RBAC)
- [x] **Task 5.1**: Create `POST /api/shelves/{id}/shares` endpoint (share shelf by user email with role `editor` or `viewer`).
- [x] **Task 5.2**: Create `PATCH /api/shelves/{id}/shares/{share_id}` (change role) and `DELETE /api/shelves/{id}/shares/{share_id}` (remove collaborator).
- [x] **Task 5.3**: Create `GET /api/shelves/shared` ("Shared with me" view returning shared shelves + assigned role).
- [x] **Task 5.4**: Create FastAPI RBAC dependency/helper `get_shelf_user_role` that rejects `viewer` attempts to modify shelf content with HTTP 403 Forbidden.
- [x] **Task 5.5**: Build "Shared with Me" view on frontend displaying role badges (`editor` / `viewer`) and collaborator management drawer for owners.

---

## Phase 6: Reading Progress & Validation Engine
- [x] **Task 6.1**: Create `PATCH /api/books/{id}/progress` endpoint accepting `current_page`.
- [x] **Task 6.2**: Implement strict validation:
  - Reject `current_page > total_pages` (400 Bad Request).
  - Reject `current_page < 0` (400 Bad Request).
  - Reject progress when `total_pages` is unset or 0 (400 Bad Request).
- [x] **Task 6.3**: Implement auto-completion trigger: if `current_page == total_pages`, set status to `Finished` and record `finished_date`.
- [x] **Task 6.4**: Build inline reading progress logger UI modal with live percentage indicator and error messaging.

---

## Phase 7: Lending Engine (Cross-User State Rules)
- [x] **Task 7.1**: Create `POST /api/lending` endpoint accepting `book_id` and `borrower_email`.
- [x] **Task 7.2**: Enforce backend lending rules in MongoDB:
  - Reject lending if book is already lent (HTTP 400).
  - Reject lending to self (HTTP 400).
  - Reject lending if user does not own book (HTTP 403).
- [x] **Task 7.3**: Create `GET /api/lending/borrowed` endpoint ("Borrowed from others" read-only view).
- [x] **Task 7.4**: Create `POST /api/lending/{id}/return` endpoint for owner to mark book returned.
- [x] **Task 7.5**: Build Lending Modal UI and "Borrowed from others" page on frontend.

---

## Phase 8: Activity Feed & Real-Time WebSockets
- [x] **Task 8.1**: Create helper service to record system activity events (`BOOK_ADDED`, `STATUS_CHANGED`, `BOOK_LENT`, `BOOK_RETURNED`, `SHELF_SHARED`, `ROLE_CHANGED`, `COLLABORATOR_REMOVED`).
- [x] **Task 8.2**: Create `GET /api/activity` endpoint to fetch user's reverse-chronological activity feed.
- [x] **Task 8.3**: Set up FastAPI `ConnectionManager` class with JWT authentication handshake.
- [x] **Task 8.4**: Implement room management (`user:<user_id>` and `shelf:<shelf_id>`).
- [x] **Task 8.5**: Broadcast real-time websocket events:
  - `LENDING_CREATED` & `LENDING_RETURNED` -> Emit to borrower room.
  - `SHELF_UPDATED` -> Emit to shelf room.
  - `ACTIVITY_LOGGED` -> Emit to user room.
- [x] **Task 8.6**: Connect WebSocket client in Next.js to auto-update Borrowed list, Shared Shelf contents, and Activity Feed in real-time.
- [x] **Task 8.7**: Implement graceful socket fallback and auto-reconnect handling.

---

## Phase 9: Dashboard Overview & UI Quality Polish
- [x] **Task 9.1**: Create `GET /api/dashboard/stats` endpoint returning status counts, books finished this year, average rating, largest shelf, count lent out, count shared with me.
- [x] **Task 9.2**: Build Dashboard UI with 6 metric cards + real-time activity feed.
- [x] **Task 9.3**: Polish loading skeletons, error alert containers, and disabled button spinner states across all forms.

---

## Phase 10: Seed Script, Testing & Video Demo Setup
- [x] **Task 10.1**: Write Python seed script (`backend/seed.py`) populating User 1 (Alice) and User 2 (Bob), sample books, custom shelves, shared shelves (`editor` & `viewer`), active lending, and activity logs.
- [x] **Task 10.2**: Create `.env.example` and test clean clone setup instructions.
- [x] **Task 10.3**: Conduct end-to-end testing of side-by-side browser real-time sync for lending, shelf editing, and activity feed.
