import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MusicProject } from '../types/music';
import {
  MapPin,
  Search,
  Play,
  Pause,
  Star,
  ArrowRight,
  Plus,
  Minus,
  RotateCcw,
  X,
  Grid,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Maximize2,
  Minimize2,
  Compass,
  Building2,
  Layers,
} from 'lucide-react';
import L from 'leaflet';
import { formatBrl } from '../utils/monetization';
import { spreadOverlappingProjects, DF_ADMINISTRATIVE_REGIONS } from '../utils/releaseValidation';
import { pinMarkup } from '../utils/pin';
import { createTacticalVectorLayer } from '../utils/tacticalVectorLayer';
import {
  REGION_BOUNDS,
  REGION_CAMERA_BOUNDS,
  REGION_MIN_ZOOM,
  REGION_CENTER,
  REGION_NAME,
  ENTORNO_CITIES,
  findRegionLocation,
  isInRegion,
  isRegionPlace,
} from '../config/region';

/** Cached per feature: is this polygon (city/RA) inside the launch region? */
function featureInRegion(feature: GeoJSON.Feature | undefined): boolean {
  if (!feature) return false;
  const props = (feature.properties ??= {}) as { __inRegion?: boolean };
  if (props.__inRegion !== undefined) return props.__inRegion;
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  const walk = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number') {
      const [lng, lat] = c as number[];
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    } else if (Array.isArray(c)) c.forEach(walk);
  };
  walk((feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon | null)?.coordinates);
  props.__inRegion = minLat <= maxLat && isInRegion((minLat + maxLat) / 2, (minLng + maxLng) / 2);
  return props.__inRegion;
}

// Outside the launch region everything is drawn dark: "em breve".
const DIM_POLY_STYLE = {
  color: '#1e293b',
  weight: 0.4,
  opacity: 0.45,
  fillColor: '#000000',
  fillOpacity: 0.5,
};


interface RegionalMapSearchProps {
  projects: MusicProject[];
  onSelectProject: (project: MusicProject) => void;
  onPlayProject: (project: MusicProject) => void;
  currentProjectId?: string;
  isPlaying: boolean;
  focusedProjectId?: string | null;
  onClearFocusedProject?: () => void;
}

const BRAZIL_STATES_METADATA: {
  sigla: string;
  name: string;
  capital: string;
  lat: number;
  lng: number;
  capLat: number;
  capLng: number;
}[] = [
  { sigla: 'AC', name: 'Acre', capital: 'Rio Branco', lat: -9.15, lng: -70.5, capLat: -9.974, capLng: -67.81 },
  { sigla: 'AL', name: 'Alagoas', capital: 'Maceió', lat: -9.65, lng: -36.45, capLat: -9.665, capLng: -35.735 },
  { sigla: 'AP', name: 'Amapá', capital: 'Macapá', lat: 1.45, lng: -51.9, capLat: 0.034, capLng: -51.066 },
  { sigla: 'AM', name: 'Amazonas', capital: 'Manaus', lat: -4.25, lng: -64.6, capLat: -3.119, capLng: -60.021 },
  { sigla: 'BA', name: 'Bahia', capital: 'Salvador', lat: -12.6, lng: -41.85, capLat: -12.977, capLng: -38.501 },
  { sigla: 'CE', name: 'Ceará', capital: 'Fortaleza', lat: -5.2, lng: -39.5, capLat: -3.731, capLng: -38.526 },
  { sigla: 'DF', name: 'Distrito Federal', capital: 'Brasília', lat: -15.75, lng: -47.75, capLat: -15.797, capLng: -47.891 },
  { sigla: 'ES', name: 'Espírito Santo', capital: 'Vitória', lat: -19.55, lng: -40.35, capLat: -20.315, capLng: -40.312 },
  { sigla: 'GO', name: 'Goiás', capital: 'Goiânia', lat: -16.15, lng: -50.45, capLat: -16.686, capLng: -49.264 },
  { sigla: 'MA', name: 'Maranhão', capital: 'São Luís', lat: -5.2, lng: -45.3, capLat: -2.53, capLng: -44.302 },
  { sigla: 'MT', name: 'Mato Grosso', capital: 'Cuiabá', lat: -12.8, lng: -55.8, capLat: -15.601, capLng: -56.097 },
  { sigla: 'MS', name: 'Mato Grosso do Sul', capital: 'Campo Grande', lat: -20.6, lng: -54.8, capLat: -20.469, capLng: -54.62 },
  { sigla: 'MG', name: 'Minas Gerais', capital: 'Belo Horizonte', lat: -18.35, lng: -44.8, capLat: -19.916, capLng: -43.934 },
  { sigla: 'PA', name: 'Pará', capital: 'Belém', lat: -4.4, lng: -52.9, capLat: -1.455, capLng: -48.49 },
  { sigla: 'PB', name: 'Paraíba', capital: 'João Pessoa', lat: -7.15, lng: -36.8, capLat: -7.119, capLng: -34.845 },
  { sigla: 'PR', name: 'Paraná', capital: 'Curitiba', lat: -24.75, lng: -51.6, capLat: -25.428, capLng: -49.273 },
  { sigla: 'PE', name: 'Pernambuco', capital: 'Recife', lat: -8.38, lng: -38.1, capLat: -8.047, capLng: -34.877 },
  { sigla: 'PI', name: 'Piauí', capital: 'Teresina', lat: -7.6, lng: -42.7, capLat: -5.091, capLng: -42.803 },
  { sigla: 'RJ', name: 'Rio de Janeiro', capital: 'Rio de Janeiro', lat: -22.2, lng: -42.4, capLat: -22.906, capLng: -43.172 },
  { sigla: 'RN', name: 'Rio Grande do Norte', capital: 'Natal', lat: -5.65, lng: -36.65, capLat: -5.794, capLng: -35.211 },
  { sigla: 'RS', name: 'Rio Grande do Sul', capital: 'Porto Alegre', lat: -29.7, lng: -53.3, capLat: -30.034, capLng: -51.217 },
  { sigla: 'RO', name: 'Rondônia', capital: 'Porto Velho', lat: -10.9, lng: -63.1, capLat: -8.761, capLng: -63.903 },
  { sigla: 'RR', name: 'Roraima', capital: 'Boa Vista', lat: 2.1, lng: -61.35, capLat: 2.823, capLng: -60.675 },
  { sigla: 'SC', name: 'Santa Catarina', capital: 'Florianópolis', lat: -27.2, lng: -50.4, capLat: -27.595, capLng: -48.548 },
  { sigla: 'SP', name: 'São Paulo', capital: 'São Paulo', lat: -22.0, lng: -48.9, capLat: -23.55, capLng: -46.633 },
  { sigla: 'SE', name: 'Sergipe', capital: 'Aracaju', lat: -10.6, lng: -37.4, capLat: -10.947, capLng: -37.073 },
  { sigla: 'TO', name: 'Tocantins', capital: 'Palmas', lat: -10.2, lng: -48.3, capLat: -10.184, capLng: -48.333 },
];

const ALL_BRAZIL_UFS = new Set(BRAZIL_STATES_METADATA.map((s) => s.sigla));

