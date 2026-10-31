import { useEffect, useRef, useState } from 'react';
import Filters from './components/Filters';
import PropertyCard from './components/PropertyCard';
import PhoneModal from './components/PhoneModal';
import { fetchLocalities, fetchProperties } from './api';
import { CITY, CONTACT_WHATSAPP, buildExactAreaLabel } from './data/geo';
import './App.css';

const CATEGORIES = [
  { id: 'house', label: 'House', image: '/categories/house.png' },
  { id: 'plot', label: 'Plot', image: '/categories/plot.png' },
  { id: 'rent', label: 'Rent', image: '/categories/rent.png' },
  { id: 'shop', label: 'Shop/Showroom', image: '/categories/shop.png' },
  { id: 'killa', label: 'Killa/Field', image: '/categories/killa.png' },
];

function CategoryLabel({ label }) {
  if (!label.includes('/')) {
    return <span className="cat-label">{label}</span>;
  }
  const [top, bottom] = label.split('/');
  return (
    <span className="cat-label cat-label--stacked" title={label}>
      <span>{top}/</span>
      <span>{bottom}</span>
    </span>
  );
}

const CATEGORY_TITLES = {
  house: 'Houses',
  plot: 'Plots',
  rent: 'Rentals',
  shop: 'Shops & Showrooms',
  killa: 'Killa & Fields',
};

const DEFAULT_FILTERS = {
  query: '',
  minPrice: '',
  maxPrice: '',
  nearby: false,
  localities: [],
};

function countActiveFilters(filters) {
  let n = 0;
  if (filters.minPrice !== '') n += 1;
  if (filters.maxPrice !== '') n += 1;
  if (filters.nearby) n += 1;
  n += filters.localities.length;
  return n;
}

