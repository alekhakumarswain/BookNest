from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.database import get_database
from app.models.lending import LendBookRequest, LendingResponse, BorrowedUser
from app.dependencies.auth import get_current_user
from app.services.activity import log_activity

router = APIRouter(prefix="/api/lending", tags=["Book Lending"])

async def helper_format_lending(lending_doc: dict, db) -> LendingResponse:
    lending_id = str(lending_doc["_id"])
    book_id = str(lending_doc["book_id"])
    lender_id = str(lending_doc["lender_id"])
    borrower_id = str(lending_doc["borrower_id"])

    lender = await db.users.find_one({"_id": ObjectId(lender_id)})
    borrower = await db.users.find_one({"_id": ObjectId(borrower_id)})
    book = await db.books.find_one({"_id": ObjectId(book_id)})

    return LendingResponse(
        id=lending_id,
        book_id=book_id,
        lender=BorrowedUser(
            id=lender_id,
            name=lender.get("name", "Unknown") if lender else "Unknown",
            email=lender.get("email", "") if lender else ""
        ),
        borrower=BorrowedUser(
            id=borrower_id,
            name=borrower.get("name", "Unknown") if borrower else "Unknown",
            email=borrower.get("email", "") if borrower else ""
        ),
        book_title=book.get("title", "Unknown Book") if book else "Unknown Book",
        book_author=book.get("author", "Unknown Author") if book else "Unknown Author",
        borrowed_at=lending_doc["borrowed_at"]
    )


@router.post("", response_model=LendingResponse, status_code=status.HTTP_201_CREATED)
async def lend_book(
    payload: LendBookRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(payload.book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format")

    book = await db.books.find_one({"_id": ObjectId(payload.book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Constraint 1: Must own the book
    if str(book["owner_id"]) != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only lend books that you own in your library"
        )

    # Constraint 2: Cannot lend to self
    target_email = payload.borrower_email.strip().lower()
    if target_email == current_user["email"].lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot lend a book to yourself"
        )

    # Constraint 3: Borrower must exist on platform
    borrower = await db.users.find_one({"email": target_email})
    if not borrower:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No registered user found with email '{target_email}'"
        )

    borrower_id = str(borrower["_id"])

    # Constraint 4: Cannot lend book if already lent
    existing_lending = await db.lendings.find_one({"book_id": payload.book_id})
    if existing_lending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{book['title']}' is currently lent out to another user"
        )

    now = datetime.now(timezone.utc)
    lending_doc = {
        "book_id": payload.book_id,
        "lender_id": current_user["id"],
        "borrower_id": borrower_id,
        "borrowed_at": now
    }

    result = await db.lendings.insert_one(lending_doc)
    lending_doc["_id"] = result.inserted_id

    # Log activity and broadcast to both lender & borrower
    await log_activity(
        db,
        user_id=current_user["id"],
        action="BOOK_LENT",
        details=f"Lent '{book['title']}' to {borrower.get('name')} ({borrower['email']})",
        metadata={
            "lending_id": str(result.inserted_id),
            "book_id": payload.book_id,
            "borrower_id": borrower_id
        },
        notify_user_ids=[borrower_id]
    )

    return await helper_format_lending(lending_doc, db)


@router.get("/borrowed", response_model=List[LendingResponse])
async def list_borrowed_books(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    cursor = db.lendings.find({"borrower_id": current_user["id"]}).sort("borrowed_at", -1)
    lendings = await cursor.to_list(length=200)
    return [await helper_format_lending(doc, db) for doc in lendings]


@router.get("/lent", response_model=List[LendingResponse])
async def list_lent_out_books(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    cursor = db.lendings.find({"lender_id": current_user["id"]}).sort("borrowed_at", -1)
    lendings = await cursor.to_list(length=200)
    return [await helper_format_lending(doc, db) for doc in lendings]


@router.post("/{lending_id}/return", status_code=status.HTTP_200_OK)
async def return_borrowed_book(
    lending_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(lending_id):
        raise HTTPException(status_code=400, detail="Invalid lending ID format")

    lending = await db.lendings.find_one({"_id": ObjectId(lending_id)})
    if not lending:
        raise HTTPException(status_code=404, detail="Lending record not found")

    # Only lender OR borrower can mark book as returned
    if current_user["id"] not in [str(lending["lender_id"]), str(lending["borrower_id"])]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to mark this book as returned"
        )

    book = await db.books.find_one({"_id": ObjectId(lending["book_id"])})
    book_title = book.get("title", "Unknown Book") if book else "Unknown Book"

    await db.lendings.delete_one({"_id": ObjectId(lending_id)})

    other_user_id = str(lending["borrower_id"]) if current_user["id"] == str(lending["lender_id"]) else str(lending["lender_id"])

    await log_activity(
        db,
        user_id=current_user["id"],
        action="BOOK_RETURNED",
        details=f"Marked '{book_title}' as returned",
        metadata={
            "lending_id": lending_id,
            "book_id": lending["book_id"]
        },
        notify_user_ids=[other_user_id]
    )

    return {"status": "success", "message": f"'{book_title}' successfully returned"}
