# Visual & UI/UX Design System: BookNest

## 1. Aesthetic Direction & Palette
BookNest features a modern, high-end "Dark Slate & Amber Gold" aesthetic inspired by classic libraries merged with contemporary web applications.

### 1.1 Color Palette
- **Background Base**: `#0F172A` (Deep Slate / Dark Mode Base)
- **Card / Surface Background**: `#1E293B` (Sleek Dark Slate Surface)
- **Elevated Hover Surface**: `#334155` (Slate Accent)
- **Primary Brand Accent**: `#F59E0B` (Warm Amber Gold)
- **Primary Hover**: `#D97706` (Deep Gold)
- **Secondary Accent**: `#6366F1` (Indigo Blue for Shelves & Collaboration)
- **Success / Finished Badge**: `#10B981` (Emerald Green)
- **Reading Badge**: `#3B82F6` (Electric Blue)
- **Want to Read Badge**: `#8B5CF6` (Vibrant Purple)
- **Lent / Borrowed Badge**: `#EC4899` (Warm Rose / Pink)
- **Text Primary**: `#F8FAFC` (Pure Slate White)
- **Text Secondary**: `#94A3B8` (Muted Slate Grey)
- **Error State**: `#EF4444` (Coral Red)

---

## 2. Typography & Icons
- **Font Family**: Inter / Plus Jakarta Sans via Google Fonts.
- **Heading Hierarchy**:
  - `H1`: 32px / Bold / Amber Accent highlight
  - `H2`: 24px / SemiBold
  - `H3`: 18px / Medium
  - `Body`: 14px / Regular
  - `Caption`: 12px / Muted
- **Icons**: Lucide Icons (`BookOpen`, `Library`, `Share2`, `Repeat`, `Star`, `Activity`, `ShieldAlert`, `CheckCircle`, `Clock`, `UserCheck`, `Plus`, `Search`, `Filter`).

---

## 3. Core Component Layouts

### 3.1 Main App Layout
- **Sidebar Navigation**: Fixed left-side vertical navbar with app logo, user profile badge, and links:
  - Dashboard
  - My Library (Books)
  - Custom Shelves
  - Shared Shelves ("Shared with me")
  - Borrowed Books ("Borrowed from others")
  - Activity Feed
- **Header Top Bar**: Search quick-bar, notification badge for real-time events, and quick "+ Add Book" button.
- **Main View Area**: Dynamic content panel with breadcrumbs and state containers.

### 3.2 Page-Specific Views

#### 1. Dashboard View
- **Metrics Grid**: 6 metric cards (Books by Status, Finished This Year, Avg Rating, Largest Shelf, Books Lent Out, Shared Shelves).
- **Activity Feed Panel**: Scrollable real-time reverse-chronological list of system events with avatar badges and timestamp labels.

#### 2. Books Library View
- **Controls Bar**:
  - Search Input (Title/Author) with debounced input.
  - Status Filter Dropdown (`All`, `Want to Read`, `Reading`, `Finished`).
  - Sort By Dropdown (`Title`, `Rating`, `Date Added`).
  - Pagination Controls (Page numbers, Next/Prev buttons).
- **Book Cards Grid**:
  - Book cover accent card, Title, Author, Status pill badge, Progress bar with % indicator, Rating star display, Shelf chips, Quick actions (`Edit`, `Lend`, `Progress`, `Delete`).

#### 3. Custom Shelves & Shared Shelves View
- **Shelf Header**: Shelf title, owner badge, role badge (`OWNER`, `EDITOR`, `VIEWER`), share button (Owner only).
- **Collaborators Drawer / Modal**: List of collaborators with role indicators (`EDITOR` / `VIEWER`) and management actions (`Change Role`, `Remove`).
- **Shelf Books Grid**: Books assigned to shelf with `Add Book to Shelf` modal trigger for Owners/Editors.

#### 4. Reading Progress Modal
- Input for `Current Page` (validated against `Total Pages`).
- Dynamic visual percentage bar updating live on keyup.
- Alert box for inline validation errors (e.g., `Page > Total`).

#### 5. Lending Engine Modal
- Select target borrower from dropdown or enter registered user email.
- Displays borrower status and lending history.
- "Mark Returned" button on active lent books.

---

## 4. Frontend UX Quality Guidelines

### 4.1 Data Loading & Error States
- **Loading State**: Shimmering skeleton cards for books, tables, and metric cards during initial API fetch.
- **Error State**: Non-blocking toast notifications and inline banner containers with retry buttons when requests fail.
- **Empty State**: Custom illustrations with call-to-action buttons (e.g., "No books found. Click 'Add Book' to get started!").

### 4.2 Inline Form Validation
- Standardized form error feedback underneath text inputs in text color `#EF4444`.
- Input fields receive red border focus ring on validation error.
- Example inline errors:
  - `"Password must contain at least 8 characters, 1 uppercase, and 1 special character"`
  - `"Current page cannot exceed total pages (350)"`
  - `"Cannot lend book: User is already borrowing this book"`

### 4.3 Double-Submit & Async Button States
- Form submission and modal action buttons disable immediately upon click.
- Button text changes to spinner state (e.g., `"Saving..."`, `"Lending..."`, `"Deleting..."`).

---

## 5. Real-Time UI Reaction Strategy
When Socket.io events are received on the client:
- **Lending Event**: Flash pink highlight banner on "Borrowed from others" tab badge and auto-insert borrowed book card with slide-down animation.
- **Shared Shelf Update**: Smooth grid item transition adding or removing book card without complete page reload.
- **Activity Feed**: Slide-in animation for top-row activity item with pulse icon indicator.
