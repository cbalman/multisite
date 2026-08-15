from fastapi import APIRouter

from app.api import admin, auth, health, public_sites, sites

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(public_sites.router, prefix="/public", tags=["public"])
api_router.include_router(sites.router, prefix="/me", tags=["me"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
