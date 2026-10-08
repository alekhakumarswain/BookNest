import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path
import sys

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.utils.security import hash_password

async def seed_data():
    print("Connecting to MongoDB for seeding...")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    print("Clearing existing collections...")
    await db.users.delete_many({})
    await db.refresh_tokens.delete_many({})
    await db.books.delete_many({})
    await db.shelves.delete_many({})
    await db.shelf_shares.delete_many({})
    await db.lendings.delete_many({})
    await db.activity_logs.delete_many({})

    hashed_password = hash_password("password123")
    now = datetime.now(timezone.utc)

    # 1. Create Users
    print("Seeding Users...")
    alice_res = await db.users.insert_one({
        "name": "Alice Vance",
        "email": "alice@example.com",
        "password_hash": hashed_password,
        "created_at": now
    })
    alice_id = str(alice_res.inserted_id)

    bob_res = await db.users.insert_one({
        "name": "Bob Builder",
        "email": "bob@example.com",
        "password_hash": hashed_password,
        "created_at": now
    })
    bob_id = str(bob_res.inserted_id)

    charlie_res = await db.users.insert_one({
        "name": "Charlie Brown",
        "email": "charlie@example.com",
        "password_hash": hashed_password,
        "created_at": now
    })
    charlie_id = str(charlie_res.inserted_id)

    print(f"Users created: Alice ({alice_id}), Bob ({bob_id}), Charlie ({charlie_id})")

    # 2. Seed Books for Alice
    print("Seeding Books for Alice...")
    dune_res = await db.books.insert_one({
        "owner_id": alice_id,
        "title": "Dune",
        "author": "Frank Herbert",
        "status": "Finished",
        "total_pages": 412,
        "current_page": 412,
        "rating": 5,
        "notes": "Masterpiece of sci-fi world-building. Highly recommended!",
        "finished_date": now - timedelta(days=20),
        "created_at": now - timedelta(days=30),
        "updated_at": now - timedelta(days=20)
    })
    dune_id = str(dune_res.inserted_id)

    hail_mary_res = await db.books.insert_one({
        "owner_id": alice_id,
        "title": "Project Hail Mary",
        "author": "Andy Weir",
        "status": "Reading",
        "total_pages": 496,
        "current_page": 250,
        "rating": 5,
        "notes": "Fascinating science problem-solving story. Rocky is amazing!",
        "finished_date": None,
        "created_at": now - timedelta(days=10),
        "updated_at": now - timedelta(days=2)
    })
    hail_mary_id = str(hail_mary_res.inserted_id)

    atomic_res = await db.books.insert_one({
        "owner_id": alice_id,
        "title": "Atomic Habits",
        "author": "James Clear",
        "status": "Reading",
        "total_pages": 320,
        "current_page": 120,
        "rating": 4,
        "notes": "Actionable insights on 1% improvements every day.",
        "finished_date": None,
        "created_at": now - timedelta(days=15),
        "updated_at": now - timedelta(days=1)
    })
    atomic_id = str(atomic_res.inserted_id)

    clean_code_res = await db.books.insert_one({
        "owner_id": alice_id,
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "status": "Want to Read",
        "total_pages": 464,
        "current_page": 0,
        "rating": None,
        "notes": "Plan to read during weekend tech study.",
        "finished_date": None,
        "created_at": now - timedelta(days=5),
        "updated_at": now - timedelta(days=5)
    })
    clean_code_id = str(clean_code_res.inserted_id)

    hobbit_res = await db.books.insert_one({
        "owner_id": alice_id,
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "status": "Finished",
        "total_pages": 310,
        "current_page": 310,
        "rating": 5,
        "notes": "Charming fantasy classic.",
        "finished_date": now - timedelta(days=45),
        "created_at": now - timedelta(days=60),
        "updated_at": now - timedelta(days=45)
    })
    hobbit_id = str(hobbit_res.inserted_id)

    # Books for Bob
    design_patterns_res = await db.books.insert_one({
        "owner_id": bob_id,
        "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
        "author": "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
        "status": "Reading",
        "total_pages": 395,
        "current_page": 180,
        "rating": 4,
        "notes": "Essential reference for architecture patterns.",
        "finished_date": None,
        "created_at": now - timedelta(days=12),
        "updated_at": now - timedelta(days=3)
    })

    orwell_res = await db.books.insert_one({
        "owner_id": bob_id,
        "title": "1984",
        "author": "George Orwell",
        "status": "Finished",
        "total_pages": 328,
        "current_page": 328,
        "rating": 5,
        "notes": "Chilling dystopian masterpiece.",
        "finished_date": now - timedelta(days=14),
        "created_at": now - timedelta(days=25),
        "updated_at": now - timedelta(days=14)
    })

    print("Books seeded.")

    # 3. Custom Shelves for Alice
    print("Seeding Shelves...")
    scifi_shelf_res = await db.shelves.insert_one({
        "owner_id": alice_id,
        "name": "Sci-Fi & Fantasy Masterpieces",
        "description": "All time favorite speculative fiction novels.",
        "book_ids": [dune_id, hail_mary_id, hobbit_id],
        "created_at": now - timedelta(days=28),
        "updated_at": now - timedelta(days=5)
    })
    scifi_shelf_id = str(scifi_shelf_res.inserted_id)

    growth_shelf_res = await db.shelves.insert_one({
        "owner_id": alice_id,
        "name": "Personal Growth",
        "description": "Books to enhance productivity and mindset.",
        "book_ids": [atomic_id],
        "created_at": now - timedelta(days=14),
        "updated_at": now - timedelta(days=14)
    })
    growth_shelf_id = str(growth_shelf_res.inserted_id)

    tech_shelf_res = await db.shelves.insert_one({
        "owner_id": alice_id,
        "name": "Software & Engineering",
        "description": "Technical manuals and software engineering classics.",
        "book_ids": [clean_code_id],
        "created_at": now - timedelta(days=5),
        "updated_at": now - timedelta(days=5)
    })

    # 4. Share Shelves with Bob
    print("Seeding Shelf Shares...")
    # Share Sci-Fi shelf with Bob as EDITOR
    await db.shelf_shares.insert_one({
        "shelf_id": scifi_shelf_id,
        "user_id": bob_id,
        "role": "editor",
        "created_at": now - timedelta(days=4)
    })

    # Share Growth shelf with Bob as VIEWER
    await db.shelf_shares.insert_one({
        "shelf_id": growth_shelf_id,
        "user_id": bob_id,
        "role": "viewer",
        "created_at": now - timedelta(days=2)
    })

    # 5. Lend a book from Alice to Bob
    print("Seeding Book Lending...")
    lending_res = await db.lendings.insert_one({
        "book_id": hobbit_id,
        "lender_id": alice_id,
        "borrower_id": bob_id,
        "borrowed_at": now - timedelta(days=3)
    })

    # 6. Activity Logs
    print("Seeding Activity Logs...")
    activities = [
        {
            "user_id": alice_id,
            "action": "BOOK_ADDED",
            "details": "Added 'Dune' by Frank Herbert to library",
            "metadata": {"book_id": dune_id, "title": "Dune"},
            "created_at": now - timedelta(days=30)
        },
        {
            "user_id": alice_id,
            "action": "STATUS_CHANGED",
            "details": "Updated status of 'Dune' to Finished",
            "metadata": {"book_id": dune_id, "new_status": "Finished"},
            "created_at": now - timedelta(days=20)
        },
        {
            "user_id": alice_id,
            "action": "SHELF_CREATED",
            "details": "Created shelf 'Sci-Fi & Fantasy Masterpieces'",
            "metadata": {"shelf_id": scifi_shelf_id},
            "created_at": now - timedelta(days=28)
        },
        {
            "user_id": alice_id,
            "action": "SHELF_SHARED",
            "details": "Shared shelf 'Sci-Fi & Fantasy Masterpieces' with Bob Builder (EDITOR)",
            "metadata": {"shelf_id": scifi_shelf_id, "collaborator_id": bob_id, "role": "editor"},
            "created_at": now - timedelta(days=4)
        },
        {
            "user_id": alice_id,
            "action": "BOOK_LENT",
            "details": "Lent 'The Hobbit' to Bob Builder (bob@example.com)",
            "metadata": {"lending_id": str(lending_res.inserted_id), "book_id": hobbit_id, "borrower_id": bob_id},
            "created_at": now - timedelta(days=3)
        },
        {
            "user_id": alice_id,
            "action": "PROGRESS_UPDATED",
            "details": "Updated progress on 'Project Hail Mary' to page 250/496 (50.4%)",
            "metadata": {"book_id": hail_mary_id, "current_page": 250, "total_pages": 496, "percentage": 50.4},
            "created_at": now - timedelta(days=2)
        }
    ]

    await db.activity_logs.insert_many(activities)
    print("Database seeding completed successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
