"""Dashboard API schemas."""

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_materials: int
    in_stock: int
    low_stock: int
    transactions_this_month: int
    low_stock_items: list[dict]
    recent_transactions: list[dict]
