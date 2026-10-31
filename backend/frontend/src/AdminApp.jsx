import { useEffect, useState } from 'react';
import Dashboard from './admin/Dashboard';
import Leads from './admin/Leads';
import AddProperty from './admin/AddProperty';
import Listings from './admin/Listings';
import { fetchAdminStats } from './api';
import './admin.css';

function parseAdminHash() {
  const raw = (window.location.hash || '#/admin').replace(/^#/, '') || '/admin';
  const path = raw.split('?')[0];
  if (path.startsWith('/admin/leads')) return 'leads';
  if (path.startsWith('/admin/add')) return 'add';
  if (path.startsWith('/admin/listings')) return 'listings';
  return 'home';
}

export default function AdminApp() {
  const [view, setView] = useState(parseAdminHash);
  const [stats, setStats] = useState(null);
  const [showBrokerNote, setShowBrokerNote] = useState(true);

  useEffect(() => {
    function onHash() {
      setView(parseAdminHash());
    }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  async function refreshStats() {
    try {
      setStats(await fetchAdminStats());
    } catch {
      setStats(null);
    }
  }

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    if (view === 'leads' || view === 'home') refreshStats();
  }, [view]);

  function navigate(section) {
    const map = {
      home: '#/admin',
      leads: '#/admin/leads',
      add: '#/admin/add',
      listings: '#/admin/listings',
    };
    window.location.hash = map[section] || '#/admin';
    setView(section);
  }

  const pending = stats?.to_call ?? stats?.pending_calls ?? 0;

  return (
    <div className="admin-shell">
      {showBrokerNote && (
        <div className="admin-broker-gate" role="dialog" aria-modal="true" aria-labelledby="admin-broker-note-title">
          <div className="admin-broker-card">
            <img className="admin-broker-logo" src="/logo.svg" alt="" width="48" height="48" />
            <p className="admin-brand-name">Your Logo</p>
            <h2 id="admin-broker-note-title">Admin Portal</h2>
            <p className="admin-broker-note">
              <strong>Note:</strong> This Admin Portal will be visible to property broker only
            </p>
            <button
              type="button"
              className="admin-broker-continue"
              onClick={() => setShowBrokerNote(false)}
            >
              Continue to office
            </button>
          </div>
        </div>
      )}

      <header className="admin-top">
        <div className="admin-brand">
          <img className="admin-brand-logo" src="/logo.svg" alt="" width="36" height="36" />
          <div>
            <p className="admin-brand-name">Your Logo</p>
            <h1>My office</h1>
          </div>
        </div>
        <a className="admin-back" href="#/">
          Website
        </a>
      </header>

      <nav className="admin-nav" aria-label="Main">
        {[
          ['home', 'Home', null],
          ['leads', 'Call desk', pending],
          ['add', 'Add', null],
        ].map(([id, label, badge]) => (
          <button
            key={id}
            type="button"
            className={view === id || (id === 'home' && view === 'listings') ? 'active' : undefined}
            onClick={() => navigate(id)}
          >
            {label}
            {badge > 0 ? <span className="admin-nav-badge">{badge}</span> : null}
          </button>
        ))}
      </nav>

      <main className="admin-main">
        {view === 'home' && <Dashboard stats={stats} onNavigate={navigate} />}
        {view === 'leads' && <Leads stats={stats} onChanged={refreshStats} />}
        {view === 'add' && (
          <AddProperty
            onDone={() => {
              refreshStats();
              navigate('listings');
            }}
          />
        )}
        {view === 'listings' && <Listings onAdd={() => navigate('add')} />}
      </main>
    </div>
  );
}
