import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPixPayload, crc16 } from './pix';

test('crc16 matches the CCITT-FALSE check value', () => {
  assert.equal(crc16('123456789'), '29B1');
});

test('buildPixPayload builds a valid static BR Code', () => {
  const payload = buildPixPayload({
    key: 'artista@example.com',
    name: 'MC Ceilândia',
    city: 'Ceilândia',
    amount: 15,
    txid: 'TN1RADAR',
  });
  assert.ok(payload.startsWith('000201'));
  assert.ok(payload.includes('0014br.gov.bcb.pix0119artista@example.com'));
  assert.ok(payload.includes('540515.00'));
  assert.ok(payload.includes('5912MC CEILANDIA'));
  assert.ok(payload.includes('6009CEILANDIA'));
  assert.ok(payload.includes('62120508TN1RADAR'));
  // Last 4 chars are the CRC of everything before them
  assert.equal(payload.slice(-4), crc16(payload.slice(0, -4)));
});

test('buildPixPayload omits the amount when none is given', () => {
  const payload = buildPixPayload({ key: '123e4567-e89b-12d3-a456-426614174000', name: 'X', city: 'Gama' });
  assert.ok(!/54\d{2}\d+\.\d{2}/.test(payload.split('5802BR')[0].split('5303986')[1] ?? ''));
  assert.ok(payload.includes('5303986' + '5802BR'));
});
