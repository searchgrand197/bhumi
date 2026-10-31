# Bhumi — Jind Real Estate

React (Vite) frontend + Django REST backend for plots, houses, and rentals in Jind, Haryana.

## Structure

```
frontend/   Vite + React app
backend/    Django + DRF API (SQLite)
```

## Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py makemigrations listings
python manage.py migrate
python manage.py seed_listings
python manage.py runserver
```

API base: `http://127.0.0.1:8000/api/`

- `GET /api/properties/` — filters: `type`, `min_price`, `max_price`, `nearby`, `locality`, `lat`, `lng`
- `GET /api/localities/`
- `POST /api/leads/` — `{ "phone": "9876543210", "source": "popup" }`
- `GET /api/meta/`

Admin: `http://127.0.0.1:8000/admin/` (create a user with `python manage.py createsuperuser`).

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://127.0.0.1:5173`

Optional: set `VITE_API_URL` (defaults to `http://127.0.0.1:8000/api`).
