/**
 * Map pins drawn as Athos Bulcão-style tiles (the blue and white azulejos all
 * over Brasília). Athos let the builders lay his tiles in any rotation, so each
 * release gets a motif and rotation picked from its id: every pin has the same
 * size and colours (equal weight), only the pattern varies.
 */

// Motifs on a 24×24 tile, drawn in the tile's blue
const MOTIFS = [
  // Two quarter circles in opposite corners
  '<path d="M0 0h12A12 12 0 0 1 0 12z"/><path d="M24 24H12a12 12 0 0 1 12-12z"/>',
  // Half disc on one edge
  '<path d="M12 0a12 12 0 0 1 0 24z"/>',
  // Diagonal half
  '<path d="M0 0h24L0 24z"/>',
  // Disc in the middle with corner triangles
  '<circle cx="12" cy="12" r="5.5"/><path d="M0 0h7L0 7z"/><path d="M24 24h-7l7-7z"/>',
] as const;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type TileState = 'idle' | 'selected' | 'playing';

/** SVG of one tile. Selected inverts the colours; playing adds an ipê-yellow frame. */
export function azulejoSvg(seed: string, state: TileState = 'idle', size = 30): string {
  const h = hash(seed);
  const motif = MOTIFS[h % MOTIFS.length];
  const rotation = ((h >>> 3) % 4) * 90;
  const inverted = state === 'selected';
  const ground = inverted ? 'var(--color-athos-600)' : 'var(--color-azulejo)';
  const ink = inverted ? 'var(--color-azulejo)' : 'var(--color-athos-600)';
  const frame = state === 'playing' ? 'var(--color-ipe)' : inverted ? 'var(--color-azulejo)' : 'rgba(0,0,0,0.6)';
  const frameWidth = state === 'idle' ? 1 : 2.5;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="display:block">
    <rect width="24" height="24" fill="${ground}"/>
    <g fill="${ink}" transform="rotate(${rotation} 12 12)">${motif}</g>
    <rect x="${frameWidth / 2}" y="${frameWidth / 2}" width="${24 - frameWidth}" height="${24 - frameWidth}" fill="none" stroke="${frame}" stroke-width="${frameWidth}"/>
  </svg>`;
}
