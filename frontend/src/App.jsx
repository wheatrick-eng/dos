import React, { useEffect, useState } from 'react';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function formatDollar(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function App() {
  const [holdings, setHoldings] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [form, setForm] = useState({
    ticker: '',
    quantity: '',
    cost_basis: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadHoldings() {
    const res = await fetch(`${API_BASE}/holdings`);
    const data = await res.json();
    setHoldings(data);
  }

  async function loadPortfolio() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/portfolio`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to load portfolio');
      }
      const data = await res.json();
      setPortfolio(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHoldings();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const params = new URLSearchParams({
      ticker: form.ticker,
      quantity: String(form.quantity),
      cost_basis: String(form.cost_basis),
    });
    try {
      const res = await fetch(`${API_BASE}/holdings?${params.toString()}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to add holding');
      }
      await loadHoldings();
      setForm({ ticker: '', quantity: '', cost_basis: '' });
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/holdings/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to delete holding');
      }
      await loadHoldings();
      if (portfolio) {
        await loadPortfolio();
      }
    } catch (e) {
      setError(e.message);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1>Portfolio Tracker</h1>
      <p style={{ color: '#555' }}>
        Track your holdings and see live values using free price data.
      </p>

      <section
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: 8,
          border: '1px solid #ddd',
        }}
      >
        <h2>Add holding</h2>
        <form
          onSubmit={handleAdd}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '0.75rem',
            alignItems: 'end',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Ticker</span>
            <input
              name="ticker"
              value={form.ticker}
              onChange={handleChange}
              required
              placeholder="AAPL"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Quantity</span>
            <input
              name="quantity"
              type="number"
              step="0.0001"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Cost basis ($ per share)</span>
            <input
              name="cost_basis"
              type="number"
              step="0.01"
              value={form.cost_basis}
              onChange={handleChange}
              required
            />
          </label>
          <button
            type="submit"
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#2563eb',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Add
          </button>
        </form>
      </section>

      <section
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: 8,
          border: '1px solid #ddd',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2>Holdings</h2>
          <button
            type="button"
            onClick={loadHoldings}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 6,
              border: '1px solid #ddd',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            Refresh list
          </button>
        </div>
        {holdings.length === 0 ? (
          <p style={{ color: '#666' }}>No holdings yet.</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '0.75rem',
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Ticker</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Cost basis</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.id}>
                  <td>{h.ticker}</td>
                  <td style={{ textAlign: 'right' }}>{h.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatDollar(h.cost_basis)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(h.id)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 4,
                        border: 'none',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: 8,
          border: '1px solid #ddd',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2>Portfolio snapshot</h2>
          <button
            type="button"
            onClick={loadPortfolio}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 6,
              border: '1px solid #ddd',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Loading…' : 'Fetch prices'}
          </button>
        </div>
        {error && (
          <p style={{ color: '#b91c1c', marginTop: '0.5rem' }}>{error}</p>
        )}
        {portfolio && (
          <>
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                marginTop: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <Metric
                label="Total value"
                value={portfolio.total_value}
              />
              <Metric
                label="Total cost"
                value={portfolio.total_cost}
              />
              <Metric
                label="Unrealized P/L"
                value={portfolio.unrealized_pl}
                highlight
              />
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '0.75rem',
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Ticker</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                  <th style={{ textAlign: 'right' }}>Unrealized P/L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.ticker}</td>
                    <td style={{ textAlign: 'right' }}>{p.quantity}</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatDollar(p.price)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatDollar(p.value)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        color:
                          p.unrealized_pl > 0
                            ? '#16a34a'
                            : p.unrealized_pl < 0
                            ? '#dc2626'
                            : 'inherit',
                      }}
                    >
                      {formatDollar(p.unrealized_pl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, highlight = false }) {
  const color =
    highlight && value !== 0
      ? value > 0
        ? '#16a34a'
        : '#dc2626'
      : '#111827';
  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color }}>
        {formatDollar(value)}
      </div>
    </div>
  );
}

