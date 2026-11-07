/**
 * Static Pix "copia e cola" (BR Code, EMV QR format from the Banco Central manual).
 * Money goes straight from the supporter's bank to the artist's key; no provider,
 * no fees — and no automatic payment confirmation (static Pix has none).
 */

/** CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as required by the BR Code spec. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

/** Merchant name/city: plain ASCII, upper-case, within the spec's length limits. */
function asciiUpper(s: string, max: number) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, max);
}

export interface PixPayloadInput {
  key: string;
  name: string;
  city: string;
  /** In reais; omit to let the supporter type the amount in their bank app. */
  amount?: number;
  /** Shown in some bank apps. Keep it short. */
  description?: string;
  /** Up to 25 letters/digits; "***" when not used. */
  txid?: string;
}

export function buildPixPayload({ key, name, city, amount, description, txid }: PixPayloadInput): string {
  const cleanKey = key.trim();
  if (!cleanKey) throw new Error('Chave Pix vazia');
  const desc = description ? asciiUpper(description, 40) : '';
  const account =
    field('00', 'br.gov.bcb.pix') + field('01', cleanKey) + (desc ? field('02', desc) : '');
  const tx = (txid ?? '***').replace(/[^A-Za-z0-9*]/g, '').slice(0, 25) || '***';

  const body =
    field('00', '01') +
    field('26', account) +
    field('52', '0000') +
    field('53', '986') +
    (amount && amount > 0 ? field('54', amount.toFixed(2)) : '') +
    field('58', 'BR') +
    field('59', asciiUpper(name, 25) || 'ARTISTA') +
    field('60', asciiUpper(city, 15) || 'BRASILIA') +
    field('62', field('05', tx)) +
    '6304';
  return body + crc16(body);
}
