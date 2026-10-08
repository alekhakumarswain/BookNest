from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from app.database import get_database
from app.models.book import (
    BookStatus,
    BookCreateRequest,
    BookUpdateRequest,
    ProgressUpdateRequest,
    BookResponse,
    PaginatedBooksResponse
)
from app.dependencies.auth import get_current_user
from app.services.activity import log_activity

router = APIRouter(prefix="/api/books", tags=["Books"])

async def helper_format_book(book_doc: dict, db) -> BookResponse:
    book_id = str(book_doc["_id"])
    owner_id = str(book_doc["owner_id"])
    
    total_pages = book_doc.get("total_pages", 0)
    current_page = book_doc.get("current_page", 0)
    progress_pct = (current_page / total_pages * 100.0) if total_pages > 0 else 0.0

    # Check if book is currently lent out
    lending = await db.lendings.find_one({"book_id": book_id})
    is_lent = bool(lending)
    lent_to_info = None

    if is_lent:
        borrower = await db.users.find_one({"_id": ObjectId(lending["borrower_id"])})
        if borrower:
            lent_to_info = {
                "id": str(borrower["_id"]),
                "name": borrower.get("name", ""),
                "email": borrower.get("email", "")
            }

    return BookResponse(
        id=book_id,
        owner_id=owner_id,
        title=book_doc["title"],
        author=book_doc["author"],
        status=book_doc["status"],
        total_pages=total_pages,
        current_page=current_page,
        progress_percentage=round(progress_pct, 1),
        rating=book_doc.get("rating"),
        notes=book_doc.get("notes"),
        finished_date=book_doc.get("finished_date"),
        created_at=book_doc["created_at"],
        updated_at=book_doc["updated_at"],
        is_lent=is_lent,
        lent_to=lent_to_info
    )

@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    payload: BookCreateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if payload.current_page > payload.total_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Current page ({payload.current_page}) cannot exceed total pages ({payload.total_pages})."
        )

    now = datetime.now(timezone.utc)
    status_val = payload.status
    finished_date = None

    # Auto-finish if current_page == total_pages
    if payload.current_page == payload.total_pages and payload.total_pages > 0:
        status_val = BookStatus.FINISHED
        finished_date = now

    book_doc = {
        "owner_id": current_user["id"],
        "title": payload.title.strip(),
        "author": payload.author.strip(),
        "status": status_val.value if isinstance(status_val, BookStatus) else status_val,
        "total_pages": payload.total_pages,
        "current_page": payload.current_page,
        "rating": payload.rating,
        "notes": payload.notes.strip() if payload.notes else None,
        "finished_date": finished_date,
        "created_at": now,
        "updated_at": now
    }

    result = await db.books.insert_one(book_doc)
    book_doc["_id"] = result.inserted_id

    await log_activity(
        db,
        user_id=current_user["id"],
        action="BOOK_ADDED",
        details=f"Added '{payload.title}' by {payload.author} to library",
        metadata={"book_id": str(result.inserted_id), "title": payload.title}
    )

    return await helper_format_book(book_doc, db)


