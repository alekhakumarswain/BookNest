# Engineering Rules & Business Logic Constraints: BookNest

## 1. Authentication & Security Rules
1. **Password Rule**:
   - Minimum 8 characters.
   - Must contain at least 1 uppercase letter (`A-Z`), 1 lowercase letter (`a-z`), 1 numeric digit (`0-9`), and 1 special symbol (`!@#$%^&*`).
   - Plaintext passwords MUST NEVER be stored. Hashing algorithm: `bcrypt` via `passlib.context.CryptContext`.
2. **JWT Lifecycle**:
   - Access token expires in **15 minutes**.
   - Refresh token expires in **7 days**.
   - Unauthenticated API access returns HTTP `401 Unauthorized`.
   - Expired access tokens return HTTP `401 Unauthorized` with body `{"detail": "Token expired", "code": "ACCESS_TOKEN_EXPIRED"}`.
3. **Data Scope Rule**:
   - MongoDB queries must explicitly query by `owner_id: current_user.id` unless authorized by `shelf_shares` or `lendings` documents.

---

## 2. Book Management Rules
1. **Field Constraints (Pydantic Validation)**:
   - `title`: String, required, non-empty, max 255 chars.
   - `author`: String, required, non-empty, max 255 chars.
   - `status`: Enum (`Want to Read`, `Reading`, `Finished`). Default: `Want to Read`.
   - `total_pages`: Integer, required, strictly greater than 0 (`gt=0`).
   - `current_page`: Integer, default 0, must satisfy `0 <= current_page <= total_pages`.
   - `rating`: Optional integer between `1` and `5` (`ge=1, le=5`).
2. **Search, Filter, Pagination & Sorting**:
   - Server-side execution via MongoDB Motor queries. Slicing in memory on frontend is strictly prohibited.
   - Default page: `1`, default limit: `10`.
   - Sort fields allowed: `title`, `rating`, `created_at`. Default sort: `created_at DESC`.
3. **Deletion Clean Up**:
   - Deleting a book automatically cleans up its ID from all `shelves.book_ids` arrays and deletes any active `lendings` document for that book.

---

## 3. Shelves & Shared Shelves (RBAC) Rules
1. **Shelf Ownership**:
   - The creator of a shelf is its `owner`.
   - Only the `owner` can share the shelf, modify collaborator roles, remove collaborators, or delete the shelf.
2. **Collaborator Permissions**:
   - `editor`: Permitted to add books to the shelf (`POST /api/shelves/{id}/books`) and remove books from the shelf (`DELETE /api/shelves/{id}/books/{book_id}`).
   - `viewer`: Read-only. Permitted to view shelf metadata and shelf books. Any attempt by a `viewer` to add or remove books must be rejected on the backend with HTTP `403 Forbidden` (`{"detail": "Forbidden: Viewers cannot modify shelf content"}`).
3. **Shelf Deletion**:
   - Deleting a shelf deletes the shelf document and its associated `shelf_shares` documents. Books referenced in `book_ids` are NOT deleted.

---

## 4. Reading Progress Validation Rules
1. **Input Validation**:
   - `current_page > total_pages` -> Reject with HTTP 400 (`"Current page cannot exceed total pages"`).
   - `current_page < 0` -> Reject with HTTP 400 (`"Current page cannot be negative"`).
   - `total_pages` missing or <= 0 -> Reject with HTTP 400 (`"Total pages must be set before updating progress"`).
2. **Auto-Finish Trigger**:
   - When `current_page == total_pages`, backend automatically updates `status` to `Finished` and sets `finished_date = datetime.utcnow()`.

---

## 5. Lending Engine Rules
1. **Single Borrower Constraint**:
   - A book currently lent (`lendings` document exists where `book_id == target_book_id`) CANNOT be lent to another user. Return HTTP 400 (`"Book is currently lent to another user"`).
2. **Self-Lending Restriction**:
   - A user cannot lend a book to themselves (`lender_id == borrower_id`). Return HTTP 400 (`"You cannot lend a book to yourself"`).
3. **Ownership Requirement**:
   - A user can only lend a book that exists and has `owner_id == current_user.id`. Return HTTP 403 (`"You do not own this book"`).
4. **Return Mechanism**:
   - Only the book owner can invoke return (`POST /api/lending/{id}/return`). Upon return, the `lendings` document is deleted, restoring sole ownership control.

---

## 6. Real-Time WebSockets Rules
1. **Authentication Handshake**:
   - WebSocket connection MUST supply valid JWT access token during handshake. Disconnect immediately if missing or invalid.
2. **Scoped Broadcasting**:
   - Broadcast events MUST be scoped to specific rooms:
     - `LENDING_CREATED` / `LENDING_RETURNED` -> Emit ONLY to `user:<borrower_id>`.
     - `SHELF_UPDATED` -> Emit ONLY to `shelf:<shelf_id>`.
     - `ACTIVITY_LOGGED` -> Emit ONLY to `user:<user_id>`.
   - Global broadcast to all connected sockets is explicitly forbidden for private user events.
3. **Resilience**:
   - Client socket must auto-reconnect on drop. If socket fails, client relies on REST API polling or manual refresh gracefully.

---

## 7. Frontend Quality Rules
1. **No Silent Failures / Blank Screens**: Every fetch MUST render loading skeleton or error alert container.
2. **Inline Validation**: Errors displayed beneath respective inputs. Alert popups are forbidden for form validation.
3. **Double-Submit Prevention**: Buttons must disable and enter pending state on click.
