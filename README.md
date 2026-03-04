# Portfolio Tracker (Render-ready)

Simple financial portfolio tracker with:
- FastAPI backend (Python) + Postgres
- React SPA frontend (Vite)
- Live prices from Alpha Vantage (free tier)

## Local development

### Backend

From the `backend` folder:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # on Windows
pip install -r requirements.txt

set DATABASE_URL=sqlite:///./portfolio.db
set ALPHAVANTAGE_API_KEY=YOUR_KEY_HERE

uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`.

### Frontend

From the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and calls:

- `VITE_API_BASE_URL` env var if set
- otherwise `http://localhost:8000`

## Deployment on Render

1. Commit this repo and push it to GitHub (or GitLab/Bitbucket).
2. In Render, click **Blueprints → New Blueprint** and point it at the repo.
3. Render will detect `render.yaml` and create:
   - `portfolio-backend` web service (FastAPI)
   - `portfolio-db` Postgres database
   - `portfolio-frontend` static site (React)
4. After first deploy, go to the **Environment** tab of `portfolio-backend` and set:
   - `ALPHAVANTAGE_API_KEY` to your free API key from Alpha Vantage.
5. Redeploy the blueprint (or manually redeploy services).

Once live:
- Frontend will be available at the `portfolio-frontend` URL.
- It will automatically call the backend using `VITE_API_BASE_URL` sourced from `portfolio-backend`'s host.

