export const CITY = 'Jind';

export const LOCALITIES = [
  'Urban Estate',
  'Housing Board Colony',
  'Defence Colony',
  'Sector 7',
  'Sector 8',
  'Sector 10',
  'Sector 11',
  'Sector 26',
  'Krishna Colony',
  'Shiv Colony',
  'Rohtak Road',
  'Safidon Road',
  'Scheme No 5',
  'Vishwakarma Colony',
  'Police Lines',
];

/** Approximate coordinates around Jind city for Nearby distance checks */
export const LOCALITY_COORDS = {
  'Urban Estate': { lat: 29.3215, lng: 76.3128 },
  'Housing Board Colony': { lat: 29.3188, lng: 76.3095 },
  'Defence Colony': { lat: 29.3252, lng: 76.3184 },
  'Sector 7': { lat: 29.3142, lng: 76.3051 },
  'Sector 8': { lat: 29.3126, lng: 76.3088 },
  'Sector 10': { lat: 29.3109, lng: 76.3142 },
  'Sector 11': { lat: 29.3095, lng: 76.3196 },
  'Sector 26': { lat: 29.3028, lng: 76.3284 },
  'Krishna Colony': { lat: 29.3176, lng: 76.3212 },
  'Shiv Colony': { lat: 29.3199, lng: 76.3248 },
  'Rohtak Road': { lat: 29.3064, lng: 76.3018 },
  'Safidon Road': { lat: 29.3284, lng: 76.3312 },
  'Scheme No 5': { lat: 29.3158, lng: 76.3166 },
  'Vishwakarma Colony': { lat: 29.3228, lng: 76.3072 },
  'Police Lines': { lat: 29.3241, lng: 76.3149 },
};

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

export function isPropertyNearby(property, userLocation, radiusKm = NEARBY_RADIUS_KM) {
  if (!userLocation) return Boolean(property.nearby);
  const coords = LOCALITY_COORDS[property.locality];
  if (!coords) return Boolean(property.nearby);
  return distanceKm(userLocation, coords) <= radiusKm;
}

export function getNearestLocality(userLocation) {
  if (!userLocation) return null;
  let best = null;
  for (const [name, coords] of Object.entries(LOCALITY_COORDS)) {
    const km = distanceKm(userLocation, coords);
    if (!best || km < best.km) best = { name, km };
  }
  return best;
}

/** Localities sorted near → far from user GPS */
export function getLocalitiesNearToFar(userLocation) {
  if (!userLocation) {
    return LOCALITIES.map((name) => ({ name, km: null }));
  }
  return [...LOCALITIES]
    .map((name) => {
      const coords = LOCALITY_COORDS[name];
      return {
        name,
        km: coords ? distanceKm(userLocation, coords) : Number.POSITIVE_INFINITY,
      };
    })
    .sort((a, b) => a.km - b.km);
}

