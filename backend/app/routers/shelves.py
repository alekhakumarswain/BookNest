from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.database import get_database
from app.models.shelf import (
    ShelfCreateRequest,
    ShelfUpdateRequest,
    ShareShelfRequest,
    UpdateShareRoleRequest,
    ShelfRole,
    ShelfResponse,
    CollaboratorInfo
)
from app.models.book import BookResponse
from app.dependencies.auth import get_current_user
from app.services.activity import log_activity
from app.routers.books import helper_format_book

router = APIRouter(prefix="/api/shelves", tags=["Custom Shelves"])

async def get_shelf_user_role(db, shelf_id: str, user_id: str) -> Optional[str]:
    """Returns 'owner', 'editor', 'viewer', or None"""
    if not ObjectId.is_valid(shelf_id):
        return None

    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id)})
    if not shelf:
        return None

    if str(shelf["owner_id"]) == user_id:
        return "owner"

    share = await db.shelf_shares.find_one({"shelf_id": shelf_id, "user_id": user_id})
    if share:
        return share["role"]

    return None

async def helper_format_shelf(shelf_doc: dict, current_user_id: str, db) -> ShelfResponse:
    shelf_id = str(shelf_doc["_id"])
    owner_id = str(shelf_doc["owner_id"])
    book_ids = shelf_doc.get("book_ids", [])
    
    # Determine current user role
    if owner_id == current_user_id:
        user_role = "owner"
    else:
        share = await db.shelf_shares.find_one({"shelf_id": shelf_id, "user_id": current_user_id})
        user_role = share["role"] if share else "viewer"

    # Fetch owner info if shared
    owner_info = None
    if owner_id != current_user_id:
        owner_user = await db.users.find_one({"_id": ObjectId(owner_id)})
        if owner_user:
            owner_info = {
                "id": owner_id,
                "name": owner_user.get("name", ""),
                "email": owner_user.get("email", "")
            }

    # Fetch collaborators list
    collaborators: List[CollaboratorInfo] = []
    shares_cursor = db.shelf_shares.find({"shelf_id": shelf_id})
    shares = await shares_cursor.to_list(length=100)
    for s in shares:
        collab_user = await db.users.find_one({"_id": ObjectId(s["user_id"])})
        if collab_user:
            collaborators.append(CollaboratorInfo(
                share_id=str(s["_id"]),
                user_id=str(collab_user["_id"]),
                name=collab_user.get("name", ""),
                email=collab_user.get("email", ""),
                role=ShelfRole(s["role"])
            ))

    return ShelfResponse(
        id=shelf_id,
        owner_id=owner_id,
        name=shelf_doc["name"],
        description=shelf_doc.get("description"),
        book_count=len(book_ids),
        created_at=shelf_doc["created_at"],
        updated_at=shelf_doc["updated_at"],
        role=user_role,
        owner_info=owner_info,
        collaborators=collaborators
    )


