"""SQLAlchemy ORM models - infrastructure persistence."""

import uuid
from datetime import datetime

from sqlalchemy import Float, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.sqlite import CHAR
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def uuid_str() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


class UserModel(Base):
    """User persistence model."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=uuid_str)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="buyer", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MaterialModel(Base):
    """Material persistence model."""

    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=uuid_str)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    m2_per_box: Mapped[float] = mapped_column(Float, nullable=False)
    pieces_per_box: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    min_threshold: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions: Mapped[list["TransactionModel"]] = relationship(
        "TransactionModel", back_populates="material", foreign_keys="TransactionModel.material_id"
    )


class TransactionModel(Base):
    """Transaction persistence model."""

    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=uuid_str)
    material_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("materials.id"), nullable=False, index=True)
    material_name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False)  # IN | OUT
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    material: Mapped["MaterialModel"] = relationship("MaterialModel", back_populates="transactions")
