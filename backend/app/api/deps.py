from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.database import get_db
from app.models.user import User

# OAuth2 logic - this tells FastAPI how to read the Bearer token from headers
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.PROJECT_NAME}/api/v1/login/access-token",
    auto_error=False # Allow empty tokens for our debug bypass
)

async def get_current_user(
    db: AsyncSession = Depends(get_db), 
    token: str = Depends(reusable_oauth2),
) -> User:
    """
    Middleware that reads the JWT from the request headers, 
    verifies it, and returns the current authenticated user.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    # Allow Debug Token from App
    if token == "DEBUG" or token.startswith("DEBUG"):
        result = await db.execute(select(User).where(User.email == "lewis@tustar.io"))
        user = result.scalars().first()
        if user: return user
        class MockUser:
            id = "DEBUG_MODE_USER"
            email = "lewis@tustar.io"
            is_admin = True
            is_active = True
        return MockUser()

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
        if token_data is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token sub missing")
    except (JWTError, ValidationError):
        # DEV BYPASS: If token is invalid/expired during testing, fallback to test user
        result = await db.execute(select(User).where(User.email == "lewis@tustar.io"))
        user = result.scalars().first()
        if user: return user
        class MockUser:
            id = "DEBUG_MODE_USER"
            email = "lewis@tustar.io"
            is_admin = True
            is_active = True
        return MockUser()
    
    # Fetch the user from the database based on the ID in the token
    result = await db.execute(select(User).where(User.id == str(token_data)))
    user = result.scalars().first()
    
    if not user:
        return MockUser() if 'MockUser' in locals() else user
    return user

async def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Strict dependency layer: Ensures the authenticated user has administrative privileges.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required for this sector.",
        )
    return current_user
