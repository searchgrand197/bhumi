import { useEffect, useState } from 'react';
import { fetchAdminProperties } from '../api';
import { formatPrice } from '../data/geo';

export default function Listings({ onAdd }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminProperties()
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="admin-listings">
      <div className="admin-toolbar">
        <div>
          <h2 className="admin-page-title">My properties</h2>
          <p className="admin-muted admin-page-sub">On the website</p>
        </div>
        <button type="button" className="admin-primary-btn" onClick={onAdd}>
          Add new
        </button>
      </div>
      {error && <p className="admin-error">{error}</p>}
      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="admin-empty">No property yet. Tap Add new.</p>
      ) : (
        <ul className="admin-listing-rows">
          {rows.map((p) => (
            <li key={p.id}>
              <div>
                <strong>{p.title}</strong>
                <p className="admin-muted">
                  {p.type} · {p.locality}
                </p>
              </div>
              <span className="admin-price">{formatPrice(p.price, p.type)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
