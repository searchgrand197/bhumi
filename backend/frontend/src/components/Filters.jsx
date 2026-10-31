import { useMemo } from 'react';
import { formatPrice, getLocalitiesNearToFar } from '../data/geo';

export default function Filters({
  filters,
  onChange,
  category,
  open,
  onClose,
  matchCount = 0,
  nearbyStatus = 'idle',
  userLocation = null,
  locationLabel = '',
  localities = [],
  listings = [],
  onNearbyToggle,
}) {
  const isRent = category === 'rent';
  const isPlot = category === 'plot';
  const isKilla = category === 'killa';
  const maxHint =
    category === 'rent' ? 30000 :
    category === 'plot' ? 60000 :
    category === 'killa' ? 14000000 :
    category === 'shop' ? 10000000 :
    7000000;
  const priceStep = isRent || isPlot ? 1000 : isKilla ? 500000 : 100000;
  const maxValue = Number(filters.maxPrice) || maxHint;
  const priceUnit =
    isRent ? '(monthly)' :
    isPlot ? '(per gaj)' :
    '';

  const localityCounts = useMemo(() => {
    const counts = Object.fromEntries(localities.map((loc) => [loc.name, 0]));
    for (const p of listings) {
      if (counts[p.locality] !== undefined) counts[p.locality] += 1;
    }
    return counts;
  }, [localities, listings]);

  const localitiesOrdered = useMemo(
    () => getLocalitiesNearToFar(localities, userLocation),
    [localities, userLocation]
  );

  if (!open) return null;

  const nearbyHint =
    nearbyStatus === 'locating'
      ? 'Detecting your location…'
      : nearbyStatus === 'ready'
        ? 'Showing properties within ~4 km'
        : nearbyStatus === 'fallback'
          ? 'Location blocked — showing nearby-marked listings'
          : '';

  return (
    <div className="filters-overlay" role="presentation" onClick={onClose}>
      <aside
        className="filters"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="filters-head">
          <div className="filters-title-row">
            <h2 id="filters-title">Filter</h2>
            <button type="button" className="filters-close" onClick={onClose} aria-label="Close filters">
              ×
            </button>
          </div>
        </header>

        <div className="filters-body">
          <section className="filter-block filter-block--first">
            <div className="filter-heading-row">
              <h3>Price {priceUnit}</h3>
              <span
                className={
                  matchCount === 0
                    ? 'price-match-count price-match-count--empty'
                    : 'price-match-count'
                }
                aria-live="polite"
              >
                {matchCount} found
              </span>
            </div>
            <div className="price-inputs">
              <label>
                Min
                <input
                  type="number"
                  min={0}
                  step={priceStep}
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
                />
              </label>
              <label>
                Max
                <input
                  type="number"
                  min={0}
                  step={priceStep}
                  placeholder={String(maxHint)}
                  value={filters.maxPrice}
                  onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
                />
              </label>
            </div>
            <input
              type="range"
              className={matchCount === 0 ? 'price-range price-range--empty' : 'price-range'}
              min={0}
              max={maxHint}
              step={priceStep}
              value={maxValue}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            />
            <p className="price-slider-meta">Up to {formatPrice(maxValue, category)}</p>
          </section>

          <section className="filter-block filter-block--location">
            <div className="filter-heading-row">
              <h3>Location</h3>
              <button
                type="button"
                className={filters.nearby ? 'chip active' : 'chip'}
                onClick={onNearbyToggle}
                disabled={nearbyStatus === 'locating'}
              >
                {nearbyStatus === 'locating' ? 'Locating…' : 'Nearby'}
              </button>
            </div>
            {nearbyHint && <p className="nearby-hint">{nearbyHint}</p>}
            {(userLocation || nearbyStatus === 'locating') && (
              <div className="my-location-card">
                <span className="my-location-pin" aria-hidden="true" />
                <div>
                  <strong>My location</strong>
                  <p>
                    {nearbyStatus === 'locating'
                      ? 'Detecting…'
                      : locationLabel ||
                        `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`}
                  </p>
                  {userLocation && nearbyStatus === 'ready' && (
                    <p className="my-location-coords">
                      GPS {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <p className="locality-label">
              Locality {userLocation ? '(near → far)' : ''}
            </p>
            <ul className="locality-list">
              {localitiesOrdered.map(({ name: loc, km }) => {
                const count = localityCounts[loc] || 0;
                return (
                  <li key={loc}>
                    <label className={count === 0 ? 'locality-empty' : undefined}>
                      <input
                        type="checkbox"
                        checked={filters.localities.includes(loc)}
                        onChange={() => {
                          const next = filters.localities.includes(loc)
                            ? filters.localities.filter((l) => l !== loc)
                            : [...filters.localities, loc];
                          onChange({ ...filters, localities: next });
                        }}
                      />
                      <span className="locality-name">
                        {loc}
                        {typeof km === 'number' && Number.isFinite(km) && (
                          <span className="locality-distance">
                            {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
                          </span>
                        )}
                      </span>
                      <span className="locality-count">{count}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="filters-actions">
          <button
            type="button"
            className="btn-clear"
            onClick={() =>
              onChange({
                ...filters,
                query: '',
                minPrice: '',
                maxPrice: '',
                nearby: false,
                localities: [],
              })
            }
          >
            Clear
          </button>
          <button type="button" className="btn-primary filters-apply" onClick={onClose}>
            Show {matchCount}
          </button>
        </div>
      </aside>
    </div>
  );
}