@router.post("", response_model=ShelfResponse, status_code=status.HTTP_201_CREATED)
async def create_shelf(
    payload: ShelfCreateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    now = datetime.now(timezone.utc)
    shelf_doc = {
        "owner_id": current_user["id"],
        "name": payload.name.strip(),
        "description": payload.description.strip() if payload.description else None,
        "book_ids": [],
        "created_at": now,
        "updated_at": now
    }

    result = await db.shelves.insert_one(shelf_doc)
    shelf_doc["_id"] = result.inserted_id

    await log_activity(
        db,
        user_id=current_user["id"],
        action="SHELF_CREATED",
        details=f"Created shelf '{payload.name}'",
        metadata={"shelf_id": str(result.inserted_id), "name": payload.name}
    )

    return await helper_format_shelf(shelf_doc, current_user["id"], db)


@router.get("", response_model=List[ShelfResponse])
async def list_owned_shelves(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    cursor = db.shelves.find({"owner_id": current_user["id"]}).sort("created_at", -1)
    shelf_docs = await cursor.to_list(length=200)
    return [await helper_format_shelf(doc, current_user["id"], db) for doc in shelf_docs]


@router.get("/shared", response_model=List[ShelfResponse])
async def list_shared_shelves(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    shares_cursor = db.shelf_shares.find({"user_id": current_user["id"]})
    shares = await shares_cursor.to_list(length=200)

    result_shelves = []
    for s in shares:
        shelf = await db.shelves.find_one({"_id": ObjectId(s["shelf_id"])})
        if shelf:
            result_shelves.append(await helper_format_shelf(shelf, current_user["id"], db))

    return result_shelves


@router.get("/{shelf_id}")
async def get_shelf_detail(
    shelf_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(shelf_id):
        raise HTTPException(status_code=400, detail="Invalid shelf ID format")

    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id)})
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")

    role = await get_shelf_user_role(db, shelf_id, current_user["id"])
    if not role:
        raise HTTPException(status_code=403, detail="You do not have access to this shelf")

    formatted_shelf = await helper_format_shelf(shelf, current_user["id"], db)

    # Fetch books inside shelf
    book_ids = shelf.get("book_ids", [])
    valid_obj_ids = [ObjectId(b) for b in book_ids if ObjectId.is_valid(b)]
    books_cursor = db.books.find({"_id": {"$in": valid_obj_ids}})
    book_docs = await books_cursor.to_list(length=500)
    formatted_books = [await helper_format_book(b, db) for b in book_docs]

    return {
        "shelf": formatted_shelf,
        "books": formatted_books
    }


@router.put("/{shelf_id}", response_model=ShelfResponse)
async def update_shelf(
    shelf_id: str,
    payload: ShelfUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(shelf_id):
        raise HTTPException(status_code=400, detail="Invalid shelf ID format")

    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id), "owner_id": current_user["id"]})
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found or permission denied")

    now = datetime.now(timezone.utc)
    update_data = {"updated_at": now}
    if payload.name is not None:
        update_data["name"] = payload.name.strip()
    if payload.description is not None:
        update_data["description"] = payload.description.strip()

    await db.shelves.update_one({"_id": ObjectId(shelf_id)}, {"$set": update_data})
    updated_shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id)})

    return await helper_format_shelf(updated_shelf, current_user["id"], db)


@router.delete("/{shelf_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shelf(
    shelf_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(shelf_id):
        raise HTTPException(status_code=400, detail="Invalid shelf ID format")

    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id), "owner_id": current_user["id"]})
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found or permission denied")

    await db.shelves.delete_one({"_id": ObjectId(shelf_id)})
    await db.shelf_shares.delete_many({"shelf_id": shelf_id})

    await log_activity(
        db,
        user_id=current_user["id"],
        action="SHELF_DELETED",
        details=f"Deleted shelf '{shelf['name']}'",
        metadata={"shelf_id": shelf_id}
    )

    return None


@router.post("/{shelf_id}/books")
async def add_book_to_shelf(
    shelf_id: str,
    book_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(shelf_id) or not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid shelf or book ID format")

    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id)})
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")

    role = await get_shelf_user_role(db, shelf_id, current_user["id"])
    if role not in ["owner", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only shelf owners and editors can add books to this shelf"
        )

    book = await db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    now = datetime.now(timezone.utc)
    await db.shelves.update_one(
        {"_id": ObjectId(shelf_id)},
        {
            "$addToSet": {"book_ids": book_id},
            "$set": {"updated_at": now}
        }
    )

    # Inform all shelf collaborators
    shares = await db.shelf_shares.find({"shelf_id": shelf_id}).to_list(length=100)
    collab_user_ids = [s["user_id"] for s in shares]
    collab_user_ids.append(str(shelf["owner_id"]))

    await log_activity(
        db,
        user_id=current_user["id"],
        action="SHELF_BOOK_ADDED",
        details=f"Added '{book['title']}' to shelf '{shelf['name']}'",
        metadata={"shelf_id": shelf_id, "book_id": book_id},
        notify_user_ids=collab_user_ids
    )

    updated_shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id)})
    return await helper_format_shelf(updated_shelf, current_user["id"], db)


@router.delete("/{shelf_id}/books/{book_id}")
async def remove_book_from_shelf(
    shelf_id: str,
    book_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(shelf_id) or not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid shelf or book ID format")

    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id)})
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")

    role = await get_shelf_user_role(db, shelf_id, current_user["id"])
    if role not in ["owner", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only shelf owners and editors can remove books from this shelf"
        )

    now = datetime.now(timezone.utc)
    await db.shelves.update_one(
        {"_id": ObjectId(shelf_id)},
        {
            "$pull": {"book_ids": book_id},
            "$set": {"updated_at": now}
        }
    )

    shares = await db.shelf_shares.find({"shelf_id": shelf_id}).to_list(length=100)
    collab_user_ids = [s["user_id"] for s in shares]
    collab_user_ids.append(str(shelf["owner_id"]))

    await log_activity(
        db,
        user_id=current_user["id"],
        action="SHELF_BOOK_REMOVED",
        details=f"Removed a book from shelf '{shelf['name']}'",
        metadata={"shelf_id": shelf_id, "book_id": book_id},
        notify_user_ids=collab_user_ids
    )

    updated_shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id)})
    return await helper_format_shelf(updated_shelf, current_user["id"], db)


