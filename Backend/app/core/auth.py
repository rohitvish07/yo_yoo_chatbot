# app/core/auth.py

import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException

from app.core.config import CLERK_JWKS_URL

_jwks_client = PyJWKClient(CLERK_JWKS_URL)


async def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    """
    FastAPI dependency. Verifies the Clerk-issued token sent in the
    Authorization header and returns the verified Clerk user id.
    Raises 401 if the token is missing, invalid, or expired.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            leeway=10,                       # tolerate small clock differences
            options={"verify_aud": False},   # Clerk session tokens have no aud claim
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token has no user id")

    return user_id