export default function App() {
  const [category, setCategory] = useState('house');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [chatToast, setChatToast] = useState('');
  const [chromeHidden, setChromeHidden] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [nearbyStatus, setNearbyStatus] = useState('idle');
  const [localities, setLocalities] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortPrice, setSortPrice] = useState('low');
  const [sortWave, setSortWave] = useState(false);
  const sortReady = useRef(false);

  useEffect(() => {
    if (!sortReady.current) {
      sortReady.current = true;
      return undefined;
    }
    setSortWave(true);
    const timer = setTimeout(() => setSortWave(false), 780);
    return () => clearTimeout(timer);
  }, [sortPrice]);

  useEffect(() => {
    if (localStorage.getItem('bhumi_phone_collected')) return undefined;
    const timer = setTimeout(() => setShowPhone(true), 7000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (!filters.nearby && nearbyStatus !== 'idle' && nearbyStatus !== 'locating') {
      setNearbyStatus('idle');
    }
  }, [filters.nearby, nearbyStatus]);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const goingDown = y > lastY;
        setChromeHidden(goingDown && y > 48);
        lastY = y;
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetchLocalities()
      .then(setLocalities)
      .catch(() => setLocalities([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const params = {
      type: category,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      nearby: filters.nearby,
      lat: filters.nearby && userLocation ? userLocation.lat : undefined,
      lng: filters.nearby && userLocation ? userLocation.lng : undefined,
    };

    fetchProperties(params)
      .then((data) => {
        if (cancelled) return;
        let rows = Array.isArray(data) ? data : [];
        const q = filters.query.trim().toLowerCase();
        if (q) {
          rows = rows.filter(
            (p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
          );
        }
        setListings(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load properties');
        setListings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, filters.minPrice, filters.maxPrice, filters.nearby, filters.query, userLocation]);

  const visibleListings = (() => {
    const base =
      filters.localities.length === 0
        ? listings
        : listings.filter((p) => filters.localities.includes(p.locality));
    return [...base].sort((a, b) =>
      sortPrice === 'high' ? b.price - a.price : a.price - b.price
    );
  })();

  const activeFilterCount = countActiveFilters(filters);

  async function resolveLocationLabel(lat, lng) {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const parts = [];
        const push = (v) => {
          const s = String(v || '').trim();
          if (!s) return;
          if (parts.some((p) => p.toLowerCase() === s.toLowerCase())) return;
          parts.push(s);
        };
        const informative = data.localityInfo?.informative || [];
        const admin = data.localityInfo?.administrative || [];
        const colonyLike = [...informative, ...admin].find((item) =>
          /colony|sector|nagar|estate|mohalla|enclave|society|layout|village|ward/i.test(
            item?.name || ''
          )
        );
        push(colonyLike?.name);
        push(data.locality);
        push(data.city);
        push(data.principalSubdivision);
        if (parts.length) {
          setLocationLabel(parts.slice(0, 3).join(', '));
          return;
        }
      }
    } catch {
      // continue
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error('reverse failed');
      const data = await res.json();
      const label = buildExactAreaLabel(data.address || {}, data.display_name || '');
      if (label) {
        setLocationLabel(label);
        return;
      }
    } catch {
      // fall through
    }

    setLocationLabel(`Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`);
  }

  function requestNearbyLocation() {
    if (!navigator.geolocation) {
      setNearbyStatus('fallback');
      setLocationLabel('');
      setFilters((f) => ({ ...f, nearby: true }));
      return;
    }

    setNearbyStatus('locating');
    setLocationLabel('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(next);
        setNearbyStatus('ready');
        setFilters((f) => ({ ...f, nearby: true }));
        resolveLocationLabel(next.lat, next.lng);
      },
      () => {
        setUserLocation(null);
        setLocationLabel('');
        setNearbyStatus('fallback');
        setFilters((f) => ({ ...f, nearby: true }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function handleNearbyToggle() {
    if (filters.nearby) {
      setFilters((f) => ({ ...f, nearby: false }));
      setNearbyStatus('idle');
      setLocationLabel('');
      return;
    }
    requestNearbyLocation();
  }

  function handleChat(property) {
    const message = encodeURIComponent(
      `Hi, I am interested in ${property.title} (${property.id}) in ${property.locality}, ${CITY}.`
    );
    window.open(`${CONTACT_WHATSAPP}?text=${message}`, '_blank', 'noopener,noreferrer');
    setChatToast(`Opening WhatsApp for ${property.id}`);
    setTimeout(() => setChatToast(''), 2500);
  }

  const tickerItems = [
    { icon: 'shield', text: 'Verified Property' },
    { icon: 'docs', text: 'Documents Completed' },
  ];

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden="true" />

      <div className={chromeHidden ? 'site-chrome is-hidden' : 'site-chrome'}>
        <div className="trust-ticker" aria-label="Property trust highlights">
          <div className="trust-ticker-track">
            {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
              <span className="trust-ticker-item" key={`${item.text}-${i}`}>
                <span className={`trust-icon trust-icon--${item.icon}`} aria-hidden="true" />
                {item.text}
              </span>
            ))}
          </div>
        </div>

        <header className="topbar">
          <div className="brand-row">
            <div className="brand">
              <img className="brand-logo" src="/logo.svg" alt="" width="40" height="40" />
              <div className="brand-text">
                <span className="brand-name">Your Logo</span>
                <span className="brand-city">{CITY}, Haryana</span>
              </div>
            </div>
            <div className="topbar-actions">
              <a className="admin-entry" href="#/admin" title="Broker admin">
                Admin
              </a>
              <button
                type="button"
                className={activeFilterCount ? 'filter-toggle has-active' : 'filter-toggle'}
                onClick={() => setFiltersOpen(true)}
                aria-expanded={filtersOpen}
                aria-controls="filters-panel"
              >
                Filter
                {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          <nav className="category-nav" aria-label="Property type">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={category === cat.id ? 'cat-btn active' : 'cat-btn'}
                onClick={() => {
                  setCategory(cat.id);
                  setFilters((f) => ({ ...f, minPrice: '', maxPrice: '' }));
                }}
              >
                <span className="cat-visual" aria-hidden="true">
                  <img src={cat.image} alt="" className="cat-img" />
                </span>
                <CategoryLabel label={cat.label} />
              </button>
            ))}
          </nav>
        </header>
      </div>

      <main className="layout">
        <Filters
          filters={filters}
          onChange={setFilters}
          category={category}
          open={filtersOpen}
          matchCount={visibleListings.length}
          nearbyStatus={nearbyStatus}
          userLocation={userLocation}
          locationLabel={locationLabel}
          localities={localities}
          listings={listings}
          onNearbyToggle={handleNearbyToggle}
          onClose={() => setFiltersOpen(false)}
        />

        <section className="listings" aria-live="polite">
          {filters.nearby && (
            <div className="my-location-banner">
              <span className="my-location-pin" aria-hidden="true" />
              <div>
                <strong>My location</strong>
                <p>
                  {nearbyStatus === 'locating'
                    ? 'Detecting…'
                    : locationLabel ||
                      (userLocation
                        ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`
                        : 'Location unavailable — using nearby-marked listings')}
                </p>
              </div>
            </div>
          )}
          <div className="listings-head">
            <div>
              <h1>{CATEGORY_TITLES[category] || 'Listings'} in {CITY}</h1>
              <p>
                {loading
                  ? 'Loading…'
                  : `${visibleListings.length} matching ${visibleListings.length === 1 ? 'listing' : 'listings'}`}
              </p>
            </div>
            <label className="sort-price">
              <span
                className={`sort-icon ${sortPrice === 'high' ? 'sort-icon--desc' : 'sort-icon--asc'}`}
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
              </span>
              <select
                value={sortPrice}
                onChange={(e) => setSortPrice(e.target.value)}
                aria-label="Sort by price"
              >
                <option value="low">Low to High</option>
                <option value="high">High to Low</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="empty">
              <p>Could not reach backend. Start Django on port 8000.</p>
              <p className="phone-error">{error}</p>
            </div>
          )}

          {!error && !loading && visibleListings.length === 0 ? (
            <div className="empty">
              <p>No properties match these filters.</p>
              <button
                type="button"
                className="btn-clear"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setFiltersOpen(true);
                }}
              >
                Adjust filters
              </button>
            </div>
          ) : (
            <div className={sortWave ? 'listings-grid is-sorting' : 'listings-grid'}>
              {visibleListings.map((property, index) => (
                <div
                  key={`${property.id}-${sortPrice}`}
                  className="listings-grid-item"
                  style={{ '--i': index }}
                >
                  <PropertyCard property={property} onChat={handleChat} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <PhoneModal
        open={showPhone}
        onSubmit={() => setShowPhone(false)}
        onSkip={() => {
          localStorage.setItem('bhumi_phone_collected', 'skip');
          setShowPhone(false);
        }}
      />

      {chatToast && <div className="toast">{chatToast}</div>}
    </div>
  );
}
