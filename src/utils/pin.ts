/**
 * TN1 Radar map pin: light rising from a point, drawn as a low-resolution
 * gradient so its edges show square pixel steps (as in the TN1 artwork), with a
 * thin ring inside it that the light passes through. Every release uses the
 * same pin, size and motion (equal weight).
 * Selected: whiter light. Playing: ipê-yellow light that beats.
 * Motion lives in index.css (.tn1-pin).
 */

export type PinState = 'idle' | 'selected' | 'playing';

const FLOAT_S = 3.4;
const WAVE_S = { idle: 2.8, selected: 1.8, playing: 1 } as const;

// [centre colour, body colour] of the light per state (RGB)
const LIGHT: Record<PinState, [number[], number[]]> = {
  idle: [[190, 208, 255], [52, 98, 228]],
  selected: [[255, 255, 255], [140, 170, 255]],
  playing: [[255, 240, 180], [242, 183, 5]],
};

// The light is this many times wider than the pin
export const LIGHT_SCALE = 2.2;
const GRID = 16; // pixels across the light texture
const STEPS = 7; // brightness steps, so the falloff bands like the artwork

const textureCache = new Map<PinState, string>();

/** Pixel-stepped radial light as a tiny PNG (cached per state). */
function lightTexture(state: PinState): string {
  const cached = textureCache.get(state);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = GRID;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(GRID, GRID);
  const [hi, body] = LIGHT[state];
  const pinEdge = 1 / LIGHT_SCALE; // radius where the pin itself ends (0..1)
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const dx = (x + 0.5) / GRID - 0.5;
      const dy = (y + 0.5) / GRID - 0.5;
      const r = Math.min(1, Math.hypot(dx, dy) * 2);
      // Colour: centre tone fading to the body tone across the pin
      const t = Math.min(1, r / pinEdge);
      // Soft inside the pin (the round glint and ring carry the centre), strongest at the pin edge, then falling off
      let a = r <= pinEdge ? 0.35 + 0.35 * t : 0.7 * Math.pow(1 - (r - pinEdge) / (1 - pinEdge), 1.6);
      a = Math.round(a * STEPS) / STEPS;
      const i = (y * GRID + x) * 4;
      img.data[i] = Math.round(hi[0] + (body[0] - hi[0]) * t);
      img.data[i + 1] = Math.round(hi[1] + (body[1] - hi[1]) * t);
      img.data[i + 2] = Math.round(hi[2] + (body[2] - hi[2]) * t);
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL('image/png');
  textureCache.set(state, url);
  return url;
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

/** Animated pin, `size` px across, centred in a `box` px square (the tap area). */
export function pinMarkup(seed: string, state: PinState = 'idle', size = 30, box = 44): string {
  const stateClass = state === 'idle' ? '' : ` is-${state}`;
  const floatDelay = phase(seed, FLOAT_S);
  const waveDelay = phase(`${seed}~wave`, WAVE_S[state]);
  return `<div class="tn1-pin${stateClass}" style="width:${box}px;height:${box}px;--pin:${size}px;--light:url(${lightTexture(state)})">
    <div class="tn1-pin__wave" style="animation-delay:${waveDelay}"></div>
    <div class="tn1-pin__float" style="animation-delay:${floatDelay}">
      <div class="tn1-pin__lift">
        <div class="tn1-pin__light" style="animation-delay:${floatDelay}"></div>
        <div class="tn1-pin__ring"></div>
        <div class="tn1-pin__glint"></div>
      </div>
    </div>
  </div>`;
}

/** Leaflet pane for what pins cast on the map: below every pin, so no glow covers another pin. */
export const GROUND_PANE = 'tn1Ground';
export const GROUND_BOX = 120;

/**
 * What a pin casts on the map: a soft darkening around it (so the light stands
 * out from the streets) and a flattened, pixel-stepped pool of its light on the
 * ground, which shrinks while the pin floats up.
 */
export function pinGroundMarkup(seed: string, state: PinState = 'idle', size = 30): string {
  const stateClass = state === 'idle' ? '' : ` is-${state}`;
  const floatDelay = phase(seed, FLOAT_S);
  return `<div class="tn1-ground${stateClass}" style="width:${GROUND_BOX}px;height:${GROUND_BOX}px;--pin:${size}px;--light:url(${lightTexture(state)})">
    <div class="tn1-ground__dim"></div>
    <div class="tn1-ground__pool" style="animation-delay:${floatDelay}"></div>
  </div>`;
}