const MAJOR_INTERIOR_CITIES = [
  { name: 'Campinas', uf: 'SP', lat: -22.9099, lng: -47.0626 },
  { name: 'Santos', uf: 'SP', lat: -23.9618, lng: -46.3322 },
  { name: 'Ribeirão Preto', uf: 'SP', lat: -21.1704, lng: -47.8103 },
  { name: 'Uberlândia', uf: 'MG', lat: -18.9186, lng: -48.2772 },
  { name: 'Juiz de Fora', uf: 'MG', lat: -21.7642, lng: -43.3503 },
  { name: 'Ouro Preto', uf: 'MG', lat: -20.3856, lng: -43.5035 },
  { name: 'Niterói', uf: 'RJ', lat: -22.8832, lng: -43.1034 },
  { name: 'Londrina', uf: 'PR', lat: -23.3045, lng: -51.1696 },
  { name: 'Foz do Iguaçu', uf: 'PR', lat: -25.5163, lng: -54.5854 },
  { name: 'Joinville', uf: 'SC', lat: -26.3044, lng: -48.8464 },
  { name: 'Caxias do Sul', uf: 'RS', lat: -29.1678, lng: -51.1794 },
  { name: 'Pelotas', uf: 'RS', lat: -31.7654, lng: -52.3376 },
  { name: 'Feira de Santana', uf: 'BA', lat: -12.2664, lng: -38.9663 },
  { name: 'Ilhéus', uf: 'BA', lat: -14.7935, lng: -39.0464 },
  { name: 'Caruaru', uf: 'PE', lat: -8.2845, lng: -35.9699 },
  { name: 'Petrolina', uf: 'PE', lat: -9.3891, lng: -40.5027 },
  { name: 'Campina Grande', uf: 'PB', lat: -7.2247, lng: -35.8771 },
  { name: 'Juazeiro do Norte', uf: 'CE', lat: -7.2131, lng: -39.3151 },
  { name: 'Santarém', uf: 'PA', lat: -2.4431, lng: -54.7083 },
  { name: 'Marabá', uf: 'PA', lat: -5.3686, lng: -49.1178 },
];

const BRAZIL_CENTER: [number, number] = REGION_CENTER;

// A place with this many releases folds into one density ring while zoomed out
const DENSITY_THRESHOLD = 8;
const DENSITY_MAX_ZOOM = 11.5;
const DENSITY_DIVE_ZOOM = 13;
const DEFAULT_ZOOM = 9;

