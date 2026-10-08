from datetime import datetime, timezone
from typing import Optional, List
from app.websocket import manager

async def log_activity(
    db,
    user_id: str,
    action: str,
    details: str,
    metadata: Optional[dict] = None,
    notify_user_ids: Optional[List[str]] = None
):
    now = datetime.now(timezone.utc)
    activity_doc = {
        "user_id": user_id,
        "action": action,
        "details": details,
        "metadata": metadata or {},
        "created_at": now
    }
    result = await db.activity_logs.insert_one(activity_doc)
    activity_id = str(result.inserted_id)

    event_payload = {
        "type": "ACTIVITY_LOGGED",
        "activity": {
            "id": activity_id,
            "user_id": user_id,
            "action": action,
            "details": details,
            "metadata": metadata or {},
            "created_at": now.isoformat()
        }
    }

    # Always notify the triggering user
    target_users = set(notify_user_ids or [])
    target_users.add(user_id)

    for uid in target_users:
        await manager.broadcast_to_user(uid, event_payload)

    return activity_id
