import { DF_ADMINISTRATIVE_REGIONS, type BrazilMunicipalityEntry } from '../utils/releaseValidation';

/**
 * Launch region of TN1 Radar: Distrito Federal (35 RAs) + Entorno imediato (GO).
 * Everything outside it shows on the map as "em breve" and cannot receive releases.
 */
export const REGION_NAME = 'DF + Entorno';

/**
 * Entorno imediato — city-center coordinates, reviewed by hand because the
 * bundled municipality dataset misses Valparaíso and misplaces several others.
 * "Planaltina de Goiás" is used to tell it apart from the Planaltina RA (DF).
 */
export const ENTORNO_CITIES: BrazilMunicipalityEntry[] = [
  { n: 'Águas Lindas de Goiás', uf: 'GO', lat: -15.7617, lng: -48.2817 },
  { n: 'Alexânia', uf: 'GO', lat: -16.0834, lng: -48.5076 },
  { n: 'Cidade Ocidental', uf: 'GO', lat: -16.0764, lng: -47.9253 },
  { n: 'Cocalzinho de Goiás', uf: 'GO', lat: -15.7911, lng: -48.7747 },
  { n: 'Cristalina', uf: 'GO', lat: -16.7686, lng: -47.6131 },
  { n: 'Formosa', uf: 'GO', lat: -15.5372, lng: -47.3342 },
  { n: 'Luziânia', uf: 'GO', lat: -16.2525, lng: -47.9503 },
  { n: 'Novo Gama', uf: 'GO', lat: -16.0592, lng: -48.0417 },
  { n: 'Padre Bernardo', uf: 'GO', lat: -15.1606, lng: -48.2833 },
  { n: 'Planaltina de Goiás', uf: 'GO', lat: -15.4528, lng: -47.6142 },
  { n: 'Santo Antônio do Descoberto', uf: 'GO', lat: -15.9411, lng: -48.2578 },
  { n: 'Valparaíso de Goiás', uf: 'GO', lat: -16.0683, lng: -47.9758 },
];

/** Every place a release can be published from, DF first. */
export const REGION_LOCATIONS: BrazilMunicipalityEntry[] = [
  ...DF_ADMINISTRATIVE_REGIONS,
  ...ENTORNO_CITIES,
];

/** Rectangle around the region, with room for city outskirts. [[south, west], [north, east]] */
export const REGION_BOUNDS: [[number, number], [number, number]] = [
  [-17.0, -48.95],
  [-15.0, -47.15],
];

/** The camera cannot pan beyond this rectangle (region + a small margin). */
export const REGION_CAMERA_BOUNDS: [[number, number], [number, number]] = [
  [-17.4, -49.4],
  [-14.6, -46.7],
];

/** Farthest zoom-out: the whole region, nothing more. */
export const REGION_MIN_ZOOM = 8.5;

export const REGION_CENTER: [number, number] = [-15.85, -47.95];

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

const ENTORNO_NAMES = new Set(ENTORNO_CITIES.map((c) => normalize(c.n)));
// The municipality polygons use official names (e.g. "Planaltina", not "Planaltina de Goiás").
ENTORNO_NAMES.add(normalize('Planaltina'));

export function isRegionState(uf: string) {
  return uf.toUpperCase() === 'DF';
}

/** True for any DF RA or Entorno city polygon/name (state needed to tell the two Planaltinas apart). */
export function isRegionPlace(name: string, uf: string) {
  const u = (uf || '').toUpperCase();
  if (u === 'DF') return true;
  return u === 'GO' && ENTORNO_NAMES.has(normalize(name || ''));
}

/** Point-in-region test against the bounding rectangle, with an optional margin in km. */
export function isInRegion(lat: number, lng: number, marginKm = 0) {
  const dLat = marginKm / 111;
  const dLng = marginKm / (111 * Math.cos((lat * Math.PI) / 180));
  const [[s, w], [n, e]] = REGION_BOUNDS;
  return lat >= s - dLat && lat <= n + dLat && lng >= w - dLng && lng <= e + dLng;
}

export function findRegionLocation(name: string, uf?: string) {
  const n = normalize(name);
  return REGION_LOCATIONS.find((c) => normalize(c.n) === n && (!uf || c.uf === uf.toUpperCase()));
}

export type DeviceLocationCheck =
  | { ok: true; lat: number; lng: number; accuracyM: number }
  | { ok: false; reason: 'unsupported' | 'denied' | 'unavailable' | 'outside'; message: string };

/**
 * Asks the browser for the device position and checks it is inside the region.
 * Margin grows with reported accuracy (laptops on Wi-Fi can be off by kilometres).
 */
export function checkDeviceInRegion(): Promise<DeviceLocationCheck> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ ok: false, reason: 'unsupported', message: 'Este navegador não informa a localização.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const marginKm = 10 + Math.min(accuracy / 1000, 20);
        if (isInRegion(lat, lng, marginKm)) {
          resolve({ ok: true, lat, lng, accuracyM: accuracy });
        } else {
          resolve({
            ok: false,
            reason: 'outside',
            message: `Por enquanto só artistas do ${REGION_NAME} podem publicar. Sua localização atual está fora da região.`,
          });
        }
      },
      (err) => {
        resolve(
          err.code === err.PERMISSION_DENIED
            ? {
                ok: false,
                reason: 'denied',
                message:
                  'O navegador bloqueou a localização. Toque no cadeado ao lado do endereço do site, permita a localização e tente de novo. No computador, confira também se a localização do Windows está ligada (Configurações > Privacidade > Localização).',
              }
            : { ok: false, reason: 'unavailable', message: 'Não foi possível achar sua localização. Ligue a localização do aparelho (no Windows: Configurações > Privacidade > Localização) e tente de novo, de preferência pelo celular.' }
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5 * 60 * 1000 }
    );
  });
}