export const RegionalMapSearch: React.FC<RegionalMapSearchProps> = ({
  projects,
  onSelectProject,
  onPlayProject,
  currentProjectId,
  isPlaying,
  focusedProjectId,
  onClearFocusedProject,
}) => {
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCitiesMesh, setShowCitiesMesh] = useState<boolean>(true);
  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [hoveredSectorName, setHoveredSectorName] = useState<string | null>(null);
  const [activeStateSector, setActiveStateSector] = useState<{ sigla: string; name: string } | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: BRAZIL_CENTER[0],
    lng: BRAZIL_CENTER[1],
  });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const citiesLayerRef = useRef<L.GeoJSON | null>(null);
  const neighborhoodsLayerRef = useRef<L.GeoJSON | null>(null);
  const neighborhoodNodesRef = useRef<
    { b: string; c: string; u: string; lat: number; lng: number; t: number }[]
  >([]);
  const statesLayerRef = useRef<L.GeoJSON | null>(null);
  const stateFeatureLayersRef = useRef<Map<string, L.Layer>>(new Map());
  const labelsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Launch phase: only releases from DF + Entorno appear on the map
  const brazilProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        isInRegion(p.coordinates.lat, p.coordinates.lng, 15) ||
        isRegionPlace(p.city, p.state)
    );
  }, [projects]);

  const [activePinProject, setActivePinProject] = useState<MusicProject | null>(null);

  // Filter projects purely by user's navigation / search criteria (Zero algorithmic ranking)
  const filteredProjects = useMemo(() => {
    return brazilProjects.filter((project) => {
      if (priceFilter === 'free' && project.pricingModel !== 'free') return false;
      if (priceFilter === 'paid' && project.pricingModel === 'free') return false;

      if (selectedStateFilter === 'ENTORNO') {
        if ((project.state || '').toUpperCase() !== 'GO') return false;
      } else if (selectedStateFilter !== 'all') {
        const matchUf = (project.state || '').toUpperCase() === selectedStateFilter.toUpperCase();
        const matchCity = project.city.toLowerCase() === selectedStateFilter.toLowerCase();
        if (!matchUf && !matchCity) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = project.title.toLowerCase().includes(q);
        const matchCity = project.city.toLowerCase().includes(q);
        const matchState = project.state.toLowerCase().includes(q);
        const matchArtist = project.artistName.toLowerCase().includes(q);
        const matchGenre = project.genre.toLowerCase().includes(q);
        if (!matchTitle && !matchCity && !matchState && !matchArtist && !matchGenre) return false;
      }

      return true;
    });
  }, [brazilProjects, priceFilter, selectedStateFilter, searchQuery]);

  // Sort projects geographically (North-to-South, West-to-East) for the tactical scanner
  // so cycling through pins has zero fame/money bias
  const geographicallyOrderedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const latDiff = b.coordinates.lat - a.coordinates.lat;
      if (Math.abs(latDiff) > 0.05) return latDiff;
      return a.coordinates.lng - b.coordinates.lng;
    });
  }, [filteredProjects]);

  // Fly precisely to a project's spread coordinates at the target zoom level (prevents post-zoom pin jump)
  const flyToProjectPin = useCallback(
    (proj: MusicProject, targetZoom = 7.5) => {
      const map = mapInstanceRef.current;
      setActivePinProject(proj);
      if (!map) return;

      const finalZoom = Math.max(map.getZoom(), targetZoom);
      const spreadAtTarget = spreadOverlappingProjects(filteredProjects, finalZoom);
      const pos = spreadAtTarget.get(proj.id);
      const destLat = pos ? pos.lat : proj.coordinates.lat;
      const destLng = pos ? pos.lng : proj.coordinates.lng;

      map.flyTo([destLat, destLng], finalZoom, {
        duration: 0.85,
        easeLinearity: 0.2,
      });
    },
    [filteredProjects]
  );

  // Cycle between pins on the map (Watch Dogs / GTA target scanner)
  const handleCycleSignal = useCallback(
    (direction: 'prev' | 'next') => {
      if (geographicallyOrderedProjects.length === 0) return;
      const currentIndex = activePinProject
        ? geographicallyOrderedProjects.findIndex((p) => p.id === activePinProject.id)
        : -1;

      let nextIndex = 0;
      if (currentIndex === -1) {
        nextIndex = direction === 'next' ? 0 : geographicallyOrderedProjects.length - 1;
      } else if (direction === 'next') {
        nextIndex = (currentIndex + 1) % geographicallyOrderedProjects.length;
      } else {
        nextIndex =
          (currentIndex - 1 + geographicallyOrderedProjects.length) %
          geographicallyOrderedProjects.length;
      }

      const targetProj = geographicallyOrderedProjects[nextIndex];
      if (targetProj) {
        flyToProjectPin(targetProj, 7.5);
      }
    },
    [geographicallyOrderedProjects, activePinProject, flyToProjectPin]
  );

  // Reset to the launch region overview (DF + Entorno)
  const handleResetView = useCallback(() => {
    const map = mapInstanceRef.current;
    map?.flyToBounds(REGION_BOUNDS, { padding: [24, 24], duration: 0.9 });
    setSelectedStateFilter('all');
    setActiveStateSector(null);
    setActivePinProject(null);
  }, []);

  // Focus & fly to newly published project
  useEffect(() => {
    if (!focusedProjectId) return;
    const targetProject = projects.find((p) => p.id === focusedProjectId);
    if (targetProject) {
      setPriceFilter('all');
      setSelectedStateFilter('all');
      setSearchQuery('');
      setActivePinProject(targetProject);

      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          const targetZoom = 7.5;
          const spreadAtTarget = spreadOverlappingProjects(projects, targetZoom);
          const pos = spreadAtTarget.get(targetProject.id);
          mapInstanceRef.current.flyTo(
            [pos ? pos.lat : targetProject.coordinates.lat, pos ? pos.lng : targetProject.coordinates.lng],
            targetZoom,
            { duration: 1.0 }
          );
        }
        onClearFocusedProject?.();
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [focusedProjectId, projects, onClearFocusedProject]);

  // Keyboard navigation (GTA / Watch Dogs map hotkeys: [ / ] to cycle signals, ESC to zoom out)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        if (activePinProject) {
          setActivePinProject(null);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          handleResetView();
        }
      } else if (e.key === ']' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleCycleSignal('next');
      } else if (e.key === '[' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleCycleSignal('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePinProject, isFullscreen, handleCycleSignal, handleResetView]);

  // Invalidate map size when toggling fullscreen mode
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Initialize Pure Black Vector Map of Brazil ONLY (Watch Dogs ctOS / GTA Tactical Architecture)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isDisposed = false;
    const abortController = new AbortController();

    // Guard Leaflet Canvas prototype methods against unmounted canvas context race conditions
    const CanvasProto = (L.Canvas as unknown as { prototype: Record<string, unknown> })?.prototype;
    if (CanvasProto && !CanvasProto.__substreamSafePatched) {
      const origClear = CanvasProto._clear as ((...args: unknown[]) => unknown) | undefined;
      const origRedraw = CanvasProto._redraw as ((...args: unknown[]) => unknown) | undefined;
      const origUpdate = CanvasProto._update as ((...args: unknown[]) => unknown) | undefined;

      if (typeof origClear === 'function') {
        CanvasProto._clear = function (this: { _ctx?: CanvasRenderingContext2D; _map?: L.Map }, ...args: unknown[]) {
          if (!this._ctx || !this._map) return;
          return origClear.apply(this, args);
        };
      }
      if (typeof origRedraw === 'function') {
        CanvasProto._redraw = function (this: { _ctx?: CanvasRenderingContext2D; _map?: L.Map }, ...args: unknown[]) {
          if (!this._ctx || !this._map) return;
          return origRedraw.apply(this, args);
        };
      }
      if (typeof origUpdate === 'function') {
        CanvasProto._update = function (this: { _ctx?: CanvasRenderingContext2D; _map?: L.Map }, ...args: unknown[]) {
          if (!this._ctx || !this._map) return;
          return origUpdate.apply(this, args);
        };
      }
      CanvasProto.__substreamSafePatched = true;
    }

    const canvasRenderer = L.canvas({ padding: 0.5 });

    const map = L.map(mapContainerRef.current, {
      center: BRAZIL_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: REGION_MIN_ZOOM,
      maxZoom: 18,
      zoomSnap: 0.25,
      zoomDelta: 0.75,
      wheelPxPerZoomLevel: 90,
      zoomControl: false,
      attributionControl: true,
      renderer: canvasRenderer,
      maxBounds: REGION_CAMERA_BOUNDS,
      maxBoundsViscosity: 1.0,
    });

    mapInstanceRef.current = map;
    map.attributionControl
      .setPrefix(false)
      .addAttribution('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · IBGE');

    // 0A. Custom Tactical Urban Canvas Layer (Highways, Arterial Avenues, Streets, Quadras & 2.5D Wireframe Buildings on Pure Black)
    const tacticalUrbanCanvas = createTacticalVectorLayer();
    tacticalUrbanCanvas.addTo(map);

    // 0B. Tactical Lat/Lng Graticule Grid (Watch Dogs ctOS / GTA Radar Grid on Pure Black Canvas)
    const graticuleGroup = L.layerGroup().addTo(map);
    for (let lat = -35; lat <= 5; lat += 5) {
      L.polyline(
        [
          [lat, -78],
          [lat, -30],
        ],
        {
          color: '#1e3a8a',
          weight: 0.6,
          opacity: 0.22,
          dashArray: '4, 8',
          interactive: false,
        }
      ).addTo(graticuleGroup);
    }
    for (let lng = -75; lng <= -30; lng += 5) {
      L.polyline(
        [
          [-36, lng],
          [6, lng],
        ],
        {
          color: '#1e3a8a',
          weight: 0.6,
          opacity: 0.22,
          dashArray: '4, 8',
          interactive: false,
        }
      ).addTo(graticuleGroup);
    }

    const labelsGroup = L.layerGroup().addTo(map);
    labelsLayerGroupRef.current = labelsGroup;

    const markerGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markerGroup;

    // Helper to synchronize layer stacking & visual weights according to active zoom LOD
    const syncLayersByZoom = (z: number) => {
      if (isDisposed || mapInstanceRef.current !== map) return;

      if (citiesLayerRef.current && map.hasLayer(citiesLayerRef.current)) {
        citiesLayerRef.current.setStyle((feature) =>
          featureInRegion(feature)
            ? // Outlines hidden (cleaner map); the polygon still lights up on hover
              { color: '#38bdf8', weight: 1.1, opacity: 0, fillColor: '#020617', fillOpacity: 0 }
            : { ...DIM_POLY_STYLE, fillOpacity: z >= 7.5 ? 0.7 : DIM_POLY_STYLE.fillOpacity }
        );
      }

      if (neighborhoodsLayerRef.current) {
        if (z >= 9.0 && showCitiesMesh) {
          if (!map.hasLayer(neighborhoodsLayerRef.current)) {
            neighborhoodsLayerRef.current.addTo(map);
          }
          // Neighbourhood outlines hidden (cleaner map); they light up on hover
          neighborhoodsLayerRef.current.setStyle({
            color: '#22d3ee',
            weight: z >= 13 ? 1.4 : 1.0,
            opacity: 0,
            dashArray: '5, 5',
            fillColor: '#06b6d4',
            fillOpacity: 0.0,
          });
        } else if (map.hasLayer(neighborhoodsLayerRef.current)) {
          map.removeLayer(neighborhoodsLayerRef.current);
        }
      }

      if (statesLayerRef.current && map.hasLayer(statesLayerRef.current)) {
        statesLayerRef.current.setStyle((feature) =>
          (feature?.properties?.sigla || '').toUpperCase() === 'DF'
            ? { color: '#38bdf8', weight: 1.7, opacity: 0, fillColor: '#0284c7', fillOpacity: 0 }
            : { ...DIM_POLY_STYLE, weight: 1, opacity: 0.6, fillOpacity: z >= 7.5 ? 0.0 : 0.45 }
        );
      }

      // Critical Z-order hierarchy:
      // z < 5.5: States on top
      // 5.5 <= z < 9.5: Municipalities & 35 DF RAs on top
      // z >= 9.5: Neighborhood Divisions (Divisões de Bairros) on top
      if (z >= 9.5 && neighborhoodsLayerRef.current && map.hasLayer(neighborhoodsLayerRef.current)) {
        citiesLayerRef.current?.bringToFront();
        neighborhoodsLayerRef.current.bringToFront();
      } else if (z >= 5.5) {
        citiesLayerRef.current?.bringToFront();
      } else {
        statesLayerRef.current?.bringToFront();
      }
    };

    // 1. Load All 27 Brazilian States (UF) with Click-to-Fly Sector Navigation
    fetch('/data/brazil-states.json', { signal: abortController.signal })
      .then((res) => res.json())
      .then((statesGeoJson) => {
        if (isDisposed || mapInstanceRef.current !== map) return;

        const statesLayer = L.geoJSON(statesGeoJson, {
          style: (feature) =>
            (feature?.properties?.sigla || '').toUpperCase() === 'DF'
              ? { color: '#38bdf8', weight: 1.7, opacity: 0, fillColor: '#0284c7', fillOpacity: 0 }
              : { ...DIM_POLY_STYLE, weight: 1, opacity: 0.6, fillOpacity: 0.45 },
          onEachFeature: (feature, layer) => {
            const sigla = (feature.properties?.sigla || '').toUpperCase();
            const stateName = feature.properties?.name || sigla;
            if (sigla) {
              stateFeatureLayersRef.current.set(sigla, layer);
            }

            if (sigla !== 'DF') {
              // Outside the launch region: not interactive
              (layer as L.Path).options.interactive = false;
              return;
            }

            layer.on({
              click: (e) => {
                if (isDisposed) return;
                L.DomEvent.stopPropagation(e);
                setActivePinProject(null);
                setActiveStateSector({ sigla, name: stateName });
                const polyBounds = (layer as L.Polygon).getBounds?.();
                if (polyBounds && polyBounds.isValid()) {
                  map.flyToBounds(polyBounds, {
                    padding: [36, 36],
                    maxZoom: sigla === 'DF' ? 9.5 : 6.75,
                    duration: 0.85,
                  });
                }
              },
            });
          },
        });

        if (isDisposed || mapInstanceRef.current !== map) return;
        statesLayer.addTo(map);
        statesLayerRef.current = statesLayer;

        map.fitBounds(REGION_BOUNDS, { padding: [24, 24], animate: false });
        syncLayersByZoom(map.getZoom());
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load Brazil states GeoJSON:', err);
        }
      });

    // 2. Load All 5,487 Brazilian Municipalities & 35 DF Administrative Regions Mesh
    Promise.all([
      fetch('/data/brazil-cities.json', { signal: abortController.signal }).then((res) => res.json()),
      // Valparaíso de Goiás is missing from the national dataset (IBGE polygon)
      fetch('/data/region-extra-cities.json', { signal: abortController.signal })
        .then((res) => res.json())
        .catch(() => ({ features: [] })),
    ])
      .then(([citiesGeoJson, extraCities]) => {
        citiesGeoJson.features = [...(citiesGeoJson.features || []), ...(extraCities.features || [])];
        if (isDisposed || mapInstanceRef.current !== map) return;

        const citiesLayer = L.geoJSON(citiesGeoJson, {
          style: (feature) =>
            featureInRegion(feature)
              ? { color: '#38bdf8', weight: 1.1, opacity: 0, fillColor: '#020617', fillOpacity: 0 }
              : DIM_POLY_STYLE,
          onEachFeature: (feature, layer) => {
            const cityName = feature.properties?.n;
            if (!featureInRegion(feature)) {
              // Outside the launch region: dark, no tooltip, clicks fall through
              (layer as L.Path).options.interactive = false;
              return;
            }
            // DF RA = name in the RA list and polygon centre inside the DF rectangle
            // (tells the Planaltina RA apart from Planaltina de Goiás).
            const centre = (layer as L.Polygon).getBounds?.().getCenter();
            const insideDfBox =
              !!centre && centre.lat <= -15.49 && centre.lat >= -16.06 && centre.lng >= -48.29 && centre.lng <= -47.3;
            const isDfRa = insideDfBox && !!cityName && findRegionLocation(cityName, 'DF') !== undefined;
            const uf = isDfRa ? 'DF' : 'GO';
            layer.on({
              click: (e) => {
                if (isDisposed) return;
                L.DomEvent.stopPropagation(e);
                setActivePinProject(null);
                const polyBounds = (layer as L.Polygon).getBounds?.();
                if (polyBounds && polyBounds.isValid()) {
                  const nextZoom = map.getZoom() >= 8 ? Math.min(15.25, map.getZoom() + 2.5) : isDfRa ? 11.5 : 8.5;
                  map.flyTo(polyBounds.getCenter(), nextZoom, {
                    duration: 0.75,
                  });
                }
              },
            });
          },
        });

        if (isDisposed || mapInstanceRef.current !== map) return;
        citiesLayerRef.current = citiesLayer;
        if (showCitiesMesh) {
          citiesLayer.addTo(map);
        }
        syncLayersByZoom(map.getZoom());
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load Brazil cities mesh:', err);
        }
      });

    // 3. Load City Neighborhood Divisions (Divisões de Bairros & Setores Urbanos)
    // Bairros of DF + Entorno from OpenStreetMap (built by scripts/build-region-geodata.mjs)
    fetch('/data/region-neighborhoods.json', { signal: abortController.signal })
      .then((res) => res.json())
      .then((nbGeoJson) => {
        if (isDisposed || mapInstanceRef.current !== map) return;

        // Launch phase: only neighborhoods of DF + Entorno
        nbGeoJson.features = (nbGeoJson.features || []).filter(
          (f: GeoJSON.Feature) =>
            typeof f.properties?.lat === 'number' && isInRegion(f.properties.lat, f.properties.lng, 15)
        );
        const nodes: { b: string; c: string; u: string; lat: number; lng: number; t: number }[] = [];
        for (const feat of nbGeoJson.features || []) {
          if (feat.properties?.b && typeof feat.properties?.lat === 'number') {
            nodes.push({
              b: feat.properties.b,
              c: feat.properties.c || '',
              u: feat.properties.u || '',
              lat: feat.properties.lat,
              lng: feat.properties.lng,
              t: feat.properties.t ?? 1,
            });
          }
        }
        neighborhoodNodesRef.current = nodes;

        const nbLayer = L.geoJSON(nbGeoJson, {
          style: () => ({
            color: '#22d3ee',
            weight: 1.1,
            opacity: 0,
            dashArray: '5, 5',
            fillColor: '#06b6d4',
            fillOpacity: 0.0,
          }),
          onEachFeature: (feature, layer) => {
            const bairroName = feature.properties?.b;
            const cityName = feature.properties?.c;
            const uf = feature.properties?.u;
            layer.on({
              click: (e) => {
                if (isDisposed) return;
                L.DomEvent.stopPropagation(e);
                setActivePinProject(null);
                const polyBounds = (layer as L.Polygon).getBounds?.();
                if (polyBounds && polyBounds.isValid()) {
                  map.flyTo(polyBounds.getCenter(), Math.max(map.getZoom(), 16), {
                    duration: 0.8,
                  });
                }
              },
            });
          },
        });

        if (isDisposed || mapInstanceRef.current !== map) return;
        neighborhoodsLayerRef.current = nbLayer;
        syncLayersByZoom(map.getZoom());
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load Brazil neighborhoods mesh:', err);
        }
      });

    map.on('click', () => {
      if (isDisposed) return;
      setActivePinProject(null);
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (isDisposed) return;
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4)),
      });
    });

    map.on('moveend', () => {
      if (isDisposed || mapInstanceRef.current !== map) return;
      const center = map.getCenter();
      setCursorCoords({
        lat: Number(center.lat.toFixed(4)),
        lng: Number(center.lng.toFixed(4)),
      });
    });

    map.on('zoomend', () => {
      if (isDisposed || mapInstanceRef.current !== map) return;
      const z = map.getZoom();
      setCurrentZoom(z);
      if (z <= 4.5) {
        setActiveStateSector(null);
      }
      syncLayersByZoom(z);
    });

    const timer = setTimeout(() => {
      if (!isDisposed && mapInstanceRef.current === map) {
        map.invalidateSize();
      }
    }, 200);

    return () => {
      isDisposed = true;
      abortController.abort();
      clearTimeout(timer);
      citiesLayerRef.current = null;
      neighborhoodsLayerRef.current = null;
      statesLayerRef.current = null;
      stateFeatureLayersRef.current.clear();
      labelsLayerGroupRef.current = null;
      markersLayerGroupRef.current = null;
      try {
        map.stop();
        map.remove();
      } catch {
        // Ignore teardown errors
      }
      if (mapInstanceRef.current === map) {
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Toggle Municipal & Neighborhood Mesh visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    const citiesLayer = citiesLayerRef.current;
    const nbLayer = neighborhoodsLayerRef.current;
    if (!map || !citiesLayer) return;

    if (showCitiesMesh) {
      if (!map.hasLayer(citiesLayer)) {
        citiesLayer.addTo(map);
      }
      if (nbLayer && map.getZoom() >= 9.0 && !map.hasLayer(nbLayer)) {
        nbLayer.addTo(map);
      }
      if (map.getZoom() >= 9.5 && nbLayer) {
        citiesLayer.bringToFront();
        nbLayer.bringToFront();
      } else if (map.getZoom() >= 5.5) {
        citiesLayer.bringToFront();
      } else {
        statesLayerRef.current?.bringToFront();
      }
    } else {
      if (map.hasLayer(citiesLayer)) {
        map.removeLayer(citiesLayer);
      }
      if (nbLayer && map.hasLayer(nbLayer)) {
        map.removeLayer(nbLayer);
      }
    }
  }, [showCitiesMesh]);

  // Render State Labels, Capitals, DF Administrative Regions & City Nodes based on Zoom Level
  useEffect(() => {
    const map = mapInstanceRef.current;
    const labelsGroup = labelsLayerGroupRef.current;
    if (!map || !labelsGroup) return;

    labelsGroup.clearLayers();

    const citiesWithPins = new Set(
      filteredProjects.map((p) => p.city.trim().toLowerCase())
    );

    const CRAMPED_COASTAL_SIGLAS = new Set(['SE', 'AL', 'PB', 'RN', 'ES', 'RJ', 'DF']);

    // Hide macro state labels once zoomed deep into street/building level (zoom >= 11.5)
    if (currentZoom < 11.5) {
      BRAZIL_STATES_METADATA.forEach((st) => {
        if (currentZoom < 4.5 && CRAMPED_COASTAL_SIGLAS.has(st.sigla)) {
          return;
        }
        // When zoomed into DF (zoom >= 7.5), hide the macro state label so the 35 RAs shine clearly
        if (st.sigla === 'DF' && currentZoom >= 7.5) {
          return;
        }

        const stateLabelHtml = `
          <div class="pointer-events-none select-none flex flex-col items-center justify-center text-center">
            <span class="text-[10px] font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] ${
              currentZoom >= 6 ? 'text-athos-300/90 text-xs' : 'text-athos-400/75'
            }">
              ${currentZoom >= 6 ? st.name.toUpperCase() : st.sigla}
            </span>
          </div>
        `;

        const stateMarker = L.marker([st.lat, st.lng], {
          icon: L.divIcon({
            html: stateLabelHtml,
            className: 'custom-state-label',
            iconSize: [100, 22],
            iconAnchor: [50, 11],
          }),
          interactive: false,
        });
        stateMarker.addTo(labelsGroup);

        // Only show static capital label if zoom >= 5.25 AND there isn't already a project pin label in that capital
        if (currentZoom >= 5.25 && !citiesWithPins.has(st.capital.toLowerCase())) {
          const capHtml = `
            <div class="pointer-events-none select-none flex items-center gap-1 whitespace-nowrap">
              <div class="w-1.5 h-1.5 rounded-full bg-athos-400"></div>
              <span class="text-[10px] text-athos-200/85">${st.capital}</span>
            </div>
          `;
          const capMarker = L.marker([st.capLat, st.capLng], {
            icon: L.divIcon({
              html: capHtml,
              className: 'custom-city-dot',
              iconSize: [90, 16],
              iconAnchor: [4, 8],
            }),
            interactive: false,
          });
          capMarker.addTo(labelsGroup);
        }
      });
    }

    if (currentZoom >= 6 && currentZoom < 13) {
      MAJOR_INTERIOR_CITIES.forEach((city) => {
        if (citiesWithPins.has(city.name.toLowerCase())) return;
        const cityHtml = `
          <div class="pointer-events-none select-none flex items-center gap-1 whitespace-nowrap">
            <div class="w-1 h-1 rounded-full bg-athos-400/80"></div>
            <span class="text-[9px] text-athos-300/75">${city.name}</span>
          </div>
        `;
        const cityMarker = L.marker([city.lat, city.lng], {
          icon: L.divIcon({
            html: cityHtml,
            className: 'custom-city-dot',
            iconSize: [90, 14],
            iconAnchor: [3, 7],
          }),
          interactive: false,
        });
        cityMarker.addTo(labelsGroup);
      });
    }

    // Unified pixel-space collision avoidance across Pins, DF Administrative Regions, and City Neighborhoods (Bairros)
    if (currentZoom >= 7.5) {
      const placedLabelPoints: { x: number; y: number }[] = [];
      filteredProjects.forEach((p) => {
        const pt = map.latLngToContainerPoint([p.coordinates.lat, p.coordinates.lng]);
        placedLabelPoints.push({ x: pt.x, y: pt.y });
      });

      const minPixelDistX = currentZoom >= 13 ? 72 : 102;
      const minPixelDistY = currentZoom >= 13 ? 18 : 24;

      // 1. Brasília's 35 Regiões Administrativas (RAs)
      DF_ADMINISTRATIVE_REGIONS.forEach((ra) => {
        if (citiesWithPins.has(ra.n.toLowerCase())) return;

        const pt = map.latLngToContainerPoint([ra.lat, ra.lng]);
        const collides = placedLabelPoints.some(
          (p) => Math.abs(p.x - pt.x) < minPixelDistX && Math.abs(p.y - pt.y) < minPixelDistY
        );
        if (collides) return;
        placedLabelPoints.push({ x: pt.x, y: pt.y });

        const raHtml = `
          <div class="pointer-events-none select-none flex items-center gap-1 whitespace-nowrap">
            <div class="w-1.5 h-1.5 rounded-full bg-athos-400/90"></div>
            <span class="text-[9px] text-athos-200/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">${ra.n}</span>
          </div>
        `;
        const raMarker = L.marker([ra.lat, ra.lng], {
          icon: L.divIcon({
            html: raHtml,
            className: 'custom-city-dot',
            iconSize: [110, 14],
            iconAnchor: [4, 7],
          }),
          interactive: false,
        });
        raMarker.addTo(labelsGroup);
      });

      // 2. City Neighborhood Labels (Divisões de Bairros) at zoom >= 9.5
      // Tier 1 (bairros/setores) from z11; tier 2 (small units, e.g. each superquadra) from z14
      if (currentZoom >= 11 && neighborhoodNodesRef.current.length > 0) {
        neighborhoodNodesRef.current.forEach((nb) => {
          if (nb.t === 2 && currentZoom < 14) return;
          const b = map.getBounds().pad(0.1);
          if (!b.contains([nb.lat, nb.lng])) return;
          const pt = map.latLngToContainerPoint([nb.lat, nb.lng]);
          const collides = placedLabelPoints.some(
            (p) => Math.abs(p.x - pt.x) < minPixelDistX && Math.abs(p.y - pt.y) < minPixelDistY
          );
          if (collides) return;
          placedLabelPoints.push({ x: pt.x, y: pt.y });

          const nbHtml = `
            <div class="pointer-events-none select-none flex items-center gap-1 whitespace-nowrap">
              <span class="text-[8px] text-athos-400">◇</span>
              <span class="text-[9px] font-medium text-athos-300/95 bg-black/85 px-1.5 py-0.5 rounded border border-athos-500/40">${nb.b}</span>
            </div>
          `;
          const nbMarker = L.marker([nb.lat, nb.lng], {
            icon: L.divIcon({
              html: nbHtml,
              className: 'custom-city-dot',
              iconSize: [120, 16],
              iconAnchor: [6, 8],
            }),
            interactive: false,
          });
          nbMarker.addTo(labelsGroup);
        });
      }
    }
  }, [currentZoom, filteredProjects]);

  // Density rings: when zoomed out, a place with many releases shows ONE orbital
  // ring (no count, no artist highlighted). Clicking it dives to neighbourhood level.
  const densityGroups = useMemo(() => {
    if (currentZoom >= DENSITY_MAX_ZOOM) return [];
    const byPlace = new Map<string, MusicProject[]>();
    for (const p of filteredProjects) {
      const key = `${(p.state || '').toUpperCase()}|${p.city.trim().toLowerCase()}`;
      const list = byPlace.get(key) ?? [];
      list.push(p);
      byPlace.set(key, list);
    }
    return [...byPlace.entries()]
      .filter(([, list]) => list.length >= DENSITY_THRESHOLD)
      .map(([key, list]) => ({
        key,
        name: list[0].city,
        lat: list.reduce((a, p) => a + p.coordinates.lat, 0) / list.length,
        lng: list.reduce((a, p) => a + p.coordinates.lng, 0) / list.length,
        ids: new Set(list.map((p) => p.id)),
      }));
  }, [filteredProjects, currentZoom]);

  // Releases drawn as individual pins (everything not folded into a density ring)
  const pinProjects = useMemo(() => {
    if (densityGroups.length === 0) return filteredProjects;
    const folded = new Set(densityGroups.flatMap((g) => [...g.ids]));
    return filteredProjects.filter((p) => !folded.has(p.id));
  }, [filteredProjects, densityGroups]);

  // Compute current spread positions & multi-point area peers
  const currentSpreadMap = useMemo(
    () => spreadOverlappingProjects(pinProjects, currentZoom),
    [pinProjects, currentZoom]
  );


  // Render Interactive Audio Release Pins on the Map (Equal Visual Weight + Multi-Ring De-stacking)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Orbital density rings (same size for every place)
    densityGroups.forEach((g) => {
      // Many releases here: three pins together (same for every place)
      const tiles = `<div style="display:flex">${pinMarkup(`${g.key}-a`, 'idle', 22, 26)}${pinMarkup(`${g.key}-b`, 'idle', 22, 26)}</div><div style="display:flex;justify-content:center;margin-top:-4px">${pinMarkup(`${g.key}-c`, 'idle', 22, 26)}</div>`;
      const ringHtml = `
        <div class="relative cursor-pointer" style="width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;">
          <div>${tiles}</div>
          <div class="absolute left-1/2 -translate-x-1/2 -bottom-6 px-1.5 py-0.5 bg-black/85 text-[12px] font-bold whitespace-nowrap text-azulejo pointer-events-none">
            ${g.name}
          </div>
        </div>`;
      const ring = L.marker([g.lat, g.lng], {
        icon: L.divIcon({ html: ringHtml, className: 'custom-substream-pin', iconSize: [64, 64], iconAnchor: [32, 32] }),
        zIndexOffset: 400,
        keyboard: true,
        title: `Explorar lançamentos em ${g.name}`,
      });
      ring.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setActivePinProject(null);
        map.flyTo([g.lat, g.lng], DENSITY_DIVE_ZOOM, { duration: 0.9 });
      });
      ring.addTo(group);
    });

    pinProjects.forEach((proj) => {
      const pos = currentSpreadMap.get(proj.id) || {
        id: proj.id,
        lat: proj.coordinates.lat,
        lng: proj.coordinates.lng,
        originLat: proj.coordinates.lat,
        originLng: proj.coordinates.lng,
        isDisplaced: false,
        clusterSize: 1,
        clusterIndex: 0,
      };

      const isSelected = activePinProject?.id === proj.id;
      const isCurrentlyPlaying = currentProjectId === proj.id && isPlaying;

      // Every pin shows only its place name (same weight for everyone)
      const labelText = proj.city;

      const labelAnchorClass =
        currentZoom < 5.5 && !pos.isDisplaced
          ? 'left-11 top-1/2 -translate-y-1/2'
          : 'left-1/2 -translate-x-1/2 -bottom-6';

      const tileState = isCurrentlyPlaying ? 'playing' : isSelected ? 'selected' : 'idle';
      // Far out, place names would pile up: show them for everyone only from zoom 10.5
      const showLabel = isSelected || currentZoom >= 10.5;
      const html = `
        <div class="relative" style="width: 44px; height: 44px;">
          ${pinMarkup(proj.id, tileState, 30, 44)}
          ${
            showLabel
              ? `<div class="absolute ${labelAnchorClass} px-1.5 py-0.5 bg-black/85 text-[12px] whitespace-nowrap pointer-events-none ${
                  isSelected ? 'font-bold text-white' : 'text-azulejo/90'
                }">${labelText}</div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html,
        className: 'custom-substream-pin',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([pos.lat, pos.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 500,
        title: `${proj.city}: ${proj.title}`,
        keyboard: true,
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        // If multiple pins share this area and user is at macro zoom, zoom closer so the spiral spreads smoothly
        const targetZ = pos.clusterSize > 1 && currentZoom < 8.5 ? 8.5 : 7.5;
        flyToProjectPin(proj, targetZ);
      });

      marker.addTo(group);
    });
  }, [pinProjects, densityGroups, currentSpreadMap, activePinProject, currentProjectId, isPlaying, currentZoom, flyToProjectPin]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  // Dive directly to Real Street & 2.5D Wireframe Building Architecture level (Zoom 16)
  const handleToggleUrbanStreetZoom = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentZoom >= 14.0) {
      map.flyTo(map.getCenter(), 9.5, { duration: 0.85 });
      return;
    }

    if (activePinProject) {
      flyToProjectPin(activePinProject, 16);
      return;
    }

    if (activeStateSector) {
      const stMeta = BRAZIL_STATES_METADATA.find((s) => s.sigla === activeStateSector.sigla);
      if (stMeta) {
        map.flyTo([stMeta.capLat, stMeta.capLng], 16, { duration: 0.9 });
        return;
      }
    }

    const center = map.getCenter();
    map.flyTo([center.lat, center.lng], 16, { duration: 0.9 });
  };

  // Navigate to any of the 27 Brazilian states without highlighting any single artist
  const handleSelectStateFilter = (val: string) => {
    setSelectedStateFilter(val);
    setActivePinProject(null);

    if (val === 'all') {
      handleResetView();
      return;
    }

    if (val === 'ENTORNO') {
      setActiveStateSector(null);
      const b = L.latLngBounds(ENTORNO_CITIES.map((c) => [c.lat, c.lng] as [number, number]));
      mapInstanceRef.current?.flyToBounds(b, { padding: [36, 36], duration: 0.9 });
      return;
    }

    // A single RA or Entorno city: fly to its centre at neighbourhood level
    const place = findRegionLocation(val);
    if (place) {
      setActiveStateSector(null);
      mapInstanceRef.current?.flyTo([place.lat, place.lng], place.uf === 'DF' ? 12.5 : 12, { duration: 0.9 });
      return;
    }

    const stMeta = BRAZIL_STATES_METADATA.find((s) => s.sigla === val);
    if (stMeta) {
      setActiveStateSector({ sigla: stMeta.sigla, name: stMeta.name });
    }

    const layer = stateFeatureLayersRef.current.get(val.toUpperCase());
    const polyBounds = (layer as L.Polygon | undefined)?.getBounds?.();
    if (mapInstanceRef.current && polyBounds && polyBounds.isValid()) {
      mapInstanceRef.current.flyToBounds(polyBounds, {
        padding: [36, 36],
        maxZoom: val === 'DF' ? 10.5 : 6.75,
        duration: 0.9,
      });
    } else if (stMeta) {
      mapInstanceRef.current?.flyTo([stMeta.lat, stMeta.lng], val === 'DF' ? 10.5 : 6.25, {
        duration: 0.9,
      });
    }
  };

  const lodLevelLabel =
    currentZoom >= 14.0
      ? 'Prédios e lotes'
      : currentZoom >= 11.0
      ? 'Bairros e ruas'
      : currentZoom >= 8.5
      ? 'Cidades e rodovias'
      : currentZoom >= 6.5
      ? 'Cidades e RAs'
      : currentZoom >= 5.0
      ? 'Região'
      : 'Brasil';

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#05070a] p-3 md:p-5 flex flex-col gap-3'
          : 'space-y-3 animate-in fade-in duration-200'
      }
    >
      {/* Unified Command Bar (Hick's Law: 3 Clear Controls — Search, 27 States Navigation, Access Mode) */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-3 p-2 md:p-3 bg-black border border-athos-950/90 rounded-2xl items-center shrink-0">
        {/* 1. Search by City, State, DF RA, Artist or Genre */}
        <div className="col-span-1 md:col-span-7 relative">
          <Search className="w-4 h-4 text-athos-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar RA, artista ou estilo…"
            aria-label="Buscar por cidade, estado ou som"
            className="w-full min-h-[44px] pl-9 md:pl-10 pr-8 py-2 text-[13px] md:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-athos-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Navigate across all 27 Brazilian States (UFs) */}
        <div className="col-span-1 md:col-span-5">
          <select
            value={selectedStateFilter}
            onChange={(e) => handleSelectStateFilter(e.target.value)}
            aria-label="Filtrar por polo regional"
            className="w-full min-h-[44px] px-2.5 md:px-3.5 py-2 text-[13px] md:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-athos-500 cursor-pointer"
          >
            <option value="all">Todo o {REGION_NAME}</option>
            <option value="DF">Distrito Federal — todas as RAs</option>
            <option value="ENTORNO">Entorno (GO) — todas as cidades</option>
            <optgroup label="Regiões Administrativas do DF">
              {DF_ADMINISTRATIVE_REGIONS.map((ra) => (
                <option key={`df-${ra.n}`} value={ra.n}>
                  {ra.n}
                </option>
              ))}
            </optgroup>
            <optgroup label="Entorno (GO)">
              {ENTORNO_CITIES.map((c) => (
                <option key={`go-${c.n}`} value={c.n}>
                  {c.n}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

      </div>

      {/* Central Pure-Black Tactical Map Canvas (Watch Dogs ctOS / GTA V Inspired HUD) */}
      <div
        className={`relative w-full ${
          isFullscreen ? 'flex-1 min-h-0' : 'h-[calc(100dvh-17.5rem)] min-h-[380px] md:h-[640px]'
        } bg-black border border-athos-950/90 rounded-2xl overflow-hidden`}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full z-0 cursor-crosshair active:cursor-grabbing bg-black"
        />

        {/* Subtle Center Tactical Crosshair Reticle (Non-intrusive, pointer-events-none) */}
        {showReticle && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <div className="relative w-12 h-12 flex items-center justify-center opacity-30">
              <div className="absolute inset-0 border border-athos-400/50 rounded-full" />
              <div className="w-4 h-[1px] bg-athos-400" />
              <div className="h-4 w-[1px] bg-athos-400 absolute" />
            </div>
          </div>
        )}

        {/* Top-Left Tactical Sector Breadcrumb & Live Hover Telemetry */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4 right-16 md:right-auto z-20 flex flex-wrap items-center gap-2">
          <div className={`${activePinProject || activeStateSector ? 'flex' : 'hidden sm:flex'} items-center gap-2 px-3.5 py-2 rounded-xl bg-black/90 backdrop-blur-md border border-athos-900/60 text-xs text-athos-300 shadow-xl`}>
            <Compass className="w-3.5 h-3.5 text-athos-400 shrink-0" />
            <span>
              {activePinProject
                ? `${activePinProject.city} (${activePinProject.state})`
                : hoveredSectorName
                ? hoveredSectorName
                : activeStateSector
                ? `Setor: ${activeStateSector.name} (${activeStateSector.sigla})`
                : 'Aproxime para ver bairros, ruas e prédios'}
            </span>
          </div>

          {(activeStateSector || Math.abs(currentZoom - DEFAULT_ZOOM) > 1) && (
            <button
              onClick={handleResetView}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-athos-500/15 hover:bg-athos-500/25 border border-athos-400/50 text-xs font-semibold text-athos-300 hover:text-white transition-colors shadow-lg flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="sm:hidden">Ver tudo</span>
              <span className="hidden sm:inline">Visão DF + Entorno (ESC)</span>
            </button>
          )}
        </div>

        {/* Bottom-Left Tactical Scanner Bar: Cycle Signals Geographically + Live Zoom LOD Telemetry */}
        <div className="hidden sm:flex absolute bottom-4 left-4 z-20 items-center gap-2">
          <div className="flex items-center bg-black/90 backdrop-blur-md border border-athos-900/60 rounded-xl p-1 shadow-xl">
            <button
              onClick={() => handleCycleSignal('prev')}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg text-athos-300 hover:text-white hover:bg-athos-950/60 transition-colors"
              title="Sinal Anterior no Mapa (Tecla [ ou Seta Esquerda)"
              aria-label="Sinal Anterior no Mapa"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 text-[11px] text-athos-200 select-none">
              Explorar Sinais
            </div>
            <button
              onClick={() => handleCycleSignal('next')}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg text-athos-300 hover:text-white hover:bg-athos-950/60 transition-colors"
              title="Próximo Sinal no Mapa (Tecla ] ou Seta Direita)"
              aria-label="Próximo Sinal no Mapa"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-athos-900/40 text-[11px] text-zinc-400 tabular-nums select-none">
            <span className="text-athos-400 font-semibold">{lodLevelLabel}</span>
            <span className="mx-1.5 text-zinc-700">|</span>
            <span className="text-athos-200/80">Z:{currentZoom.toFixed(1)}x</span>
            <span className="mx-1.5 text-zinc-700">|</span>
            <span>
              {cursorCoords.lat.toFixed(3)}°, {cursorCoords.lng.toFixed(3)}°
            </span>
          </div>
        </div>

        {/* Right Ergonomic Map Controls (Fitts's Law: >= 44x44px Touch Targets) */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 flex flex-col gap-2">
          <div className="bg-black/90 backdrop-blur-md border border-athos-900/50 rounded-xl overflow-hidden shadow-xl flex flex-col">
            <button
              onClick={handleZoomIn}
              className="min-w-[44px] min-h-[44px] hover:bg-athos-950/60 text-athos-300 hover:text-white transition-colors border-b border-athos-900/40 flex items-center justify-center"
              title="Aproximar Zoom (Revelar Ruas e Prédios)"
              aria-label="Aproximar Zoom"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="min-w-[44px] min-h-[44px] hover:bg-athos-950/60 text-athos-300 hover:text-white transition-colors flex items-center justify-center"
              title="Afastar Zoom"
              aria-label="Afastar Zoom"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToggleUrbanStreetZoom}
            className={`hidden sm:flex min-w-[44px] min-h-[44px] bg-black/90 hover:bg-athos-950/60 backdrop-blur-md border rounded-xl shadow-xl transition-all items-center justify-center ${
              currentZoom >= 13.5
                ? 'border-athos-400 text-athos-300'
                : 'border-athos-900/50 text-athos-400 hover:text-white'
            }`}
            title={
              currentZoom >= 13.5
                ? 'Afastar das ruas'
                : 'Aproximar até as ruas'
            }
            aria-label="Alternar Zoom de Ruas e Prédios"
          >
            <Building2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetView}
            className="min-w-[44px] min-h-[44px] bg-black/90 hover:bg-athos-950/60 backdrop-blur-md border border-athos-900/50 rounded-xl text-athos-400 hover:text-white shadow-xl transition-all flex items-center justify-center"
            title="Recentrar no DF + Entorno (ESC)"
            aria-label="Recentrar Visão Geral do Brasil"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowCitiesMesh(!showCitiesMesh)}
            className={`hidden sm:flex min-w-[44px] min-h-[44px] bg-black/90 hover:bg-athos-950/60 backdrop-blur-md border rounded-xl shadow-xl transition-all items-center justify-center ${
              showCitiesMesh
                ? 'border-athos-500/60 text-athos-400'
                : 'border-athos-900/40 text-zinc-500'
            }`}
            title={showCitiesMesh ? 'Ocultar Malha de Municípios' : 'Mostrar Malha de Municípios'}
            aria-label="Alternar Malha de Municípios"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowReticle(!showReticle)}
            className={`hidden sm:flex min-w-[44px] min-h-[44px] bg-black/90 hover:bg-athos-950/60 backdrop-blur-md border rounded-xl shadow-xl transition-all items-center justify-center ${
              showReticle
                ? 'border-athos-500/60 text-athos-400'
                : 'border-athos-900/40 text-zinc-500'
            }`}
            title={showReticle ? 'Ocultar Mira Central' : 'Mostrar Mira Central'}
            aria-label="Alternar Mira Tática"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden sm:flex min-w-[44px] min-h-[44px] bg-black/90 hover:bg-athos-950/60 backdrop-blur-md border border-athos-900/50 rounded-xl text-athos-400 hover:text-white shadow-xl transition-all items-center justify-center"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Expandir Mapa em Tela Cheia'}
            aria-label="Alternar Tela Cheia do Mapa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Floating Project Card on Pin Click (Only Music & Evaluations — Zero Followers/Likes/Numbers) */}
        {activePinProject && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-auto md:right-4 md:w-[430px] bg-black/95 backdrop-blur-xl border border-athos-500/60 p-3 md:p-4 rounded-2xl z-30 animate-in slide-in-from-bottom-3 duration-200"
          >
            {/* Unboxed Metadata Header + Urban Zoom & Prev/Next Signal Switcher */}
            <div className="flex items-center justify-between gap-2 pb-2 md:pb-2.5 mb-2.5 md:mb-3 border-b border-zinc-800/80">
              <div className="flex flex-1 min-w-0 items-center gap-1.5 text-xs text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-athos-400 shrink-0" />
                <span className="text-zinc-100 font-semibold truncate">
                  {activePinProject.city}, {activePinProject.state || activePinProject.country}
                </span>
                <span className="hidden sm:inline truncate text-athos-300">{activePinProject.genre}</span>
              </div>

              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                <button
                  onClick={() =>
                    flyToProjectPin(activePinProject, currentZoom >= 14 ? 9.5 : 16)
                  }
                  className="min-w-[36px] sm:min-w-0 px-2 min-h-[36px] sm:min-h-[28px] flex items-center justify-center gap-1 text-[10px] font-semibold text-athos-300 bg-athos-500/10 hover:bg-athos-500/25 border border-athos-500/40 rounded-lg transition-colors whitespace-nowrap"
                  title="Aproximar para ver as ruas ao redor deste lançamento"
                  aria-label={currentZoom >= 14 ? 'Visão Bairros' : 'Ruas & Prédios'}
                >
                  <Building2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">{currentZoom >= 14 ? 'Visão Bairros' : 'Ruas & Prédios'}</span>
                </button>
                <button
                  onClick={() => handleCycleSignal('prev')}
                  className="min-w-[32px] min-h-[32px] flex items-center justify-center text-zinc-400 hover:text-athos-300 rounded-lg hover:bg-zinc-900 transition-colors"
                  title="Sinal Anterior"
                  aria-label="Sinal Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCycleSignal('next')}
                  className="min-w-[32px] min-h-[32px] flex items-center justify-center text-zinc-400 hover:text-athos-300 rounded-lg hover:bg-zinc-900 transition-colors"
                  title="Próximo Sinal"
                  aria-label="Próximo Sinal"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePinProject(null);
                  }}
                  className="min-w-[32px] min-h-[32px] flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                  aria-label="Fechar prévia do projeto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Artwork, Title & Pure Musical / Review Info */}
            <div className="flex items-center gap-3.5">
              <img
                src={activePinProject.coverArt}
                alt={activePinProject.title}
                referrerPolicy="no-referrer"
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover shrink-0 border border-zinc-800 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onSelectProject(activePinProject)}
              />
              <div className="flex-1 min-w-0">
                <h4
                  onClick={() => onSelectProject(activePinProject)}
                  className="text-base font-bold text-white hover:text-athos-300 transition-colors truncate cursor-pointer"
                >
                  {activePinProject.title}
                </h4>

                <div className="text-xs text-zinc-400 truncate mt-0.5">
                  {activePinProject.artistName}
                </div>

                {/* Only Community Evaluation Rating, Tracks & Access Mode */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 md:mt-2 text-xs tabular-nums">
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {activePinProject.stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-zinc-400">
                    {activePinProject.tracks.length}{' '}
                    {activePinProject.tracks.length === 1 ? 'faixa' : 'faixas'}
                  </span>
                  <span className="text-athos-400 font-bold whitespace-nowrap">
                    Livre para ouvir
                  </span>
                </div>
              </div>
            </div>

            {/* Primary & Secondary Actions (>= 44px height) */}
            <div className="grid grid-cols-2 gap-2 md:gap-2.5 mt-3 md:mt-4">
              <button
                onClick={() => onPlayProject(activePinProject)}
                className="min-h-[44px] flex items-center justify-center gap-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-xs font-semibold rounded-xl border border-zinc-800 transition-colors active:scale-95"
              >
                {currentProjectId === activePinProject.id && isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-athos-400" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-athos-400" />
                    <span>Ouvir</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onSelectProject(activePinProject)}
                className="min-h-[44px] flex items-center justify-center gap-2 px-3 bg-athos-600 hover:bg-athos-500 text-white text-xs font-bold rounded-xl transition-colors active:scale-95"
              >
                <span>Ver lançamento</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

