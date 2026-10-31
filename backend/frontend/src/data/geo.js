export const CITY = 'Jind';

export const NEARBY_RADIUS_KM = 4;

export function distanceKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getLocalitiesNearToFar(localities, userLocation) {
  const list = localities.map((loc) => ({
    name: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    km: null,
  }));

  if (!userLocation) return list;

  return list
    .map((loc) => ({
      ...loc,
      km:
        loc.lat != null && loc.lng != null
          ? distanceKm(userLocation, { lat: loc.lat, lng: loc.lng })
          : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => a.km - b.km);
}

export function buildExactAreaLabel(address = {}, fallbackDisplay = '') {
  const a = address || {};
  const unique = [];

  function push(value) {
    const v = String(value || '').trim();
    if (!v) return;
    if (unique.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    unique.push(v);
  }

  push(a.suburb);
  push(a.neighbourhood);
  push(a.residential);
  push(a.quarter);
  push(a.city_district);
  push(a.locality);
  push(a.village);
  push(a.hamlet);
  push(a.road);
  push(a.city || a.town || a.municipality);
  push(a.county || a.state_district);
  push(a.state);

  if (unique.length >= 2) return unique.slice(0, 3).join(', ');
  if (unique.length === 1) return unique[0];
  if (fallbackDisplay) {
    return fallbackDisplay
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
  }
  return '';
}

export function formatPrice(price, type) {
  const amount = Number(price || 0).toLocaleString('en-IN');
  if (type === 'rent') {
    return `Rs. ${amount}/mo`;
  }
  if (type === 'plot') {
    return `Rs.${amount}/gaj`;
  }
  return `Rs. ${amount}`;
}