@router.post("/{shelf_id}/shares", response_model=ShelfResponse)
async def share_shelf(
    shelf_id: str,
    payload: ShareShelfRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(shelf_id):
        raise HTTPException(status_code=400, detail="Invalid shelf ID format")

    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id), "owner_id": current_user["id"]})
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found or permission denied. Only owner can share.")

    target_email = payload.email.strip().lower()
    if target_email == current_user["email"].lower():
        raise HTTPException(status_code=400, detail="You cannot share a shelf with yourself")

    target_user = await db.users.find_one({"email": target_email})
    if not target_user:
        raise HTTPException(status_code=404, detail=f"No user found with email '{target_email}'")

    target_user_id = str(target_user["_id"])

    existing_share = await db.shelf_shares.find_one({"shelf_id": shelf_id, "user_id": target_user_id})
    if existing_share:
        raise HTTPException(status_code=400, detail=f"Shelf is already shared with {target_email}")

    now = datetime.now(timezone.utc)
    share_doc = {
        "shelf_id": shelf_id,
        "user_id": target_user_id,
        "role": payload.role.value,
        "created_at": now
    }
    await db.shelf_shares.insert_one(share_doc)

    await log_activity(
        db,
        user_id=current_user["id"],
        action="SHELF_SHARED",
        details=f"Shared shelf '{shelf['name']}' with {target_user['name']} ({payload.role.value.upper()})",
        metadata={"shelf_id": shelf_id, "collaborator_id": target_user_id, "role": payload.role.value},
        notify_user_ids=[target_user_id]
    )

    return await helper_format_shelf(shelf, current_user["id"], db)


@router.patch("/{shelf_id}/shares/{share_id}", response_model=ShelfResponse)
async def update_share_role(
    shelf_id: str,
    share_id: str,
    payload: UpdateShareRoleRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(shelf_id) or not ObjectId.is_valid(share_id):
        raise HTTPException(status_code=400, detail="Invalid shelf or share ID format")

    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id), "owner_id": current_user["id"]})
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found or permission denied")

    share = await db.shelf_shares.find_one({"_id": ObjectId(share_id), "shelf_id": shelf_id})
    if not share:
        raise HTTPException(status_code=404, detail="Share record not found")

    await db.shelf_shares.update_one(
        {"_id": ObjectId(share_id)},
        {"$set": {"role": payload.role.value}}
    )

    await log_activity(
        db,
        user_id=current_user["id"],
        action="ROLE_CHANGED",
        details=f"Updated collaborator role to {payload.role.value.upper()} on shelf '{shelf['name']}'",
        metadata={"shelf_id": shelf_id, "share_id": share_id, "new_role": payload.role.value},
        notify_user_ids=[share["user_id"]]
    )

    return await helper_format_shelf(shelf, current_user["id"], db)


@router.delete("/{shelf_id}/shares/{share_id}", response_model=ShelfResponse)
async def remove_collaborator(
    shelf_id: str,
    share_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not ObjectId.is_valid(shelf_id) or not ObjectId.is_valid(share_id):
        raise HTTPException(status_code=400, detail="Invalid shelf or share ID format")

    shelf = await db.shelves.find_one({"_id": ObjectId(shelf_id), "owner_id": current_user["id"]})
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found or permission denied")

    share = await db.shelf_shares.find_one({"_id": ObjectId(share_id), "shelf_id": shelf_id})
    if not share:
        raise HTTPException(status_code=404, detail="Share record not found")

    target_user_id = share["user_id"]
    await db.shelf_shares.delete_one({"_id": ObjectId(share_id)})

    await log_activity(
        db,
        user_id=current_user["id"],
        action="COLLABORATOR_REMOVED",
        details=f"Removed collaborator from shelf '{shelf['name']}'",
        metadata={"shelf_id": shelf_id, "removed_user_id": target_user_id},
        notify_user_ids=[target_user_id]
    )

    return await helper_format_shelf(shelf, current_user["id"], db)
