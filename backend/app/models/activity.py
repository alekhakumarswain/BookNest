from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel

class ActivityLogResponse(BaseModel):
    id: str
    user_id: str
    action: str
    details: str
    metadata: Optional[dict] = None
    created_at: datetime
