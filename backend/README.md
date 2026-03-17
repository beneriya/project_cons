# ParquetPro Backend

FastAPI backend for the **Parquet Floor Layout & Warehouse Management System** (Паркет Шалны Загвар ба Агуулах Удирдлагын Систем).

Built with **Domain-Driven Design (DDD)**, modern Python stack, and comprehensive tests.

## Tech Stack

- **FastAPI** — async REST API
- **SQLAlchemy 2.0** — async ORM
- **Pydantic v2** — validation & settings
- **SQLite/PostgreSQL** — database (async)
- **JWT + bcrypt** — authentication
- **pytest + httpx** — testing

## DDD Structure

```
app/
├── domain/           # Core business logic
│   ├── entities/     # Material, Transaction, User
│   └── services/     # LayoutCalculator
├── application/      # Use cases
│   └── services/     # MaterialService, TransactionService, etc.
├── infrastructure/   # Data access & external
│   ├── database/     # Models, session
│   ├── repositories/ # MaterialRepo, TransactionRepo
│   └── auth/         # JWT, password hashing
├── api/              # HTTP layer
│   ├── routes/       # FastAPI routers
│   ├── schemas/      # Pydantic schemas
│   └── dependencies.py
└── core/             # Config, shared
```

## Setup

**Requirements:** Python 3.11+

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env       # edit as needed
```

## Run

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Seed database (creates admin user and sample data)
python scripts/seed_db.py
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

## Seed Users

After running `python scripts/seed_db.py`:

| Email | Password | Role |
|-------|----------|------|
| admin@parquet.com | admin123 | admin |
| worker@parquet.com | worker123 | worker |
| buyer@parquet.com | buyer123 | buyer |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | No | Login |
| POST | `/api/v1/auth/register` | No | Register |
| GET | `/api/v1/materials` | Yes | List materials |
| POST | `/api/v1/materials` | Yes | Create material |
| GET | `/api/v1/materials/{id}` | Yes | Get material |
| PATCH | `/api/v1/materials/{id}` | Yes | Update material |
| DELETE | `/api/v1/materials/{id}` | Yes | Delete material |
| GET | `/api/v1/transactions` | Yes | List transactions |
| POST | `/api/v1/transactions` | Yes | Add transaction |
| GET | `/api/v1/dashboard` | Yes | Dashboard stats |
| POST | `/api/v1/layout/calculate` | Yes | Layout material calc |

**Auth:** `Authorization: Bearer <token>`

## Tests

```bash
pytest tests/ -v
pytest tests/ --cov=app
```

## Connect Frontend

Set API base URL in your frontend (e.g. `http://localhost:8000/api/v1`). The API returns snake_case (e.g. `m2_per_box`); map to camelCase in the client if needed.
