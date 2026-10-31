import fs from 'fs';

const path = 'src/data/properties.js';
let s = fs.readFileSync(path, 'utf8');

const flags = {
  'BH-1042': true,
  'BH-2088': false,
  'BH-9150': true,
  'PL-3310': true,
  'PL-4421': false,
  'PL-5502': true,
  'PL-0267': false,
  'PL-1180': true,
  'RH-6614': false,
  'RH-7725': true,
  'RH-8836': false,
  'RH-9041': true,
};

for (const [id, val] of Object.entries(flags)) {
  const needle = `id: '${id}',`;
  const idx = s.indexOf(needle);
  if (idx < 0) continue;
  const priceIdx = s.indexOf('price:', idx);
  const comma = s.indexOf(',', priceIdx);
  if (s.slice(comma, comma + 30).includes('negotiable')) continue;
  s = `${s.slice(0, comma + 1)}\n    negotiable: ${val},${s.slice(comma + 1)}`;
}

fs.writeFileSync(path, s);
console.log('negotiable count', (s.match(/negotiable:/g) || []).length);
