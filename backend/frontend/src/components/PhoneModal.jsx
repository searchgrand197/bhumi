import { useState } from 'react';
import { createLead } from '../api';

export default function PhoneModal({ open, onSubmit, onSkip }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createLead({ phone: cleaned, source: 'popup' });
      const saved = JSON.parse(localStorage.getItem('bhumi_leads') || '[]');
      saved.push({ phone: cleaned, at: new Date().toISOString() });
      localStorage.setItem('bhumi_leads', JSON.stringify(saved));
      localStorage.setItem('bhumi_phone_collected', '1');
      setDone(true);
      setTimeout(() => onSubmit(cleaned), 900);
    } catch {
      setError('Could not save. Check that the backend is running.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="phone-title">
      <div className="modal-card">
        {done ? (
          <div className="modal-success">
            <div className="modal-check" aria-hidden="true">✓</div>
            <h2>Thanks — we got your number</h2>
            <p>Our advisor will reach out with matching listings.</p>
          </div>
        ) : (
          <>
            <p className="modal-eyebrow">Stay in the loop</p>
            <h2 id="phone-title">Get property alerts on WhatsApp</h2>
            <p className="modal-copy">
              Drop your number and we will send verified plots, houses, and rentals that match your filters.
            </p>
            <form onSubmit={handleSubmit} className="phone-form">
              <label htmlFor="phone">Mobile number</label>
              <div className="phone-input-row">
                <span className="phone-prefix">+91</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  autoFocus
                />
              </div>
              {error && <p className="phone-error">{error}</p>}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Continue'}
              </button>
              <button type="button" className="btn-ghost" onClick={onSkip}>
                Maybe later
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
