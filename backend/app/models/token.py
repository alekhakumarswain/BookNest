from datetime import datetime
from pydantic import BaseModel

class RefreshTokenModel(BaseModel):
    id: str
    token: str
    user_id: str
    expires_at: datetime
    created_at: datetime
