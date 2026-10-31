import { useState } from 'react';
import { CITY, formatPrice } from '../data/geo';

function formatFacing(facing) {
  const value = String(facing || '').trim();
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower.endsWith(' facing')) return value.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()} Facing`;
}

export default function PropertyCard({ property, onChat }) {
  const [slide, setSlide] = useState(0);
  const images = property.images || [];
  const facingLabel = formatFacing(property.facing);
  const isPlot = property.type === 'plot';
  const isKilla = property.type === 'killa';
  const showPlotSpecs = isPlot || property.type === 'shop';

  function prev(e) {
    e.stopPropagation();
    setSlide((s) => (s - 1 + images.length) % images.length);
  }

  function next(e) {
    e.stopPropagation();
    setSlide((s) => (s + 1) % images.length);
  }

  return (
    <article className={property.corner ? 'property-card is-corner' : 'property-card'}>
      <div className="carousel">
        {images.length > 0 && (
          <img src={images[slide]} alt={property.title} loading="lazy" />
        )}
        {images.length > 1 && (
          <>
            <button type="button" className="carousel-nav prev" onClick={prev} aria-label="Previous image">
              ‹
            </button>
            <button type="button" className="carousel-nav next" onClick={next} aria-label="Next image">
              ›
            </button>
          </>
        )}
        <div className="carousel-dots">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === slide ? 'dot active' : 'dot'}
              onClick={(e) => {
                e.stopPropagation();
                setSlide(i);
              }}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
        <span className="price-badge">{formatPrice(property.price, property.type)}</span>
        {property.corner && (
          <span className="corner-badge" title={isPlot ? 'Corner plot' : 'Corner'}>
            {isPlot ? 'Corner Plot' : 'Corner'}
          </span>
        )}
        {property.registry && (
          <span className="verified-badge" title="Verified property">
            <img src="/badges/verified.png" alt="" />
            <span>Verified</span>
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="card-meta">
          <h3>{property.title}</h3>
          <p className="card-location">
            {property.locality}, {CITY}
          </p>
          {isKilla ? (
            <p className="card-dimensions">1 killa</p>
          ) : showPlotSpecs ? (
            <>
              {property.dimensions && <p className="card-dimensions">{property.dimensions}</p>}
              <div className="plot-specs">
                {facingLabel && <span className="spec-chip spec-chip--facing">{facingLabel}</span>}
                {property.corner && (
                  <span className="spec-chip spec-chip--corner">
                    {isPlot ? 'Corner Plot' : 'Corner'}
                  </span>
                )}
                {property.area && <span className="spec-chip spec-chip--muted">{property.area}</span>}
              </div>
            </>
          ) : (
            <>
              <p className="card-area">{property.area}</p>
              {(facingLabel || property.corner) && (
                <div className="plot-specs">
                  {facingLabel && <span className="spec-chip spec-chip--facing">{facingLabel}</span>}
                  {property.corner && <span className="spec-chip spec-chip--corner">Corner</span>}
                </div>
              )}
            </>
          )}
        </div>

        <div
          className={property.negotiable ? 'nego-section is-yes' : 'nego-section is-no'}
          title={property.negotiable ? 'Negotiable' : 'Not negotiable'}
        >
          <span className="nego-mark" aria-hidden="true">
            {property.negotiable ? '✓' : '✕'}
          </span>
          Negotiable
        </div>

        {isKilla && (
          <div
            className={property.submersible ? 'nego-section is-yes' : 'nego-section is-no'}
            title={property.submersible ? 'Submersible available' : 'No submersible'}
          >
            <span className="nego-mark" aria-hidden="true">
              {property.submersible ? '✓' : '✕'}
            </span>
            Submersible
          </div>
        )}

        <ul className="trust-list">
          <li className="ok">
            <span className="trust-tick" aria-hidden="true">✓</span>
            Property ID
          </li>
          {property.registry && (
            <li className="ok">
              <span className="trust-tick" aria-hidden="true">✓</span>
              Registry
            </li>
          )}
          {property.intKaal && (
            <li className="ok">
              <span className="trust-tick" aria-hidden="true">✓</span>
              Intkaal
            </li>
          )}
        </ul>

        <button
          type="button"
          className="whatsapp-btn"
          onClick={() => onChat(property)}
          aria-label={`Contact now about ${property.title}`}
        >
          <span className="whatsapp-icon" aria-hidden="true" />
          <span className="whatsapp-label">Contact now</span>
        </button>
      </div>
    </article>
  );
}
