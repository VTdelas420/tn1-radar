// Builds the map data for the DF + Entorno launch region from raw downloads:
//   node scripts/build-region-geodata.mjs <osm-places.json> <valparaiso-ibge.json>
//
// osm-places.json: Overpass API result for
//   node["place"~"^(suburb|neighbourhood|quarter)$"](-17.0,-48.95,-15.0,-47.15); out body;
// valparaiso-ibge.json: IBGE malhas v3, municipality 5221858 (Valparaíso de Goiás).
//
// Writes public/data/region-neighborhoods.json and public/data/region-extra-cities.json.
// Data © OpenStreetMap contributors (ODbL) and IBGE.
import { readFileSync, writeFileSync } from 'node:fs';

const [osmPath, valpPath] = process.argv.slice(2);
if (!osmPath || !valpPath) {
  console.error('usage: node scripts/build-region-geodata.mjs <osm-places.json> <valparaiso-ibge.json>');
  process.exit(1);
}

// Place centres used to tag each neighbourhood with its RA / city (nearest centre)
const regionSrc = readFileSync(new URL('../src/config/region.ts', import.meta.url), 'utf8');
const raSrc = readFileSync(new URL('../src/utils/releaseValidation.ts', import.meta.url), 'utf8');
const entryRe = /\{ n: '([^']+)', uf: '(DF|GO)', lat: (-?[\d.]+), lng: (-?[\d.]+) \}/g;
const places = [...raSrc.matchAll(entryRe), ...regionSrc.matchAll(entryRe)].map((m) => ({
  n: m[1],
  uf: m[2],
  lat: Number(m[3]),
  lng: Number(m[4]),
}));
if (places.length < 40) throw new Error(`expected 47 region places, found ${places.length}`);

const nearest = (lat, lng) =>
  places.reduce((best, p) => {
    const d = Math.hypot(p.lat - lat, (p.lng - lng) * Math.cos((lat * Math.PI) / 180));
    return d < best.d ? { p, d } : best;
  }, { p: places[0], d: Infinity }).p;

// Small invisible octagon around each label, so a click on it can zoom in
const octagon = (lat, lng, metres) => {
  const dLat = metres / 111_000;
  const dLng = metres / (111_000 * Math.cos((lat * Math.PI) / 180));
  const ring = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * 2 * Math.PI;
    return [Number((lng + Math.cos(a) * dLng).toFixed(5)), Number((lat + Math.sin(a) * dLat).toFixed(5))];
  });
  ring.push(ring[0]);
  return { type: 'Polygon', coordinates: [ring] };
};

// Only bairro-level names on the map: skip superquadras/blocks, conjuntos,
// condomínios and street-like names (TN1 Radar shows neighbourhoods, not addresses).
const NOT_A_BAIRRO =
  /^(conjunto|conj\.|quadras?\b|qd\.|trecho\b|lote\b|condom[ií]nio|cond\.|via\b|rua\b|avenida\b|av\.|estrada\b|rodovia\b|eixo\b|(sq|cl|eq|sh|sc|sm|sg|ep|sr)[a-z]{0,3}\s*\d)/i;

const osm = JSON.parse(readFileSync(osmPath, 'utf8'));
const seen = new Set();
const features = [];
for (const el of osm.elements ?? []) {
  const name = el.tags?.name?.trim();
  if (el.type !== 'node' || !name) continue;
  const key = `${name.toLowerCase()}|${el.lat.toFixed(3)}|${el.lon.toFixed(3)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  // place=neighbourhood in Brasília is mostly single superquadras/blocks: not shown
  if (el.tags.place === 'neighbourhood' || NOT_A_BAIRRO.test(name)) continue;
  const tier = 1;
  const owner = nearest(el.lat, el.lon);
  features.push({
    type: 'Feature',
    properties: {
      b: name,
      c: owner.n,
      u: owner.uf,
      lat: Number(el.lat.toFixed(5)),
      lng: Number(el.lon.toFixed(5)),
      t: tier,
    },
    geometry: octagon(el.lat, el.lon, tier === 1 ? 450 : 150),
  });
}
features.sort((a, b) => a.properties.t - b.properties.t || a.properties.b.localeCompare(b.properties.b, 'pt-BR'));

writeFileSync(
  new URL('../public/data/region-neighborhoods.json', import.meta.url),
  JSON.stringify({ type: 'FeatureCollection', attribution: '© OpenStreetMap contributors (ODbL)', features })
);

const valp = JSON.parse(readFileSync(valpPath, 'utf8'));
const valpFeature = valp.features ? valp.features[0] : valp;
writeFileSync(
  new URL('../public/data/region-extra-cities.json', import.meta.url),
  JSON.stringify({
    type: 'FeatureCollection',
    attribution: 'IBGE — Malha Municipal',
    features: [{ type: 'Feature', properties: { n: 'Valparaíso de Goiás' }, geometry: valpFeature.geometry }],
  })
);

const t1 = features.filter((f) => f.properties.t === 1).length;
console.log(`neighbourhoods: ${features.length} (tier 1: ${t1}, tier 2: ${features.length - t1}); extra cities: 1`);
