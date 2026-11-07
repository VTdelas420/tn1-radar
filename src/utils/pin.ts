/**
 * TN1 Radar map pin: a glowing blue sphere, lit from the top left, floating
 * over its shadow on the ground. Every release uses the same pin, size and motion (equal weight).
 * Selected: brighter white light. Playing: beats with ipê-yellow light.
 * Motion and colours live in index.css (.tn1-pin).
 */

export type PinState = 'idle' | 'selected' | 'playing';

const FLOAT_S = 3.4;
const WAVE_S = { idle: 2.8, selected: 1.8, playing: 1 } as const;

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
export function pinMarkup(seed: string, state: PinState = 'idle', size = 36, box = 44): string {
  const stateClass = state === 'idle' ? '' : ` is-${state}`;
  const floatDelay = phase(seed, FLOAT_S);
  const waveDelay = phase(`${seed}~wave`, WAVE_S[state]);
  return `<div class="tn1-pin${stateClass}" style="width:${box}px;height:${box}px;--pin:${size}px">
    <div class="tn1-pin__wave" style="animation-delay:${waveDelay}"></div>
    <div class="tn1-pin__shadow" style="animation-delay:${floatDelay}"></div>
    <div class="tn1-pin__float" style="animation-delay:${floatDelay}">
      <div class="tn1-pin__lift">
        <div class="tn1-pin__halo" style="animation-delay:${floatDelay}"></div>
        <div class="tn1-pin__core"></div>
      </div>
    </div>
  </div>`;
}
