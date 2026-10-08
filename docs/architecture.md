# System Architecture & Technical Specifications: BookNest

## 1. Architecture Overview
BookNest is built as a modern full-stack web application employing a decoupled Client-Server architecture with a real-time event layer powered by Python (FastAPI) and MongoDB.

```
+-----------------------------------------------------------------------+
|                          Next.js Frontend                             |
|  - React 19 / TypeScript / Tailwind CSS / Lucide Icons                |
|  - Axios API Client + Silent JWT Refresh Interceptor                  |
|  - Socket.io-client / WebSocket Real-Time Listener                    |
+-----------------------------------+-----------------------------------+
                                    |
                    HTTP / REST     |      WebSockets (WSS)
                                    v
+-----------------------------------+-----------------------------------+
|                     Python (FastAPI) Backend                          |
|  - Python 3.11+ / FastAPI / Pydantic v2 / Uvicorn                     |
|  - JWT Auth + Passlib (bcrypt) + FastAPI Security Dependencies         |
|  - Motor Async MongoDB Driver / PyMongo                               |
|  - SocketManager / ConnectionManager with Scoped Room Broadcaster     |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                         MongoDB Database                              |
|  - Collections: users, refresh_tokens, books, shelves,                |
|    shelf_shares, lendings, activity_logs                              |
+-----------------------------------------------------------------------+
```

---

## 2. Technology Stack & Rationale

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (App Router) / React** | Server-side rendering, component-driven UI, TypeScript type safety, seamless routing. |
| **Backend Framework** | **Python 3.11+ & FastAPI** | High throughput async IO, native Pydantic data validation, OpenAPI docs, fast WebSocket handling. |
| **Database & ODM** | **MongoDB + Motor (Async Driver)** | Flexible JSON document model, fast async queries, clean embedding & referencing for shelves and lending records. |
| **Authentication** | **JWT (PyJWT) + Passlib (bcrypt)** | Stateless access tokens, secure HTTP-only cookie refresh tokens, bcrypt password hashing. |
| **Real-time Protocol** | **WebSockets / python-socketio** | Async real-time communication with connection manager for room-scoped messaging and auto-reconnection. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons** | Glassmorphism aesthetics, Amber Gold & Dark Slate theme, responsive UI components. |

---

## 3. Database Schemas & MongoDB Document Models

MongoDB storing collections with `_id` (ObjectId converted to string `id` in APIs).

### 3.1 Collections & Pydantic Models

#### 1. `users` Collection
```python
class UserDocument(BaseModel):
    id: str  # MongoDB _id as string
    name: str
    email: str  # Unique indexed
    password_hash: str
    created_at: datetime
    updated_at: datetime
```

#### 2. `refresh_tokens` Collection
```python
class RefreshTokenDocument(BaseModel):
    id: str
    token: str  # Unique indexed
    user_id: str  # References users.id
    expires_at: datetime
    created_at: datetime
```

#### 3. `books` Collection
```python
class BookStatus(str, Enum):
    WANT_TO_READ = "Want to Read"
    READING = "Reading"
    FINISHED = "Finished"

class BookDocument(BaseModel):
    id: str
    owner_id: str  # References users.id
    title: str
    author: str
    status: BookStatus = BookStatus.WANT_TO_READ
    total_pages: int
    current_page: int = 0
    rating: Optional[int] = None  # 1 to 5
    notes: Optional[str] = None
    finished_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
```

#### 4. `shelves` Collection
```python
class ShelfDocument(BaseModel):
    id: str
    owner_id: str  # References users.id
    name: str
    description: Optional[str] = None
    book_ids: List[str] = []  # List of book.id references (Many-to-Many relationship)
    created_at: datetime
    updated_at: datetime
```

#### 5. `shelf_shares` Collection
```python
class ShelfRole(str, Enum):
    EDITOR = "editor"
    VIEWER = "viewer"

class ShelfShareDocument(BaseModel):
    id: str
    shelf_id: str  # References shelves.id
    user_id: str   # Collaborator user.id
    role: ShelfRole
    created_at: datetime
```

#### 6. `lendings` Collection
```python
class LendingDocument(BaseModel):
    id: str
    book_id: str     # References books.id (Unique index guarantees single borrower)
    lender_id: str   # References users.id (Owner)
    borrower_id: str # References users.id (Borrower)
    borrowed_at: datetime
```

#### 7. `activity_logs` Collection
```python
class ActivityLogDocument(BaseModel):
    id: str
    user_id: str     # User targeted by activity
    action: str      # BOOK_ADDED, SHELF_SHARED, BOOK_LENT, etc.
    details: str     # Description string
    metadata: Optional[dict] = None
    created_at: datetime
```

---

## 4. Auth Architecture & JWT Refresh Token Flow

### 4.1 Token Storage Strategy
- **Access Token**: Expires in 15 minutes. Embedded in response body or `Authorization: Bearer <token>` header.
- **Refresh Token**: Expires in 7 days. Stored in database (`refresh_tokens` collection) and sent in secure `httpOnly`, `SameSite=Lax`, `Path=/api/auth` cookie.

