from typing import List
from fastapi import APIRouter, Depends, Query
from app.database import get_database
from app.models.activity import ActivityLogResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/activity", tags=["Activity Log"])

@router.get("", response_model=List[ActivityLogResponse])
async def get_activity_feed(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    query = {
        "$or": [
            {"user_id": current_user["id"]},
            {"metadata.collaborator_id": current_user["id"]},
            {"metadata.borrower_id": current_user["id"]},
            {"metadata.removed_user_id": current_user["id"]}
        ]
    }

    cursor = db.activity_logs.find(query).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)

    result = []
    for doc in docs:
        result.append(ActivityLogResponse(
            id=str(doc["_id"]),
            user_id=str(doc["user_id"]),
            action=doc["action"],
            details=doc["details"],
            metadata=doc.get("metadata"),
            created_at=doc["created_at"]
        ))

    return result
