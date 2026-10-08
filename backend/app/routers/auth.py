from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from bson import ObjectId
from app.database import get_database
from app.models.user import UserSignupRequest, UserLoginRequest, UserResponse, TokenResponse
from app.utils.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token,
    create_refresh_token,
    decode_refresh_token
)
from app.dependencies.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: UserSignupRequest,
    response: Response,
    db = Depends(get_database)
):
    # Validate password rules
    pwd_error = validate_password_strength(payload.password)
    if pwd_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pwd_error
        )

    # Check if email is already registered
    existing_user = await db.users.find_one({"email": payload.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create user document
    now = datetime.now(timezone.utc)
    user_doc = {
        "name": payload.name.strip(),
        "email": payload.email.lower().strip(),
        "password_hash": hash_password(payload.password),
        "created_at": now,
        "updated_at": now
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create access token & refresh token
    access_token = create_access_token({"sub": user_id, "email": user_doc["email"]})
    refresh_token = create_refresh_token({"sub": user_id})

    # Save refresh token in DB
    refresh_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await db.refresh_tokens.insert_one({
        "token": refresh_token,
        "user_id": user_id,
        "expires_at": refresh_expires,
        "created_at": now
    })

    # Set HTTP-only Cookie for refresh token
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False  # Set True in production with HTTPS
    )

    user_resp = UserResponse(
        id=user_id,
        name=user_doc["name"],
        email=user_doc["email"],
        created_at=now
    )

    return TokenResponse(access_token=access_token, user=user_resp)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLoginRequest,
    response: Response,
    db = Depends(get_database)
):
    user = await db.users.find_one({"email": payload.email.lower().strip()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)

    # Create access token & refresh token
    access_token = create_access_token({"sub": user_id, "email": user["email"]})
    refresh_token = create_refresh_token({"sub": user_id})

    # Save refresh token in DB
    refresh_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await db.refresh_tokens.insert_one({
        "token": refresh_token,
        "user_id": user_id,
        "expires_at": refresh_expires,
        "created_at": now
    })

    # Set HTTP-only Cookie for refresh token
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False
    )

    user_resp = UserResponse(
        id=user_id,
        name=user["name"],
        email=user["email"],
        created_at=user["created_at"]
    )

    return TokenResponse(access_token=access_token, user=user_resp)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    request: Request,
    response: Response,
    db = Depends(get_database)
):
    # Try reading token from cookie first, fallback to JSON body if provided
    refresh_token = request.cookies.get("refreshToken")
    if not refresh_token:
        try:
            body = await request.json()
            refresh_token = body.get("refresh_token")
        except Exception:
            pass

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing."
        )

    # Decode refresh token payload
    payload = decode_refresh_token(refresh_token)
    user_id = payload.get("sub")

    # Check if refresh token exists in DB
    stored_token = await db.refresh_tokens.find_one({"token": refresh_token})
    if not stored_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked refresh token."
        )

    # Delete old refresh token from DB (token rotation)
    await db.refresh_tokens.delete_one({"_id": stored_token["_id"]})

    # Lookup user
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )

    now = datetime.now(timezone.utc)

    # Issue new token pair
    new_access_token = create_access_token({"sub": user_id, "email": user["email"]})
    new_refresh_token = create_refresh_token({"sub": user_id})

    # Save new refresh token in DB
    refresh_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await db.refresh_tokens.insert_one({
        "token": new_refresh_token,
        "user_id": user_id,
        "expires_at": refresh_expires,
        "created_at": now
    })

    # Update HTTP-only Cookie
    response.set_cookie(
        key="refreshToken",
        value=new_refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False
    )

    user_resp = UserResponse(
        id=user_id,
        name=user["name"],
        email=user["email"],
        created_at=user["created_at"]
    )

    return TokenResponse(access_token=new_access_token, user=user_resp)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db = Depends(get_database)
):
    refresh_token = request.cookies.get("refreshToken")
    if refresh_token:
        await db.refresh_tokens.delete_one({"token": refresh_token})
    
    response.delete_cookie(key="refreshToken", path="/")
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"]
    )
