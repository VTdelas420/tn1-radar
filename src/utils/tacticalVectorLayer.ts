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
const FONTS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

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
  label: '#7dd3fc',
};

/** Line width that grows with zoom: [leafletZoom, px] pairs. */
const width = (...stops: [number, number][]): ExpressionSpecification =>
  ['interpolate', ['exponential', 1.6], ['zoom'], ...stops.flatMap(([z, w]) => [gl(z), w])] as ExpressionSpecification;

const roadClass = (...classes: string[]): ExpressionSpecification =>
  ['match', ['get', 'class'], classes, true, false] as ExpressionSpecification;

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

    // Buildings from z14: dark footprint with cyan edge
    {
      id: 'building',
      type: 'fill',
      source: 'omt',
      'source-layer': 'building',
      minzoom: gl(14),
      paint: {
        'fill-color': C.building,
        'fill-outline-color': C.buildingEdge,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], gl(14), 0.4, gl(16), 0.9],
      },
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

    // Street names from z15
    {
      id: 'street-name',
      type: 'symbol',
      source: 'omt',
      'source-layer': 'transportation_name',
      minzoom: gl(15),
      layout: {
        'symbol-placement': 'line',
        'text-field': ['coalesce', ['get', 'name:pt'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'text-max-angle': 30,
      },
      paint: { 'text-color': C.label, 'text-halo-color': '#000000', 'text-halo-width': 1.4 },
    },
  ];

  return {
    version: 8,
    glyphs: FONTS,
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
