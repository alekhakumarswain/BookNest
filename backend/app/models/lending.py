from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class LendBookRequest(BaseModel):
    book_id: str
    borrower_email: EmailStr

class BorrowedUser(BaseModel):
    id: str
    name: str
    email: str

class LendingResponse(BaseModel):
    id: str
    book_id: str
    lender: BorrowedUser
    borrower: BorrowedUser
    book_title: str
    book_author: str
    borrowed_at: datetime