@router.get("", response_model=PaginatedBooksResponse)
async def list_books(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status (Want to Read, Reading, Finished)"),
    search: Optional[str] = Query(None, description="Search query for title or author"),
    sort_by: str = Query("created_at", description="Sort field: created_at, title, rating"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    query = {"owner_id": current_user["id"]}

    # Filter by Status
    if status and status.strip() and status != "All":
        query["status"] = status.strip()

    # Search by Title or Author (Regex case-insensitive)
    if search and search.strip():
        search_regex = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [
            {"title": search_regex},
            {"author": search_regex}
        ]

    # Sorting
    direction = -1 if sort_order.lower() == "desc" else 1
    valid_sort_fields = {"created_at": "created_at", "title": "title", "rating": "rating"}
    sort_field = valid_sort_fields.get(sort_by.lower(), "created_at")

    total_count = await db.books.count_documents(query)
    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    skip = (page - 1) * limit
    cursor = db.books.find(query).sort(sort_field, direction).skip(skip).limit(limit)

    book_docs = await cursor.to_list(length=limit)
    items = [await helper_format_book(doc, db) for doc in book_docs]

    return PaginatedBooksResponse(
        items=items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get("/{book_id}", response_model=BookResponse)
async def get_book_by_id(
    book_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format")

    book = await db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Access check: Must be owner OR borrower
    lending = await db.lendings.find_one({"book_id": book_id, "borrower_id": current_user["id"]})
    if str(book["owner_id"]) != current_user["id"] and not lending:
        raise HTTPException(status_code=403, detail="You do not have permission to view this book")

    return await helper_format_book(book, db)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: str,
    payload: BookUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format")

    book = await db.books.find_one({"_id": ObjectId(book_id), "owner_id": current_user["id"]})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found or access denied")

    total_pages = payload.total_pages if payload.total_pages is not None else book.get("total_pages", 0)
    current_page = payload.current_page if payload.current_page is not None else book.get("current_page", 0)

    if current_page > total_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Current page ({current_page}) cannot exceed total pages ({total_pages})."
        )

    now = datetime.now(timezone.utc)
    update_fields = {"updated_at": now}

    if payload.title is not None:
        update_fields["title"] = payload.title.strip()
    if payload.author is not None:
        update_fields["author"] = payload.author.strip()
    if payload.rating is not None:
        update_fields["rating"] = payload.rating
    if payload.notes is not None:
        update_fields["notes"] = payload.notes.strip()

    update_fields["total_pages"] = total_pages
    update_fields["current_page"] = current_page

    # Auto-finish if page == total_pages
    status_val = payload.status or book.get("status")
    if current_page == total_pages and total_pages > 0:
        status_val = BookStatus.FINISHED
        update_fields["finished_date"] = now
    elif payload.status is not None:
        status_val = payload.status

    update_fields["status"] = status_val.value if isinstance(status_val, BookStatus) else status_val

    await db.books.update_one({"_id": ObjectId(book_id)}, {"$set": update_fields})
    updated_doc = await db.books.find_one({"_id": ObjectId(book_id)})

    if book.get("status") != update_fields["status"]:
        await log_activity(
            db,
            user_id=current_user["id"],
            action="STATUS_CHANGED",
            details=f"Updated status of '{updated_doc['title']}' to {update_fields['status']}",
            metadata={"book_id": book_id, "new_status": update_fields["status"]}
        )

    return await helper_format_book(updated_doc, db)


@router.patch("/{book_id}/progress", response_model=BookResponse)
async def update_reading_progress(
    book_id: str,
    payload: ProgressUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format")

    book = await db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Access check: owner OR borrower can update progress
    lending = await db.lendings.find_one({"book_id": book_id, "borrower_id": current_user["id"]})
    if str(book["owner_id"]) != current_user["id"] and not lending:
        raise HTTPException(status_code=403, detail="You do not have permission to update progress for this book")

    total_pages = book.get("total_pages", 0)
    current_page = payload.current_page

    if current_page < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current page cannot be negative."
        )

    if total_pages <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update reading progress for a book with 0 total pages."
        )

    if current_page > total_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Current page ({current_page}) cannot exceed total pages ({total_pages})."
        )

    now = datetime.now(timezone.utc)
    new_status = book.get("status")
    finished_date = book.get("finished_date")

    if current_page == total_pages:
        new_status = BookStatus.FINISHED.value
        finished_date = now
    elif current_page > 0 and book.get("status") == BookStatus.WANT_TO_READ.value:
        new_status = BookStatus.READING.value

    update_doc = {
        "current_page": current_page,
        "status": new_status,
        "finished_date": finished_date,
        "updated_at": now
    }

    await db.books.update_one({"_id": ObjectId(book_id)}, {"$set": update_doc})
    updated_book = await db.books.find_one({"_id": ObjectId(book_id)})

    pct = round(current_page / total_pages * 100.0, 1)
    
    # Notify users: owner + borrower (if borrowed)
    notify_ids = [str(book["owner_id"])]
    if lending:
        notify_ids.append(str(lending["borrower_id"]))

    await log_activity(
        db,
        user_id=current_user["id"],
        action="PROGRESS_UPDATED",
        details=f"Updated progress on '{book['title']}' to page {current_page}/{total_pages} ({pct}%)",
        metadata={
            "book_id": book_id,
            "current_page": current_page,
            "total_pages": total_pages,
            "percentage": pct
        },
        notify_user_ids=notify_ids
    )

    return await helper_format_book(updated_book, db)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format")

    book = await db.books.find_one({"_id": ObjectId(book_id), "owner_id": current_user["id"]})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found or access denied")

    # Delete book document
    await db.books.delete_one({"_id": ObjectId(book_id)})

    # Clean up references from all shelves (remove book_id from book_ids arrays)
    await db.shelves.update_many(
        {"book_ids": book_id},
        {"$pull": {"book_ids": book_id}}
    )

    # Clean up active lendings
    await db.lendings.delete_many({"book_id": book_id})

    now = datetime.now(timezone.utc)
    await log_activity(
        db,
        user_id=current_user["id"],
        action="BOOK_DELETED",
        details=f"Deleted '{book['title']}' from library",
        metadata={"book_id": book_id}
    )

    return None
