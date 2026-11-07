/**
 * TN1 Radar map pin: the blue triangle with the white eye (public/pins/triangulo.webp).
 * Every release uses the same pin at the same size (equal weight). The selected
 * pin gets a white outline; the one playing gets an ipê-yellow outline.
 */

export const PIN_SRC = '/pins/triangulo.webp';
// Image is 128 × 111 px
const RATIO = 111 / 128;

export type PinState = 'idle' | 'selected' | 'playing';

const OUTLINE: Record<PinState, string> = {
  idle: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))',
  selected: outline('#f2f5fa'),
  playing: outline('#f2b705'),
};

function outline(color: string): string {
  return [
    [1.5, 0],
    [-1.5, 0],
    [0, 1.5],
    [0, -1.5],
  ]
    .map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${color})`)
    .join(' ');
}

/** <img> markup for one pin, `width` px wide. */
export function pinImg(state: PinState = 'idle', width = 34): string {
  const height = Math.round(width * RATIO);
  return `<img src="${PIN_SRC}" width="${width}" height="${height}" alt="" draggable="false" style="display:block;width:${width}px !important;height:${height}px !important;max-width:none;filter:${OUTLINE[state]};pointer-events:none">`;
}
