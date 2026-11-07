/**
 * TN1 Radar map pin: the blue triangle with the white eye (public/pins/triangulo.webp).
 * Every release uses the same pin, size and motion (equal weight). It floats over a
 * soft light on the ground and sends triangle-shaped waves; hover/touch lifts it.
 * Selected: white outline and wave. Playing: beats and sends ipê-yellow waves.
 * Animations live in index.css (.tn1-pin).
 */

export const PIN_SRC = '/pins/triangulo.webp';
// Image is 128 × 111 px
const RATIO = 111 / 128;
const FLOAT_S = 3.4;
const WAVE_S = 2.8;

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

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Negative animation delay that keeps a pin's motion continuous: markers are
 * redrawn on every zoom, so the phase comes from the clock, not from when the
 * element was created. Each pin is offset by its id so they don't move in sync.
 */
function phase(seed: string, period: number): string {
  const offset = (hash(seed) % 1000) / 1000;
  const t = performance.now() / 1000 / period + offset;
  return `-${((t % 1) * period).toFixed(2)}s`;
}

/** Static <img> of the pin, `width` px wide. */
export function pinImg(state: PinState = 'idle', width = 34): string {
  const height = Math.round(width * RATIO);
  return `<img src="${PIN_SRC}" width="${width}" height="${height}" alt="" draggable="false" style="display:block;width:${width}px !important;height:${height}px !important;max-width:none;filter:${OUTLINE[state]};pointer-events:none">`;
}

/** Animated pin inside a `box` px square (the tap area). */
export function pinMarkup(seed: string, state: PinState = 'idle', width = 34, box = 44): string {
  const height = Math.round(width * RATIO);
  const stateClass = state === 'idle' ? '' : ` is-${state}`;
  const floatDelay = phase(seed, FLOAT_S);
  const waveDelay = phase(`${seed}~wave`, state === 'playing' ? 1 : state === 'selected' ? 1.8 : WAVE_S);
  return `<div class="tn1-pin${stateClass}" style="width:${box}px;height:${box}px;--pin-w:${width}px;--pin-h:${height}px">
    <div class="tn1-pin__wave" style="animation-delay:${waveDelay}"></div>
    <div class="tn1-pin__shadow" style="animation-delay:${floatDelay}"></div>
    <div class="tn1-pin__float" style="animation-delay:${floatDelay}">
      <div class="tn1-pin__lift">${pinImg(state, width)}</div>
    </div>
  </div>`;
}