### 4.2 Refresh Flow Sequence
1. Client calls API endpoint with Access Token.
2. If Access Token expired, FastAPI returns `HTTP 401 Unauthorized` (`{"detail": "Token expired", "code": "ACCESS_TOKEN_EXPIRED"}`).
3. Client Axios interceptor catches 401, issues `POST /api/auth/refresh` (cookie auto-attached).
4. FastAPI validates refresh token in MongoDB. If valid, generates new Access Token (and rotates refresh token), setting new cookie.
5. Interceptor retries original API request transparently.

---

## 5. Shared Shelves & RBAC FastAPI Dependency

### 5.1 RBAC Permission Matrix

| Action | Owner | Editor | Viewer | Non-Collaborator |
| :--- | :---: | :---: | :---: | :---: |
| View Shelf & Books | Yes | Yes | Yes | No (403) |
| Add Book to Shelf | Yes | Yes | No (403) | No (403) |
| Remove Book from Shelf | Yes | Yes | No (403) | No (403) |
| Share Shelf / Manage Roles | Yes | No (403) | No (403) | No (403) |
| Remove Collaborator | Yes | No (403) | No (403) | No (403) |
| Delete Shelf | Yes | No (403) | No (403) | No (403) |

### 5.2 FastAPI Access Control Dependency
```python
async def require_shelf_access(
    shelf_id: str,
    required_role: str, # "owner", "editor", "viewer"
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id)})
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    
    if str(shelf["owner_id"]) == str(current_user.id):
        return {"shelf": shelf, "role": "owner"}
        
    share = await db.shelf_shares.find_one({
        "shelf_id": shelf_id,
        "user_id": str(current_user.id)
    })
    
    if not share:
        raise HTTPException(status_code=403, detail="Access denied")
        
    role_levels = {"owner": 3, "editor": 2, "viewer": 1}
    if role_levels.get(share["role"], 0) < role_levels.get(required_role, 0):
        raise HTTPException(status_code=403, detail="Forbidden: Viewers cannot modify shelf content")
        
    return {"shelf": shelf, "role": share["role"]}
```

---

## 6. Real-Time WebSockets Architecture (FastAPI WebSocket Manager)

### 6.1 WebSocket Handshake & Auth
- Socket connection query string or initial frame passes `token=<JWT_ACCESS_TOKEN>`.
- FastAPI WebSocket endpoint authenticates token before accepting websocket connection (`await websocket.accept()`).

### 6.2 Connection & Room Scoping Manager
```python
class ConnectionManager:
    def __init__(self):
        # Maps room_id -> set of active WebSockets
        self.rooms: Dict[str, Set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        self.rooms[room_id].add(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        self.rooms[room_id].discard(websocket)

    async def broadcast_to_room(self, room_id: str, message: dict):
        for connection in list(self.rooms[room_id]):
            try:
                await connection.send_json(message)
            except Exception:
                self.rooms[room_id].discard(connection)
```

### 6.3 Room Scoping Targets
- `user:<user_id>`: Receives personal lending notifications, returned notifications, and activity feed additions.
- `shelf:<shelf_id>`: Receives shelf book additions/removals for collaborators currently viewing that shelf.

---

## 7. API Endpoints Contract (FastAPI)

### Auth Endpoints (`/api/auth`)
- `POST /api/auth/signup` - Register user (`name`, `email`, `password`)
- `POST /api/auth/login` - Authenticate (`email`, `password`) -> access token + HTTP-only refresh cookie
- `POST /api/auth/refresh` - Refresh tokens
- `POST /api/auth/logout` - Clear refresh cookie & revoke DB token
- `GET /api/auth/me` - Get current user profile

### Book Endpoints (`/api/books`)
- `GET /api/books` - Query params: `page`, `limit`, `status`, `search`, `sort_by`, `sort_order`
- `POST /api/books` - Create book (`title`, `author`, `status`, `total_pages`, `rating`, `notes`)
- `GET /api/books/{id}` - Fetch single book
- `PUT /api/books/{id}` - Update book
- `PATCH /api/books/{id}/progress` - Update current page reading progress (`current_page`)
- `DELETE /api/books/{id}` - Delete book (removes from shelves & lendings)

### Shelf Endpoints (`/api/shelves`)
- `GET /api/shelves` - List owned shelves
- `GET /api/shelves/shared` - List shelves shared with user ("Shared with me")
- `POST /api/shelves` - Create shelf (`name`, `description`)
- `GET /api/shelves/{id}` - Get shelf details & books
- `DELETE /api/shelves/{id}` - Delete shelf (Owner only)
- `POST /api/shelves/{id}/books` - Add book to shelf (Owner or Editor)
- `DELETE /api/shelves/{id}/books/{book_id}` - Remove book from shelf (Owner or Editor)
- `POST /api/shelves/{id}/shares` - Share shelf (`email`, `role`) (Owner only)
- `PATCH /api/shelves/{id}/shares/{share_id}` - Update collaborator role (Owner only)
- `DELETE /api/shelves/{id}/shares/{share_id}` - Revoke collaborator (Owner only)

### Lending Endpoints (`/api/lending`)
- `GET /api/lending/borrowed` - List books borrowed from others
- `GET /api/lending/lent` - List books lent out by user
- `POST /api/lending` - Lend book (`book_id`, `borrower_email`)
- `POST /api/lending/{id}/return` - Mark lent book as returned

### Dashboard & Activity (`/api/dashboard`, `/api/activity`)
- `GET /api/dashboard/stats` - Aggregated counts & metrics
- `GET /api/activity` - Reverse-chronological activity log