/** Build exact area/colony label from reverse-geocode address fields only */
export function buildExactAreaLabel(address = {}, fallbackDisplay = '') {
  const a = address || {};
  const unique = [];

  function push(value) {
    const v = String(value || '').trim();
    if (!v) return;
    if (unique.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    unique.push(v);
  }

  // Prefer colony / mohalla / sector style names first
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

export const PROPERTIES = [
  {
    id: 'BH-1042',
    title: '2 Storey Independent House',
    type: 'house',
    price: 7000000,
    negotiable: true,
    locality: 'Urban Estate',
    area: '2400 sq.ft',
    nearby: true,
    registry: true,
    noLoan: true,
    intKaal: true,
    images: [
      '/properties/houses/h8.jpg',
      '/properties/houses/h11.webp',
      '/properties/houses/h12.jpg',
      '/properties/houses/h13.webp',
    ],
  },
  {
    id: 'BH-2088',
    title: 'Family House Near Bus Stand',
    type: 'house',
    price: 3200000,
    negotiable: false,
    locality: 'Housing Board Colony',
    area: '1650 sq.ft',
    nearby: true,
    registry: true,
    noLoan: false,
    intKaal: true,
    images: [
      '/properties/houses/h1.jpg',
      '/properties/houses/h2.jpg',
      '/properties/houses/h9.jpg',
    ],
  },
  {
    id: 'BH-9150',
    title: 'Modern Corner House',
    type: 'house',
    price: 5500000,
    negotiable: true,
    locality: 'Defence Colony',
    area: '2100 sq.ft',
    nearby: false,
    registry: true,
    noLoan: false,
    intKaal: true,
    images: [
      '/properties/houses/h5.jpg',
      '/properties/houses/h7.webp',
      '/properties/houses/h10.webp',
    ],
  },
  {
    id: 'BH-3315',
    title: 'Spacious 3 BHK House',
    type: 'house',
    price: 4500000,
    negotiable: true,
    locality: 'Scheme No 5',
    area: '1850 sq.ft',
    nearby: true,
    registry: true,
    noLoan: true,
    intKaal: true,
    images: [
      '/properties/houses/h3.jpg',
      '/properties/houses/h4.webp',
    ],
  },
  {
    id: 'BH-4470',
    title: 'Ready to Move House',
    type: 'house',
    price: 2000000,
    negotiable: false,
    locality: 'Police Lines',
    area: '1200 sq.ft',
    nearby: false,
    registry: true,
    noLoan: true,
    intKaal: false,
    images: [
      '/properties/houses/h6.jpg',
      '/properties/houses/h1.jpg',
    ],
  },
  {
    id: 'PL-3310',
    title: 'Corner Plot — Clear Title',
    type: 'plot',
    price: 2800000,
    negotiable: true,
    locality: 'Sector 7',
    area: '200 sq.yd',
    nearby: false,
    registry: true,
    noLoan: true,
    intKaal: true,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
      'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&q=80',
    ],
  },
  {
    id: 'PL-4421',
    title: 'Residential Plot with Road Access',
    type: 'plot',
    price: 1950000,
    negotiable: false,
    locality: 'Sector 8',
    area: '150 sq.yd',
    nearby: true,
    registry: true,
    noLoan: true,
    intKaal: false,
    images: [
      'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&q=80',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80',
    ],
  },
  {
    id: 'PL-5502',
    title: 'HSVP Style Plot — Wide Road',
    type: 'plot',
    price: 3500000,
    negotiable: true,
    locality: 'Sector 10',
    area: '250 sq.yd',
    nearby: false,
    registry: true,
    noLoan: true,
    intKaal: true,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    ],
  },
  {
    id: 'PL-0267',
    title: 'Emerging Belt Plot',
    type: 'plot',
    price: 4200000,
    negotiable: false,
    locality: 'Sector 26',
    area: '300 sq.yd',
    nearby: true,
    registry: true,
    noLoan: true,
    intKaal: true,
    images: [
      'https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=800&q=80',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    ],
  },
  {
    id: 'PL-1180',
    title: 'Highway Facing Plot',
    type: 'plot',
    price: 3100000,
    negotiable: true,
    locality: 'Rohtak Road',
    area: '220 sq.yd',
    nearby: false,
    registry: true,
    noLoan: true,
    intKaal: true,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
      'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&q=80',
    ],
  },
  {
    id: 'RH-6614',
    title: 'Furnished 2 BHK for Rent',
    type: 'rent',
    price: 12000,
    negotiable: false,
    locality: 'Krishna Colony',
    area: '950 sq.ft',
    nearby: true,
    registry: true,
    noLoan: true,
    intKaal: false,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ],
  },
  {
    id: 'RH-7725',
    title: 'Spacious 3 BHK Rental',
    type: 'rent',
    price: 18000,
    negotiable: true,
    locality: 'Sector 11',
    area: '1400 sq.ft',
    nearby: true,
    registry: true,
    noLoan: true,
    intKaal: false,
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    ],
  },
  {
    id: 'RH-8836',
    title: '1 BHK Near Market',
    type: 'rent',
    price: 8000,
    negotiable: false,
    locality: 'Shiv Colony',
    area: '550 sq.ft',
    nearby: false,
    registry: true,
    noLoan: true,
    intKaal: false,
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
      'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&q=80',
    ],
  },
  {
    id: 'RH-9041',
    title: '2 BHK on Safidon Road',
    type: 'rent',
    price: 14000,
    negotiable: true,
    locality: 'Safidon Road',
    area: '1100 sq.ft',
    nearby: true,
    registry: true,
    noLoan: true,
    intKaal: false,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    ],
  },
];

export function formatPrice(price, type) {
  const amount = Number(price || 0).toLocaleString('en-IN');
  if (type === 'rent') {
    return `Rs. ${amount}/mo`;
  }
  return `Rs. ${amount}`;
}
