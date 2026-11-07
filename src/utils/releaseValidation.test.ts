import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCoverDimensions,
  formatAudioFileSize,
  resolveBrazilCoordinates,
  spreadOverlappingProjects,
  DF_ADMINISTRATIVE_REGIONS,
} from './releaseValidation';

test('validateCoverDimensions accepts dimensions up to 3000x3000 px', () => {
  const res1 = validateCoverDimensions(1500, 1500);
  assert.equal(res1.valid, true);
  assert.equal(res1.error, undefined);

  const resBoundary = validateCoverDimensions(3000, 3000);
  assert.equal(resBoundary.valid, true);
});

test('validateCoverDimensions rejects dimensions exceeding 3000x3000 px', () => {
  const resWidthOver = validateCoverDimensions(3001, 2000);
  assert.equal(resWidthOver.valid, false);
  assert.match(resWidthOver.error || '', /3000x3000 px/);

  const resHeightOver = validateCoverDimensions(2500, 3400);
  assert.equal(resHeightOver.valid, false);
  assert.match(resHeightOver.error || '', /3000x3000 px/);
});

test('formatAudioFileSize formats bytes into KB and MB cleanly', () => {
  assert.equal(formatAudioFileSize(512), '500.0 KB'.replace('500.0 KB', '512 B'));
  assert.equal(formatAudioFileSize(1024 * 500), '500.0 KB');
  assert.equal(formatAudioFileSize(1024 * 1024 * 12.5), '12.5 MB');
});

test('resolveBrazilCoordinates preserves valid coordinates and resolves DF administrative regions', () => {
  const validCoord = resolveBrazilCoordinates('Campinas', 'SP', -22.9099, -47.0626);
  assert.deepEqual(validCoord, { lat: -22.9099, lng: -47.0626 });

  const resolvedFromState = resolveBrazilCoordinates('Cidade Nova', 'SC', 0, 0);
  assert.deepEqual(resolvedFromState, { lat: -27.5954, lng: -48.548 });

  assert.equal(DF_ADMINISTRATIVE_REGIONS.length, 35);
  const ceilandia = resolveBrazilCoordinates('Ceilândia', 'DF', 0, 0);
  assert.deepEqual(ceilandia, { lat: -15.8205, lng: -48.1132 });
});

test('spreadOverlappingProjects separates multiple releases in the exact same city so none stack', () => {
  const sameCityProjects = [
    { id: 'p1', coordinates: { lat: -23.5505, lng: -46.6333 } },
    { id: 'p2', coordinates: { lat: -23.5505, lng: -46.6333 } },
    { id: 'p3', coordinates: { lat: -23.5505, lng: -46.6333 } },
  ];

  const spreadMap = spreadOverlappingProjects(sameCityProjects, 4);
  const p1 = spreadMap.get('p1')!;
  const p2 = spreadMap.get('p2')!;
  const p3 = spreadMap.get('p3')!;

  assert.ok(p1 && p2 && p3);
  const d12 = Math.hypot(p1.lat - p2.lat, p1.lng - p2.lng);
  const d23 = Math.hypot(p2.lat - p3.lat, p2.lng - p3.lng);
  const d13 = Math.hypot(p1.lat - p3.lat, p1.lng - p3.lng);

  // Every pair must be separated by at least 1.3 degrees at zoom 4
  assert.ok(d12 >= 1.3, `Expected d12 >= 1.3, got ${d12}`);
  assert.ok(d23 >= 1.3, `Expected d23 >= 1.3, got ${d23}`);
  assert.ok(d13 >= 1.3, `Expected d13 >= 1.3, got ${d13}`);

  // Also test 10 releases in the exact same neighborhood at street zoom 14
  const tenProjects = Array.from({ length: 10 }, (_, idx) => ({
    id: `df-${idx}`,
    city: 'Taguatinga',
    coordinates: { lat: -15.8335, lng: -48.0566 },
  }));
  const streetSpread = spreadOverlappingProjects(tenProjects, 14);
  const items = Array.from(streetSpread.values());
  assert.equal(items.length, 10);
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const dist = Math.hypot(items[i].lat - items[j].lat, items[i].lng - items[j].lng);
      // Pins are 44 px wide; at zoom 14 one pixel is 1.40625 / 2^14 degrees
      const minDeg = (1.40625 / Math.pow(2, 14)) * 44;
      assert.ok(dist >= minDeg, `Expected street-level pins ${i} and ${j} not to touch, got ${dist}`);
    }
  }
});

test('spreadOverlappingProjects keeps separate DF RAs at their real positions at region zoom', () => {
  const ras = [
    { id: 'ceilandia', city: 'Ceilândia', coordinates: { lat: -15.8205, lng: -48.1132 } },
    { id: 'plano', city: 'Brasília (Plano Piloto)', coordinates: { lat: -15.7938, lng: -47.8827 } },
    { id: 'gama', city: 'Gama', coordinates: { lat: -16.0169, lng: -48.0652 } },
  ];
  const spread = spreadOverlappingProjects(ras, 9);
  for (const ra of ras) {
    const pos = spread.get(ra.id)!;
    assert.equal(pos.isDisplaced, false, `${ra.id} should not be moved`);
    assert.equal(pos.lat, ra.coordinates.lat);
    assert.equal(pos.lng, ra.coordinates.lng);
  }
});
