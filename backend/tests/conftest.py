"""Pytest fixtures for async tests."""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models import Base
from app.infrastructure.auth.jwt import hash_password
from app.infrastructure.database.models import UserModel, MaterialModel, TransactionModel


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def db_session():
    """In-memory SQLite session for tests."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session


@pytest.fixture
async def client(db_session):
    """Override get_db with test session."""

    async def override_get_db():
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def seeded_session(db_session):
    """Session with seed data."""
    admin = UserModel(
        email="admin@parquet.com",
        name="Admin",
        hashed_password=hash_password("admin123"),
        role="admin",
    )
    db_session.add(admin)
    await db_session.flush()

    m1 = MaterialModel(
        name="Oak Parquet",
        type="Laminate",
        m2_per_box=2.4,
        pieces_per_box=12,
        quantity=10,
        price=24500,
        min_threshold=5,
    )
    db_session.add(m1)
    await db_session.flush()

    await db_session.commit()
    return db_session


@pytest.fixture
async def auth_headers(client, db_session):
    """Create user and return auth headers."""
    from app.application.services.auth_service import AuthService

    auth_svc = AuthService(db_session)
    user, token = await auth_svc.register(
        email="test@example.com",
        name="Test User",
        password="testpass123",
    )
    await db_session.commit()
    return {"Authorization": f"Bearer {token}"}
