import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { fetchAdminLeads, updateAdminLead } from '../api';

function cleanPhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function prettyPhone(digits) {
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

const STATUS_OPTIONS = [
  { id: 'called', label: 'Call done', short: 'Call done', tone: 'done' },
  { id: 'interested', label: 'Interested', short: 'Interested', tone: 'yes' },
  { id: 'not_interested', label: 'Not interested', short: 'No', tone: 'no' },
];

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
      />
    </svg>
  );
}

function IconDone() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8.6-8.6 1.4 1.4-10 10z"
      />
    </svg>
  );
}

const FILTERS = [
  { id: 'new', label: 'To call', tone: 'new', Icon: IconPhone },
  { id: 'called', label: 'Call done', tone: 'done', Icon: IconDone },
  { id: 'interested', label: 'Interested', tone: 'yes', Icon: null },
  { id: 'not_interested', label: 'Not interested', tone: 'no', Icon: null },
];

const VANISH_MS = 580;

const STATUS_LABELS = {
  new: 'To call',
  called: 'Call done',
  interested: 'Interested',
  not_interested: 'Not interested',
};

async function loadLogoDataUrl() {
  const res = await fetch('/logo.png');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadNumbersPdf(list) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const stamp = new Date().toLocaleString('en-IN');
  let logoData = null;
  try {
    logoData = await loadLogoDataUrl();
  } catch {
    logoData = null;
  }
  let y = 14;

  function ensureSpace(needed = 10) {
    if (y + needed > pageH - 14) {
      doc.addPage();
      y = 14;
      drawHeader(false);
    }
  }

  function drawHeader(withMeta) {
    if (logoData) {
      doc.addImage(logoData, 'PNG', margin, y - 2, 14, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(10, 77, 86);
      doc.text('Your Logo', margin + 18, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text('All customer numbers', margin + 18, y + 10);
      y += 16;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(10, 77, 86);
      doc.text('Your Logo - All customer numbers', margin, y + 4);
      y += 10;
    }
    if (withMeta) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Jind | Property broker office | ${stamp}`, margin, y);
      y += 5;
      doc.text(`Total: ${list.length}`, margin, y);
      y += 8;
    }
    doc.setFillColor(10, 77, 86);
    doc.rect(margin, y, pageW - margin * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255);
    doc.text('#', margin + 2, y + 5.5);
    doc.text('Phone', margin + 14, y + 5.5);
    doc.text('Status', margin + 52, y + 5.5);
    doc.text('Source', margin + 95, y + 5.5);
    doc.text('Created at', margin + 130, y + 5.5);
    y += 8;
    doc.setTextColor(0);
  }

  drawHeader(true);

  list.forEach((lead, i) => {
    ensureSpace(9);
    if (i % 2 === 0) {
      doc.setFillColor(244, 248, 248);
      doc.rect(margin, y, pageW - margin * 2, 8, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(20);
    doc.text(String(i + 1), margin + 2, y + 5.5);
    doc.text(cleanPhone(lead.phone), margin + 14, y + 5.5);
    doc.text(STATUS_LABELS[lead.status] || lead.status || '-', margin + 52, y + 5.5);
    doc.text(String(lead.source || '-').slice(0, 18), margin + 95, y + 5.5);
    doc.text(
      lead.created_at ? new Date(lead.created_at).toLocaleString('en-IN') : '-',
      margin + 130,
      y + 5.5,
    );
    y += 8;
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`all-numbers-${dateStamp}.pdf`);
}

export default function Leads({ stats, onChanged }) {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('new');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [vanish, setVanish] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [counts, setCounts] = useState({
    new: 0,
    called: 0,
    interested: 0,
    not_interested: 0,
    all: 0,
  });

  useEffect(() => {
    if (!stats) return;
    const by = stats.by_status || {};
    setCounts({
      new: stats.to_call ?? by.new ?? 0,
      called: stats.call_done ?? by.called ?? 0,
      interested: stats.interested ?? by.interested ?? 0,
      not_interested: stats.not_interested ?? by.not_interested ?? 0,
      all: stats.total_leads ?? 0,
    });
  }, [stats]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminLeads(filter ? { status: filter } : {});
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load numbers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function setStatus(id, nextStatus) {
    if (savingId || vanish) return;

    const leave = Boolean(filter) && filter !== nextStatus;
    setSavingId(id);
    setVanish({ id, status: nextStatus, leave });
    setError('');

    const prevStatus = leads.find((l) => l.id === id)?.status || 'new';

    try {
      await updateAdminLead(id, { status: nextStatus });
      setCounts((c) => ({
        ...c,
        [prevStatus]: Math.max(0, (c[prevStatus] || 0) - 1),
        [nextStatus]: (c[nextStatus] || 0) + 1,
      }));
      onChanged?.();
      await new Promise((r) => setTimeout(r, leave ? VANISH_MS : 360));

      if (leave) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      } else {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: nextStatus } : l)),
        );
      }
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSavingId(null);
      setVanish(null);
    }
  }

  const remaining = filter === 'new' ? counts.new : leads.length;

  async function downloadAllNumbers() {
    if (downloading) return;
    setDownloading(true);
    setError('');
    try {
      const data = await fetchAdminLeads({});
      const list = Array.isArray(data) ? data : [];
      if (!list.length) {
        setError('No numbers to download');
        return;
      }
      await downloadNumbersPdf(list);
    } catch (err) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="admin-leads">
      <header className="admin-leads-head">
        <div>
          <h2 className="admin-page-title">Call desk</h2>
          <p className="admin-muted admin-page-sub">
            {filter === 'new'
              ? remaining
                ? `${remaining} left to call`
                : 'Queue clear'
              : 'Tap Call, then mark result'}
          </p>
        </div>
        <div className="admin-leads-head-actions">
          <button
            type="button"
            className="admin-download-btn"
            onClick={downloadAllNumbers}
            disabled={downloading || !(counts.all > 0 || counts.new + counts.called + counts.interested + counts.not_interested > 0)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 3v10.2l3.4-3.4 1.4 1.4-5.8 5.8-5.8-5.8 1.4-1.4 3.4 3.4V3h2zm-7 16h14v2H5v-2z"
              />
            </svg>
            {downloading ? 'Downloading…' : 'Download PDF'}
          </button>
          {filter === 'new' && counts.new > 0 && (
            <div className="admin-leads-progress" aria-hidden="true">
              <span>{counts.new}</span>
            </div>
          )}
        </div>
      </header>

      <div className="admin-filter-sticky">
        <div className="admin-filter-row" role="group" aria-label="Show">
          {FILTERS.map(({ id, label, tone, Icon }) => (
            <button
              key={id}
              type="button"
              className={`admin-filter admin-filter--${tone}${filter === id ? ' active' : ''}`}
              onClick={() => setFilter(id)}
            >
              <span className="admin-filter-count">{counts[id] ?? 0}</span>
              <span className="admin-filter-label">
                {Icon ? <Icon /> : null}
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading ? (
        <p className="admin-muted">Loading numbers…</p>
      ) : leads.length === 0 ? (
        <p className="admin-empty">
          {filter === 'new' ? 'Nice — nobody left to call.' : 'No numbers in this list.'}
        </p>
      ) : (
        <ul className="admin-lead-cards">
          {leads.map((lead, index) => {
            const digits = cleanPhone(lead.phone);
            const busy = savingId === lead.id;
            const isVanishing = vanish?.id === lead.id;
            const leave = isVanishing && vanish.leave;
            return (
              <li
                key={lead.id}
                className={
                  isVanishing
                    ? leave
                      ? 'admin-lead-card admin-lead-card--vanish'
                      : 'admin-lead-card admin-lead-card--spark'
                    : 'admin-lead-card'
                }
              >
                {isVanishing && (
                  <span className="admin-magic" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                )}

                <div className="admin-lead-top">
                  <div className="admin-lead-phone-wrap">
                    <span className="admin-lead-index">#{index + 1}</span>
                    <strong className="admin-phone">{prettyPhone(digits)}</strong>
                  </div>
                  <p className="admin-muted admin-lead-time">
                    {new Date(lead.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="admin-lead-actions-row">
                  <a className="admin-call-btn" href={`tel:+91${digits}`} aria-label="Call">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
                      />
                    </svg>
                    Call
                  </a>
                  <a
                    className="admin-wa-btn"
                    href={`https://wa.me/91${digits}?text=${encodeURIComponent('Namaste, property ke baare mein baat karni thi (Jind).')}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.96.57 3.8 1.56 5.35L2 22l4.97-1.64a9.86 9.86 0 0 0 5.07 1.37h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2zm5.76 14.08c-.24.68-1.4 1.25-1.94 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.17-1.56-1.17-2.97 0-1.42.74-2.11 1-2.4.26-.28.57-.35.76-.35h.55c.17 0 .4-.07.63.48.24.56.8 1.94.87 2.08.07.14.12.3.02.49-.1.19-.14.3-.28.47-.14.16-.3.36-.42.49-.14.14-.28.29-.12.56.16.28.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.28.36-.23.61-.14.24.09 1.55.73 1.81.86.27.14.44.2.51.31.07.11.07.64-.17 1.32z"
                      />
                    </svg>
                    WhatsApp
                  </a>
                </div>

                <div className="admin-status-row" role="group" aria-label="Call result">
                  {STATUS_OPTIONS.map((opt) => {
                    const checked =
                      isVanishing && vanish.status === opt.id
                        ? true
                        : lead.status === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`admin-status-btn admin-status-btn--${opt.tone}${checked ? ' is-on' : ''}`}
                        disabled={busy || !!vanish}
                        onClick={() => {
                          if (lead.status === opt.id) return;
                          setStatus(lead.id, opt.id);
                        }}
                      >
                        {opt.id === 'called' ? <IconDone /> : null}
                        {opt.short}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
