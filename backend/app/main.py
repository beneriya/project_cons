"""ParquetPro API - FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.infrastructure.database.session import init_db
from app.api.routes import auth, dashboard, layout, materials, reports, transactions

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    # shutdown if needed


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(materials.router, prefix=settings.api_prefix)
app.include_router(transactions.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(layout.router, prefix=settings.api_prefix)
app.include_router(reports.router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    return {"status": "ok"}
