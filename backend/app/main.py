from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from dotenv import load_dotenv
import os
import httpx
from typing import List

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./portfolio.db")
ALPHAVANTAGE_API_KEY = os.getenv("ALPHAVANTAGE_API_KEY", "")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    quantity = Column(Float)
    cost_basis = Column(Float)


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Portfolio Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def fetch_price(ticker: str) -> float:
    """
    Fetch latest price for a ticker using Alpha Vantage.
    Requires ALPHAVANTAGE_API_KEY env var to be set.
    """
    if not ALPHAVANTAGE_API_KEY:
        raise HTTPException(status_code=500, detail="Price API key not configured")

    url = "https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": ticker,
        "apikey": ALPHAVANTAGE_API_KEY,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
    try:
        price_str = data["Global Quote"]["05. price"]
        return float(price_str)
    except Exception:
        raise HTTPException(status_code=502, detail=f"Could not fetch price for {ticker}")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/holdings")
def list_holdings(db: Session = Depends(get_db)):
    rows = db.query(Holding).all()
    return [
        {
            "id": h.id,
            "ticker": h.ticker,
            "quantity": h.quantity,
            "cost_basis": h.cost_basis,
        }
        for h in rows
    ]


@app.post("/holdings")
def add_holding(
    ticker: str,
    quantity: float,
    cost_basis: float,
    db: Session = Depends(get_db),
):
    ticker = ticker.upper()
    holding = Holding(ticker=ticker, quantity=quantity, cost_basis=cost_basis)
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return {
        "id": holding.id,
        "ticker": holding.ticker,
        "quantity": holding.quantity,
        "cost_basis": holding.cost_basis,
    }


@app.delete("/holdings/{holding_id}")
def delete_holding(holding_id: int, db: Session = Depends(get_db)):
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(holding)
    db.commit()
    return {"ok": True}


@app.get("/portfolio")
async def portfolio(db: Session = Depends(get_db)):
    holdings = db.query(Holding).all()
    total_value = 0.0
    total_cost = 0.0
    positions = []

    for h in holdings:
        price = await fetch_price(h.ticker)
        value = price * h.quantity
        cost = h.cost_basis * h.quantity
        total_value += value
        total_cost += cost
        positions.append(
            {
                "id": h.id,
                "ticker": h.ticker,
                "quantity": h.quantity,
                "cost_basis": h.cost_basis,
                "price": price,
                "value": value,
                "unrealized_pl": value - cost,
            }
        )

    return {
        "total_value": total_value,
        "total_cost": total_cost,
        "unrealized_pl": total_value - total_cost,
        "positions": positions,
    }

