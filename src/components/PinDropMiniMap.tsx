import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { pinMarkup, type PinShape } from '../utils/pin';
import { createTacticalVectorLayer } from '../utils/tacticalVectorLayer';
import { REGION_CAMERA_BOUNDS, isInRegion } from '../config/region';

interface PinDropMiniMapProps {
  lat: number;
  lng: number;
  /** Called when the artist clicks the map or drags the pin (only inside the region). */
  onChange: (lat: number, lng: number) => void;
  /** Changes when the chosen RA/city changes, so the map recentres there. */
  focusKey: string;
  /** Sphere for releases (default), triangle for events */
  shape?: PinShape;
  /** Help line under the map */
  hint?: string;
}

const pinHtml = (shape: PinShape) => `
  <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">${pinMarkup('novo-lancamento', 'selected', 34, 36, shape)}</div>`;

/** Small map in the release form: click or drag to set the exact spot the music was made. */
export const PinDropMiniMap: React.FC<PinDropMiniMapProps> = ({ lat, lng, onChange, focusKey, shape = 'music', hint }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 14,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false,
      maxBounds: REGION_CAMERA_BOUNDS,
      maxBoundsViscosity: 1.0,
    });
    mapRef.current = map;
    createTacticalVectorLayer().addTo(map);

    const marker = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({ html: pinHtml(shape), className: '', iconSize: [36, 36], iconAnchor: [18, 18] }),
      keyboard: true,
      title: 'Arraste para o ponto exato',
    }).addTo(map);
    markerRef.current = marker;

    // Last position inside the region, to snap back if the pin is dropped outside
    let lastValid = L.latLng(lat, lng);
    const commit = (p: L.LatLng) => {
      if (!isInRegion(p.lat, p.lng)) return false;
      lastValid = p;
      onChangeRef.current(Number(p.lat.toFixed(5)), Number(p.lng.toFixed(5)));
      return true;
    };
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (commit(e.latlng)) marker.setLatLng(e.latlng);
    });
    marker.on('dragend', () => {
      if (!commit(marker.getLatLng())) marker.setLatLng(lastValid);
    });

    // The modal animates in and scrolls: recompute size whenever the box changes
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Created once; position updates are handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the pin in sync with lat/lng chosen elsewhere (RA select, "onde estou agora")
  useEffect(() => {
    markerRef.current?.setLatLng([lat, lng]);
  }, [lat, lng]);

  // New RA/city chosen: recentre the view there
  useEffect(() => {
    mapRef.current?.setView([lat, lng], 14, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  return (
    <div className="space-y-1">
      <div
        ref={containerRef}
        className="w-full h-56 rounded-xl overflow-hidden border border-zinc-800 bg-black"
        aria-label="Mini-mapa: clique ou arraste o pino até o ponto exato"
      />
      <p className="text-[11px] text-zinc-400">
        {hint ?? 'Toque no mapa ou arraste o pino até a rua ou quadra onde a música foi feita. Isso é opcional.'}
      </p>
    </div>
  );
};
