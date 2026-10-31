export default function Dashboard({ stats, onNavigate }) {
  if (!stats) {
    return <p className="admin-muted">Loading office…</p>;
  }

  const toCall = stats.to_call ?? stats.pending_calls ?? 0;
  const callDone = stats.call_done ?? stats.by_status?.called ?? 0;
  const interested = stats.interested ?? stats.by_status?.interested ?? 0;
  const notInterested = stats.not_interested ?? stats.by_status?.not_interested ?? 0;
  const listings = stats.total_listings ?? 0;

  return (
    <div className="admin-dashboard">
      <section className="admin-hero-call">
        <div className="admin-hero-call__text">
          <p className="admin-hero-call__label">Waiting for your call</p>
          <p className="admin-hero-call__num">{toCall}</p>
          <p className="admin-muted admin-hero-call__hint">
            {toCall === 0
              ? 'All clear — no pending numbers'
              : `${toCall} customer${toCall === 1 ? '' : 's'} ready`}
          </p>
        </div>
        <button
          type="button"
          className="admin-hero-call__btn"
          onClick={() => onNavigate('leads')}
        >
          Start calling
        </button>
      </section>

      <div className="admin-pipeline" aria-label="Call pipeline">
        {[
          ['To call', toCall, 'new', 'phone'],
          ['Call done', callDone, 'done', 'done'],
          ['Interested', interested, 'yes', null],
          ['Not interested', notInterested, 'no', null],
        ].map(([label, value, tone, icon]) => (
          <button
            key={label}
            type="button"
            className={`admin-pipe admin-pipe--${tone}`}
            onClick={() => onNavigate('leads')}
          >
            <strong>{value}</strong>
            <span className="admin-pipe-label">
              {icon === 'phone' && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" />
                </svg>
              )}
              {icon === 'done' && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8.6-8.6 1.4 1.4-10 10z" />
                </svg>
              )}
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="admin-home-actions">
        <button type="button" className="admin-home-action admin-home-action--lead" onClick={() => onNavigate('leads')}>
          <span className="admin-home-action__title">Call customers</span>
          <span className="admin-home-action__sub">Numbers · WhatsApp · result</span>
        </button>
        <button type="button" className="admin-home-action admin-home-action--add" onClick={() => onNavigate('add')}>
          <span className="admin-home-action__title">Add property</span>
          <span className="admin-home-action__sub">House · Plot · Shop · Killa</span>
        </button>
        <button type="button" className="admin-home-action admin-home-action--list" onClick={() => onNavigate('listings')}>
          <span className="admin-home-action__title">My properties</span>
          <span className="admin-home-action__sub">{listings} live on website</span>
        </button>
      </div>

      <div className="admin-mini-stats">
        <div>
          <span className="admin-mini-stats__label">Today</span>
          <strong>{stats.today_leads ?? 0}</strong>
        </div>
        <div>
          <span className="admin-mini-stats__label">All numbers</span>
          <strong>{stats.total_leads ?? 0}</strong>
        </div>
        <div>
          <span className="admin-mini-stats__label">Lead value</span>
          <strong>₹{(stats.lead_value || 0).toLocaleString('en-IN')}</strong>
        </div>
      </div>
    </div>
  );
}
