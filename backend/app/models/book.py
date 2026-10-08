from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field

class BookStatus(str, Enum):
    WANT_TO_READ = "Want to Read"
    READING = "Reading"
    FINISHED = "Finished"

class BookCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    status: BookStatus = BookStatus.WANT_TO_READ
    total_pages: int = Field(..., gt=0, description="Total pages must be greater than 0")
    current_page: int = Field(default=0, ge=0)
    rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    genre: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_filename: Optional[str] = None

class BookUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[BookStatus] = None
    total_pages: Optional[int] = Field(None, gt=0)
    current_page: Optional[int] = Field(None, ge=0)
    rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    genre: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_filename: Optional[str] = None

class ProgressUpdateRequest(BaseModel):
    current_page: int = Field(..., ge=0)

class BookResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    author: str
    status: BookStatus
    total_pages: int
    current_page: int
    progress_percentage: float = 0.0
    rating: Optional[int] = None
    notes: Optional[str] = None
    genre: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_filename: Optional[str] = None
    finished_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    is_lent: bool = False
    lent_to: Optional[dict] = None  # {id, name, email} if lent

class PaginatedBooksResponse(BaseModel):
    items: List[BookResponse]
    total: int
    page: int
    limit: int
    total_pages: int
