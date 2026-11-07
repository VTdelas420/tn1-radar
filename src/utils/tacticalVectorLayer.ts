import L from 'leaflet';
import type { StyleSpecification, LayerSpecification, ExpressionSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { createTacticalUrbanCanvasLayer } from './tacticalUrbanLayer';

/**
 * Vector basemap for the TN1 Radar: OpenFreeMap tiles (OpenStreetMap data,
 * OpenMapTiles schema, free, no key) drawn by MapLibre in our black + electric
 * blue look. Sharp at every zoom and on high-density screens.
 *
 * Zoom levels below are LEAFLET zooms. MapLibre inside Leaflet runs one level
 * lower (512 px tiles), so every value goes through `gl()`.
 */
const gl = (leafletZoom: number) => leafletZoom - 1;

const OPENFREEMAP = 'https://tiles.openfreemap.org/planet';

const C = {
  bg: '#000000',
  water: '#041427',
  waterEdge: '#0ea5e9',
  creek: '#0c4a6e',
  highway: '#38bdf8',
  arterial: '#2b8fd6',
  street: '#1d4ed8',
  curbInner: '#01060f',
  building: '#03172a',
  buildingEdge: '#22d3ee',
};

/** Line width that grows with zoom: [leafletZoom, px] pairs. */
const width = (...stops: [number, number][]): ExpressionSpecification =>
  ['interpolate', ['exponential', 1.6], ['zoom'], ...stops.flatMap(([z, w]) => [gl(z), w])] as ExpressionSpecification;

// Roads only as lines: area features (squares, parking) in the same layer would be painted as solid blocks
const roadClass = (...classes: string[]): ExpressionSpecification =>
  ['all', ['==', ['geometry-type'], 'LineString'], ['match', ['get', 'class'], classes, true, false]] as unknown as ExpressionSpecification;


/**
 * 2.5D buildings without tilting the map (Leaflet stays top-down): each footprint
 * is repeated a few times, shifted up-right in proportion to its real height
 * (OpenStreetMap render_height), so walls and a lit roof appear — the old
 * "wireframe" look, now sharp. Buildings are grouped by height so taller ones
 * rise further.
 */
function buildings25D(): LayerSpecification[] {
  const height: ExpressionSpecification = ['coalesce', ['get', 'render_height'], 6];
  // [min metres, max metres, representative height]
  const buckets: [number, number, number][] = [
    [0, 9, 6],
    [9, 24, 16],
    [24, 48, 34],
    [48, 1000, 65],
  ];
  // Pixels per metre at Leaflet z16 (Brasília latitude), slightly exaggerated
  const PX_PER_M_Z16 = 0.43 * 1.4;
  const offset = (metres: number): ExpressionSpecification => {
    const at = (z: number) => {
      const d = metres * PX_PER_M_Z16 * Math.pow(2, z - 16);
      return [Number((d * 0.45).toFixed(2)), Number((-d).toFixed(2))];
    };
    return ['interpolate', ['exponential', 2], ['zoom'], gl(14), ['literal', at(14)], gl(18), ['literal', at(18)]] as unknown as ExpressionSpecification;
  };

  const layers: LayerSpecification[] = [
    {
      id: 'building-base',
      type: 'fill',
      source: 'omt',
      'source-layer': 'building',
      minzoom: gl(14),
      paint: { 'fill-color': '#010a14', 'fill-outline-color': '#0e7490' },
    },
  ];
  for (const [lo, hi, h] of buckets) {
    const filter = ['all', ['>', height, lo], ['<=', height, hi]] as unknown as ExpressionSpecification;
    for (const f of [1 / 3, 2 / 3]) {
      layers.push({
        id: `building-wall-${h}-${Math.round(f * 3)}`,
        type: 'fill',
        source: 'omt',
        'source-layer': 'building',
        minzoom: gl(14),
        filter,
        paint: {
          'fill-color': '#021526',
          'fill-outline-color': '#0891b2',
          'fill-translate': offset(h * f),
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], gl(14), 0.5, gl(16), 0.95],
        },
      });
    }
    layers.push({
      id: `building-roof-${h}`,
      type: 'fill',
      source: 'omt',
      'source-layer': 'building',
      minzoom: gl(14),
      filter,
      paint: {
        'fill-color': C.building,
        'fill-outline-color': C.buildingEdge,
        'fill-translate': offset(h),
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], gl(14), 0.55, gl(16), 1],
      },
    });
  }
  return layers;
}

function buildStyle(): StyleSpecification {
  const layers: LayerSpecification[] = [
    { id: 'bg', type: 'background', paint: { 'background-color': C.bg } },

    // Water: lakes (Paranoá) from z9, creeks from z11 (they look like cracks further out)
    {
      id: 'water',
      type: 'fill',
      source: 'omt',
      'source-layer': 'water',
      minzoom: gl(9),
      paint: { 'fill-color': C.water, 'fill-outline-color': C.waterEdge },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'omt',
      'source-layer': 'waterway',
      minzoom: gl(11),
      paint: { 'line-color': C.creek, 'line-width': width([11, 0.6], [16, 2]) },
    },

    // Local streets from z12
    {
      id: 'street',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: gl(12),
      filter: roadClass('minor', 'service', 'tertiary'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': C.street,
        'line-width': width([12, 0.5], [15, 3], [18, 14]),
        'line-opacity': ['interpolate', ['linear'], ['zoom'], gl(12), 0.5, gl(14), 0.9],
      },
    },
    // Arterial avenues from z10
    {
      id: 'arterial',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: gl(10),
      filter: roadClass('primary', 'secondary'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.arterial, 'line-width': width([10, 0.7], [14, 4], [18, 20]) },
    },
    // Highways (BR-040, EPTG, Eixão…) at every zoom
    {
      id: 'highway',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: roadClass('motorway', 'trunk'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.highway, 'line-width': width([8, 0.8], [12, 3], [18, 26]) },
    },
    // "Meio-fio duplo": from z14 the road centre goes dark, leaving two lit curbs
    {
      id: 'road-inner',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: gl(14),
      filter: roadClass('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.curbInner, 'line-width': width([14, 1.2], [18, 16]) },
    },

    ...buildings25D(),
  ];

  return {
    version: 8,
    sources: { omt: { type: 'vector', url: OPENFREEMAP } },
    layers,
  };
}

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Vector basemap layer; falls back to the old raster layer when WebGL is unavailable. */
export function createTacticalVectorLayer(): L.Layer {
  if (!supportsWebGL()) return createTacticalUrbanCanvasLayer();
  const layer = maplibreGL({
    style: buildStyle(),
    interactive: false,
    attributionControl: false,
  });
  // Credits required by the tile and data licences
  (layer as L.Layer & { options: L.LayerOptions }).options.attribution =
    '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · © <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a>';
  return layer;
}
