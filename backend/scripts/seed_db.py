"""Seed database with initial admin user and sample data."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

from app.infrastructure.database.models import Base, UserModel, MaterialModel, TransactionModel
from app.infrastructure.auth.jwt import hash_password
from app.core.config import get_settings


async def seed():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=True)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Check if admin exists
        from sqlalchemy import select
        result = await session.execute(select(UserModel).where(UserModel.email == "admin@parquet.com"))
        if result.scalar_one_or_none():
            print("Admin user already exists, skipping seed.")
            return

        admin = UserModel(
            email="admin@parquet.com",
            name="Admin",
            hashed_password=hash_password("admin123"),
            role="admin",
        )
        worker = UserModel(
            email="worker@parquet.com",
            name="Worker",
            hashed_password=hash_password("worker123"),
            role="worker",
        )
        buyer = UserModel(
            email="buyer@parquet.com",
            name="Buyer",
            hashed_password=hash_password("buyer123"),
            role="buyer",
        )
        session.add_all([admin, worker, buyer])
        await session.flush()

        # Sample materials
        m1 = MaterialModel(
            name="Parquet 8mm Oak",
            type="Laminate",
            m2_per_box=2.4,
            pieces_per_box=12,
            quantity=4,  # 8 - 4 (OUT) from t2
            price=24500,
            min_threshold=10,
        )
        m2 = MaterialModel(
            name="Oak Parquet Classic",
            type="Solid Wood",
            m2_per_box=2.0,
            pieces_per_box=10,
            quantity=68,  # 48 + 20 (IN) from t1
            price=52000,
            min_threshold=10,
        )
        m3 = MaterialModel(
            name="Walnut Engineered",
            type="Engineered",
            m2_per_box=2.2,
            pieces_per_box=8,
            quantity=20,  # 5 + 15 (IN) from t3
            price=38000,
            min_threshold=8,
        )
        session.add_all([m1, m2, m3])
        await session.flush()

        from datetime import datetime
        t1 = TransactionModel(
            material_id=m2.id,
            material_name=m2.name,
            type="IN",
            quantity=20,
        )
        t2 = TransactionModel(
            material_id=m1.id,
            material_name=m1.name,
            type="OUT",
            quantity=4,
        )
        t3 = TransactionModel(
            material_id=m3.id,
            material_name=m3.name,
            type="IN",
            quantity=15,
        )
        session.add_all([t1, t2, t3])

        await session.commit()
        print("Seed completed: admin@parquet.com / admin123, worker@parquet.com / worker123, buyer@parquet.com / buyer123")


if __name__ == "__main__":
    asyncio.run(seed())
