from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from bson import ObjectId
from app.database import get_database
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Overview"])

@router.get("/stats")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    user_id = current_user["id"]
    current_year = datetime.now(timezone.utc).year

    # Aggregate status counts & total books owned
    books_cursor = db.books.find({"owner_id": user_id})
    books = await books_cursor.to_list(length=1000)

    total_books = len(books)
    status_counts = {
        "Want to Read": 0,
        "Reading": 0,
        "Finished": 0
    }
    ratings = []
    finished_this_year = 0

    for b in books:
        st = b.get("status")
        if st in status_counts:
            status_counts[st] += 1

        if b.get("rating") is not None:
            ratings.append(b["rating"])

        f_date = b.get("finished_date")
        if f_date and isinstance(f_date, datetime) and f_date.year == current_year and st == "Finished":
            finished_this_year += 1

    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0

    # Largest shelf owned
    shelves_cursor = db.shelves.find({"owner_id": user_id})
    shelves = await shelves_cursor.to_list(length=200)

    largest_shelf_info = None
    if shelves:
        sorted_shelves = sorted(shelves, key=lambda s: len(s.get("book_ids", [])), reverse=True)
        top = sorted_shelves[0]
        largest_shelf_info = {
            "name": top["name"],
            "book_count": len(top.get("book_ids", []))
        }

    # Books lent out by user
    lent_count = await db.lendings.count_documents({"lender_id": user_id})

    # Books borrowed by user
    borrowed_count = await db.lendings.count_documents({"borrower_id": user_id})

    # Shelves shared with user
    shared_count = await db.shelf_shares.count_documents({"user_id": user_id})

    return {
        "total_books": total_books,
        "status_counts": status_counts,
        "finished_this_year": finished_this_year,
        "average_rating": avg_rating,
        "largest_shelf": largest_shelf_info,
        "books_lent_out": lent_count,
        "books_borrowed": borrowed_count,
        "shelves_shared_with_me": shared_count
    }
