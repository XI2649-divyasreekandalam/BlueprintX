from fastapi import APIRouter
from .routes import upload_router, blueprint_router

# API v1 router
api_router = APIRouter(prefix="/api/v1")

# Register routes under /api/v1
api_router.include_router(upload_router, prefix="/upload")
api_router.include_router(blueprint_router)

__all__ = ['api_router']

