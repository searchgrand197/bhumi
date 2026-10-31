import { useEffect, useState } from 'react';
import { createAdminProperty, fetchLocalities } from '../api';

const TYPES = [
  { id: 'house', label: 'House' },
  { id: 'plot', label: 'Plot' },
  { id: 'rent', label: 'Rent' },
  { id: 'shop', label: 'Shop' },
  { id: 'killa', label: 'Killa' },
];

const EMPTY = {
  title: '',
  type: 'house',
  price: '',
  locality: '',
  area: '',
  dimensions: '',
  facing: '',
  negotiable: true,
  corner: false,
  submersible: false,
  images: '',
};

export default function AddProperty({ onDone }) {
  const [form, setForm] = useState(EMPTY);
  const [localities, setLocalities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    fetchLocalities()
      .then((data) => setLocalities(Array.isArray(data) ? data : []))
      .catch(() => setLocalities([]));
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOk('');
    try {
      const images = String(form.images || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        title: form.title.trim(),
        type: form.type,
        price: Number(form.price),
        locality: form.locality.trim(),
        area: form.type === 'killa' ? form.area.trim() || '1 killa' : form.area.trim(),
        dimensions: form.type === 'killa' ? '' : form.dimensions.trim(),
        facing: form.facing.trim(),
        negotiable: form.negotiable,
        corner: form.corner,
        submersible: form.type === 'killa' ? form.submersible : false,
        nearby: false,
        registry: true,
        intKaal: false,
        images,
      };
      if (!payload.title || !payload.locality || !payload.price) {
        throw new Error('Please fill name, area and price');
      }
      const created = await createAdminProperty(payload);
      setOk(`Saved: ${created.title}`);
      setForm({ ...EMPTY, type: form.type });
      onDone?.(created);
    } catch (err) {
      setError(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <h2 className="admin-page-title">Add property</h2>
      <p className="admin-muted admin-page-sub">Only main details needed</p>

      <p className="admin-field-label">Type</p>
      <div className="admin-type-row">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={form.type === t.id ? 'admin-type active' : 'admin-type'}
            onClick={() => setField('type', t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label>
        Property name
        <input
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Example: Corner plot Sector 7"
          required
        />
      </label>

      <label>
        Price (Rs.)
        <input
          type="number"
          min={0}
          value={form.price}
          onChange={(e) => setField('price', e.target.value)}
          placeholder={form.type === 'plot' ? '10000' : '2500000'}
          required
        />
      </label>

      <label>
        Area / Colony
        <input
          list="admin-localities"
          value={form.locality}
          onChange={(e) => setField('locality', e.target.value)}
          placeholder="Urban Estate"
          required
        />
        <datalist id="admin-localities">
          {localities.map((loc) => (
            <option key={loc.id || loc.name} value={loc.name} />
          ))}
        </datalist>
      </label>

      {form.type !== 'killa' ? (
        <label>
          Size
          <input
            value={form.dimensions || form.area}
            onChange={(e) => {
              setField('dimensions', e.target.value);
              setField('area', e.target.value);
            }}
            placeholder="23x60 feet"
          />
        </label>
      ) : (
        <label>
          Size
          <input value={form.area} onChange={(e) => setField('area', e.target.value)} placeholder="1 killa" />
        </label>
      )}

      <label>
        Facing
        <select value={form.facing} onChange={(e) => setField('facing', e.target.value)}>
          <option value="">Not sure</option>
          <option value="East">East</option>
          <option value="West">West</option>
          <option value="North">North</option>
          <option value="South">South</option>
        </select>
      </label>

      <label>
        Photo link (optional)
        <input
          value={form.images}
          onChange={(e) => setField('images', e.target.value)}
          placeholder="Paste photo URL"
        />
      </label>

      <div className="admin-checks">
        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.negotiable}
            onChange={(e) => setField('negotiable', e.target.checked)}
          />
          Price negotiable
        </label>
        <label className="admin-check">
          <input type="checkbox" checked={form.corner} onChange={(e) => setField('corner', e.target.checked)} />
          Corner
        </label>
        {form.type === 'killa' && (
          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.submersible}
              onChange={(e) => setField('submersible', e.target.checked)}
            />
            Submersible
          </label>
        )}
      </div>

      {error && <p className="admin-error">{error}</p>}
      {ok && <p className="admin-success">{ok}</p>}

      <button type="submit" className="admin-primary-btn admin-primary-btn--big" disabled={saving}>
        {saving ? 'Saving…' : 'Save property'}
      </button>
    </form>
  );
}
