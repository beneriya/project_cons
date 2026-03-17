# ParquetPro — Parquet Floor & Warehouse Management System

Паркет шалны загвар ба агуулах удирдлагын систем. Floor planning, material calculation, inventory, and transactions in one place.

## Quick Start

```bash
# 1. Install dependencies
bun run setup

# 2. Create backend venv & install (if not done)
cd backend && python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt

# 3. Seed database
bun run seed

# 4. Run everything (backend + frontend)
bun run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## Login

| Role   | Email              | Password  |
| ------ | ------------------ | --------- |
| Admin  | admin@parquet.com  | admin123  |
| Worker | worker@parquet.com | worker123 |
| Buyer  | buyer@parquet.com  | buyer123  |

## Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `bun run dev`   | Start backend + frontend     |
| `bun run seed`  | Seed database with demo data |
| `bun run setup` | Install all dependencies     |
