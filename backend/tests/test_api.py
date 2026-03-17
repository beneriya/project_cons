"""API integration tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@test.com",
            "name": "New User",
            "password": "secret123",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@test.com"

    r2 = await client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@test.com", "password": "secret123"},
    )
    assert r2.status_code == 200
    assert "access_token" in r2.json()


@pytest.mark.asyncio
async def test_login_invalid(client: AsyncClient):
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@test.com", "password": "wrong"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_materials_require_auth(client: AsyncClient):
    r = await client.get("/api/v1/materials")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_materials_crud(client: AsyncClient, auth_headers: dict):
    # Create
    r = await client.post(
        "/api/v1/materials",
        headers=auth_headers,
        json={
            "name": "Test Parquet",
            "type": "Laminate",
            "m2_per_box": 2.4,
            "pieces_per_box": 12,
            "quantity": 10,
            "price": 24500,
            "min_threshold": 5,
        },
    )
    assert r.status_code == 201
    mat = r.json()
    assert mat["name"] == "Test Parquet"
    mat_id = mat["id"]

    # List
    r2 = await client.get("/api/v1/materials", headers=auth_headers)
    assert r2.status_code == 200
    assert len(r2.json()) >= 1

    # Get one
    r3 = await client.get(f"/api/v1/materials/{mat_id}", headers=auth_headers)
    assert r3.status_code == 200
    assert r3.json()["id"] == mat_id

    # Update
    r4 = await client.patch(
        f"/api/v1/materials/{mat_id}",
        headers=auth_headers,
        json={"quantity": 20},
    )
    assert r4.status_code == 200
    assert r4.json()["quantity"] == 20

    # Delete
    r5 = await client.delete(f"/api/v1/materials/{mat_id}", headers=auth_headers)
    assert r5.status_code == 204


@pytest.mark.asyncio
async def test_transaction_in_out(client: AsyncClient, auth_headers: dict):
    # Create material first
    cr = await client.post(
        "/api/v1/materials",
        headers=auth_headers,
        json={
            "name": "Tx Test Material",
            "type": "Laminate",
            "m2_per_box": 2.4,
            "pieces_per_box": 12,
            "quantity": 50,
            "price": 100,
            "min_threshold": 5,
        },
    )
    mat_id = cr.json()["id"]

    # Add IN transaction
    tr = await client.post(
        "/api/v1/transactions",
        headers=auth_headers,
        json={
            "material_id": mat_id,
            "type": "IN",
            "quantity": 10,
            "notes": "Stock received",
        },
    )
    assert tr.status_code == 201
    assert tr.json()["type"] == "IN"
    assert tr.json()["quantity"] == 10

    # Verify material quantity increased
    mr = await client.get(f"/api/v1/materials/{mat_id}", headers=auth_headers)
    assert mr.json()["quantity"] == 60

    # Add OUT transaction
    tr2 = await client.post(
        "/api/v1/transactions",
        headers=auth_headers,
        json={"material_id": mat_id, "type": "OUT", "quantity": 5},
    )
    assert tr2.status_code == 201
    mr2 = await client.get(f"/api/v1/materials/{mat_id}", headers=auth_headers)
    assert mr2.json()["quantity"] == 55


@pytest.mark.asyncio
async def test_transaction_insufficient_stock(client: AsyncClient, auth_headers: dict):
    cr = await client.post(
        "/api/v1/materials",
        headers=auth_headers,
        json={
            "name": "Low Stock",
            "type": "Laminate",
            "m2_per_box": 2.4,
            "pieces_per_box": 12,
            "quantity": 5,
            "price": 100,
            "min_threshold": 5,
        },
    )
    mat_id = cr.json()["id"]

    tr = await client.post(
        "/api/v1/transactions",
        headers=auth_headers,
        json={"material_id": mat_id, "type": "OUT", "quantity": 100},
    )
    assert tr.status_code == 400
    assert "Insufficient stock" in tr.json()["detail"]


@pytest.mark.asyncio
async def test_layout_calculate(client: AsyncClient, auth_headers: dict):
    cr = await client.post(
        "/api/v1/materials",
        headers=auth_headers,
        json={
            "name": "Layout Material",
            "type": "Laminate",
            "m2_per_box": 2.0,
            "pieces_per_box": 10,
            "quantity": 100,
            "price": 100,
            "min_threshold": 5,
        },
    )
    mat_id = cr.json()["id"]

    r = await client.post(
        "/api/v1/layout/calculate",
        headers=auth_headers,
        json={
            "width_m": 5,
            "height_m": 4,
            "material_id": mat_id,
            "waste_percentage": 10,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total_area_m2"] == 20
    assert data["boxes_needed"] == 11
    assert data["tiles_needed"] == 110
    assert data["total_cost"] == 1100


@pytest.mark.asyncio
async def test_dashboard(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/v1/dashboard", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "total_materials" in data
    assert "in_stock" in data
    assert "low_stock" in data
    assert "transactions_this_month" in data
    assert "recent_transactions" in data
