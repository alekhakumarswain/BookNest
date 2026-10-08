from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class ShelfRole(str, Enum):
    EDITOR = "editor"
    VIEWER = "viewer"

class ShelfCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ShelfUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ShareShelfRequest(BaseModel):
    email: EmailStr
    role: ShelfRole = ShelfRole.VIEWER

class UpdateShareRoleRequest(BaseModel):
    role: ShelfRole

class CollaboratorInfo(BaseModel):
    share_id: str
    user_id: str
    name: str
    email: str
    role: ShelfRole

class ShelfResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    book_count: int = 0
    created_at: datetime
    updated_at: datetime
    role: str = "owner"  # "owner", "editor", "viewer"
    owner_info: Optional[dict] = None # {name, email} if shared with current user
    collaborators: List[CollaboratorInfo] = []
