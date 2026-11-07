export const MAX_COVER_DIMENSION_PX = 3000;

export interface CoverValidationResult {
  valid: boolean;
  width: number;
  height: number;
  error?: string;
}

export function validateCoverDimensions(width: number, height: number): CoverValidationResult {
  if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
    return {
      valid: false,
      width,
      height,
      error: 'Dimensões de imagem inválidas.',
    };
  }

  if (width > MAX_COVER_DIMENSION_PX || height > MAX_COVER_DIMENSION_PX) {
    return {
      valid: false,
      width,
      height,
      error: `A imagem selecionada possui ${width}x${height} px. O tamanho máximo permitido para a capa é ${MAX_COVER_DIMENSION_PX}x${MAX_COVER_DIMENSION_PX} px.`,
    };
  }

  return {
    valid: true,
    width,
    height,
  };
}

export function formatAudioFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface BrazilLocationPreset {
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

export interface BrazilMunicipalityEntry {
  n: string;
  uf: string;
  lat: number;
  lng: number;
}

export const BRAZIL_STATE_CAPITALS: BrazilLocationPreset[] = [
  { city: 'São Paulo', state: 'SP', country: 'Brasil', lat: -23.5505, lng: -46.6333 },
  { city: 'Salvador', state: 'BA', country: 'Brasil', lat: -12.9777, lng: -38.5016 },
  { city: 'Recife', state: 'PE', country: 'Brasil', lat: -8.0476, lng: -34.877 },
  { city: 'Belém', state: 'PA', country: 'Brasil', lat: -1.4558, lng: -48.4902 },
  { city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil', lat: -22.9068, lng: -43.1729 },
  { city: 'Belo Horizonte', state: 'MG', country: 'Brasil', lat: -19.9167, lng: -43.9345 },
  { city: 'Curitiba', state: 'PR', country: 'Brasil', lat: -25.4284, lng: -49.2733 },
  { city: 'Brasília (Plano Piloto)', state: 'DF', country: 'Brasil', lat: -15.7938, lng: -47.8827 },
  { city: 'Porto Alegre', state: 'RS', country: 'Brasil', lat: -30.0346, lng: -51.2177 },
  { city: 'Manaus', state: 'AM', country: 'Brasil', lat: -3.119, lng: -60.0217 },
  { city: 'Fortaleza', state: 'CE', country: 'Brasil', lat: -3.7319, lng: -38.5267 },
  { city: 'Goiânia', state: 'GO', country: 'Brasil', lat: -16.6869, lng: -49.2648 },
  { city: 'Florianópolis', state: 'SC', country: 'Brasil', lat: -27.5954, lng: -48.548 },
  { city: 'Vitória', state: 'ES', country: 'Brasil', lat: -20.3155, lng: -40.3128 },
  { city: 'Natal', state: 'RN', country: 'Brasil', lat: -5.7945, lng: -35.211 },
  { city: 'João Pessoa', state: 'PB', country: 'Brasil', lat: -7.1195, lng: -34.845 },
  { city: 'Maceió', state: 'AL', country: 'Brasil', lat: -9.6658, lng: -35.735 },
  { city: 'Aracaju', state: 'SE', country: 'Brasil', lat: -10.9472, lng: -37.0731 },
  { city: 'Teresina', state: 'PI', country: 'Brasil', lat: -5.0919, lng: -42.8034 },
  { city: 'São Luís', state: 'MA', country: 'Brasil', lat: -2.5307, lng: -44.3068 },
  { city: 'Cuiabá', state: 'MT', country: 'Brasil', lat: -15.6014, lng: -56.0979 },
  { city: 'Campo Grande', state: 'MS', country: 'Brasil', lat: -20.4697, lng: -54.6201 },
  { city: 'Palmas', state: 'TO', country: 'Brasil', lat: -10.1844, lng: -48.3336 },
  { city: 'Porto Velho', state: 'RO', country: 'Brasil', lat: -8.7612, lng: -63.9039 },
  { city: 'Rio Branco', state: 'AC', country: 'Brasil', lat: -9.9749, lng: -67.8243 },
  { city: 'Macapá', state: 'AP', country: 'Brasil', lat: 0.0349, lng: -51.0694 },
  { city: 'Boa Vista', state: 'RR', country: 'Brasil', lat: 2.8235, lng: -60.6758 },
];

export const DF_ADMINISTRATIVE_REGIONS: BrazilMunicipalityEntry[] = [
  { n: 'Brasília (Plano Piloto)', uf: 'DF', lat: -15.7938, lng: -47.8827 },
  { n: 'Água Quente', uf: 'DF', lat: -15.9325, lng: -48.2414 },
  { n: 'Águas Claras', uf: 'DF', lat: -15.8397, lng: -48.0264 },
  { n: 'Arapoanga', uf: 'DF', lat: -15.6472, lng: -47.6258 },
  { n: 'Arniqueira', uf: 'DF', lat: -15.8622, lng: -48.0275 },
  { n: 'Brazlândia', uf: 'DF', lat: -15.6761, lng: -48.2008 },
  { n: 'Candangolândia', uf: 'DF', lat: -15.8542, lng: -47.9497 },
  { n: 'Ceilândia', uf: 'DF', lat: -15.8205, lng: -48.1132 },
  { n: 'Cruzeiro', uf: 'DF', lat: -15.7916, lng: -47.9369 },
  { n: 'Fercal', uf: 'DF', lat: -15.6019, lng: -47.8708 },
  { n: 'Gama', uf: 'DF', lat: -16.0169, lng: -48.0652 },
  { n: 'Guará', uf: 'DF', lat: -15.8242, lng: -47.9818 },
  { n: 'Itapoã', uf: 'DF', lat: -15.7483, lng: -47.7689 },
  { n: 'Jardim Botânico', uf: 'DF', lat: -15.8694, lng: -47.8019 },
  { n: 'Lago Norte', uf: 'DF', lat: -15.7369, lng: -47.8569 },
  { n: 'Lago Sul', uf: 'DF', lat: -15.8427, lng: -47.8741 },
  { n: 'Núcleo Bandeirante', uf: 'DF', lat: -15.8711, lng: -47.9681 },
  { n: 'Paranoá', uf: 'DF', lat: -15.7751, lng: -47.7797 },
  { n: 'Park Way', uf: 'DF', lat: -15.9061, lng: -47.9592 },
  { n: 'Planaltina', uf: 'DF', lat: -15.6197, lng: -47.6519 },
  { n: 'Recanto das Emas', uf: 'DF', lat: -15.9106, lng: -48.0619 },
  { n: 'Riacho Fundo', uf: 'DF', lat: -15.8825, lng: -48.0169 },
  { n: 'Riacho Fundo II', uf: 'DF', lat: -15.9044, lng: -48.0469 },
  { n: 'Samambaia', uf: 'DF', lat: -15.8767, lng: -48.0853 },
  { n: 'Santa Maria', uf: 'DF', lat: -16.0189, lng: -48.0108 },
  { n: 'São Sebastião', uf: 'DF', lat: -15.9038, lng: -47.7697 },
  { n: 'SCIA / Estrutural', uf: 'DF', lat: -15.7819, lng: -47.9942 },
  { n: 'SIA', uf: 'DF', lat: -15.8039, lng: -47.9578 },
  { n: 'Sobradinho', uf: 'DF', lat: -15.6531, lng: -47.7924 },
  { n: 'Sobradinho II', uf: 'DF', lat: -15.6375, lng: -47.8264 },
  { n: 'Sol Nascente / Pôr do Sol', uf: 'DF', lat: -15.8267, lng: -48.1464 },
  { n: 'Sudoeste / Octogonal', uf: 'DF', lat: -15.7989, lng: -47.9261 },
  { n: 'Taguatinga', uf: 'DF', lat: -15.8335, lng: -48.0566 },
  { n: 'Varjão', uf: 'DF', lat: -15.7106, lng: -47.8767 },
  { n: 'Vicente Pires', uf: 'DF', lat: -15.8031, lng: -48.0314 },
];

export function resolveBrazilCoordinates(
  city: string,
  state: string,
  lat: number,
  lng: number
): { lat: number; lng: number } {
  const isInsideBrazilBounds =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -34.0 &&
    lat <= 5.5 &&
    lng >= -74.5 &&
    lng <= -32.0 &&
    !(lat === 0 && lng === 0);

  if (isInsideBrazilBounds) {
    return { lat, lng };
  }

  const normalizedCity = city.trim().toLowerCase();
  const normalizedState = state.trim().toUpperCase();

  const byDfRa = DF_ADMINISTRATIVE_REGIONS.find(
    (ra) => ra.n.toLowerCase() === normalizedCity
  );
  if (byDfRa) {
    return { lat: byDfRa.lat, lng: byDfRa.lng };
  }

  const byCity = BRAZIL_STATE_CAPITALS.find(
    (c) =>
      c.city.toLowerCase() === normalizedCity ||
      (normalizedCity === 'brasília' && c.state === 'DF')
  );
  if (byCity) {
    return { lat: byCity.lat, lng: byCity.lng };
  }

  const byState = BRAZIL_STATE_CAPITALS.find(
    (c) => c.state.toUpperCase() === normalizedState
  );
  if (byState) {
    return { lat: byState.lat, lng: byState.lng };
  }

  return { lat: -15.7938, lng: -47.8827 };
}

export interface SpreadPinPosition {
  id: string;
  lat: number;
  lng: number;
  originLat: number;
  originLng: number;
  isDisplaced: boolean;
  clusterSize: number;
  clusterIndex: number;
}

/**
 * Prevents project pins from stacking on top of each other on the map,
 * even when 10, 20, or 50+ releases are published in the exact same city or neighborhood.
 * Uses multi-ring concentric spiral placement (6 in ring 1, 12 in ring 2, 18 in ring 3...)
 * scaled dynamically to the active zoom level (zoom 3.5 up to street/building zoom 18),
 * followed by iterative pairwise repulsion.
 */
export function spreadOverlappingProjects<
  T extends { id: string; city?: string; coordinates: { lat: number; lng: number } }
>(projects: T[], zoomLevel = 4): Map<string, SpreadPinPosition> {
  const result = new Map<string, SpreadPinPosition>();
  if (projects.length === 0) return result;

  // Pins are 44 px wide: keep ~52 px between centres, and only group pins that
  // would actually touch (~40 px), so nearby RAs keep their real positions.
  const degPerPixel = 1.40625 / Math.pow(2, Math.max(3, zoomLevel));
  const minSeparationDeg = Math.max(0.0003, Math.min(2.4, degPerPixel * 52));
  const clusterRadiusThreshold = degPerPixel * 40;

  // 1. Group projects that share the same city name or nearby base coordinates
  const clusters: { centerLat: number; centerLng: number; cityKey: string; items: T[] }[] = [];

  for (const proj of projects) {
    const lat = proj.coordinates.lat;
    const lng = proj.coordinates.lng;
    const cityKey = (proj.city || '').trim().toLowerCase();
    const existingCluster = clusters.find((c) => {
      const dist = Math.hypot(c.centerLat - lat, c.centerLng - lng);
      // Same place name groups a bit more eagerly than plain proximity
      return dist < clusterRadiusThreshold || (cityKey !== '' && c.cityKey === cityKey && dist < clusterRadiusThreshold * 2);
    });
    if (existingCluster) {
      existingCluster.items.push(proj);
      // Keep the cluster centred on the mean of its members, not on the first one
      const n = existingCluster.items.length;
      existingCluster.centerLat += (lat - existingCluster.centerLat) / n;
      existingCluster.centerLng += (lng - existingCluster.centerLng) / n;
    } else {
      clusters.push({ centerLat: lat, centerLng: lng, cityKey, items: [proj] });
    }
  }

  // 2. Place items: singletons at exact coordinates; multi-item clusters in concentric rings
  const placed: SpreadPinPosition[] = [];

  for (const cluster of clusters) {
    const count = cluster.items.length;
    if (count === 1) {
      const p = cluster.items[0];
      placed.push({
        id: p.id,
        lat: p.coordinates.lat,
        lng: p.coordinates.lng,
        originLat: p.coordinates.lat,
        originLng: p.coordinates.lng,
        isDisplaced: false,
        clusterSize: 1,
        clusterIndex: 0,
      });
    } else {
      // Multi-ring distribution: Ring 1 holds up to 6 pins, Ring 2 holds 12, Ring 3 holds 18...
      let remaining = count;
      let itemOffset = 0;
      let ringIdx = 1;

      while (remaining > 0) {
        const ringCapacity = ringIdx === 1 ? Math.min(count, 6) : Math.min(remaining, ringIdx * 6);
        const ringRadius = minSeparationDeg * (0.78 + (ringIdx - 1) * 0.92);
        const angleOffset = ringIdx % 2 === 0 ? Math.PI / ringCapacity : -Math.PI / 6;

        for (let k = 0; k < ringCapacity; k++) {
          const idx = itemOffset + k;
          const p = cluster.items[idx];
          const angle = (2 * Math.PI * k) / ringCapacity + angleOffset;
          const dLat = Math.sin(angle) * ringRadius * 0.88;
          const dLng = Math.cos(angle) * ringRadius * 1.18;

          placed.push({
            id: p.id,
            lat: Number((cluster.centerLat + dLat).toFixed(5)),
            lng: Number((cluster.centerLng + dLng).toFixed(5)),
            originLat: cluster.centerLat,
            originLng: cluster.centerLng,
            isDisplaced: true,
            clusterSize: count,
            clusterIndex: idx,
          });
        }

        remaining -= ringCapacity;
        itemOffset += ringCapacity;
        ringIdx++;
      }
    }
  }

  // 3. Final pairwise repulsion pass to guarantee no two pins from neighboring areas overlap
  const iterations = 16;
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        const dLat = b.lat - a.lat;
        const dLng = b.lng - a.lng;
        const dist = Math.hypot(dLat, dLng);

        if (dist < minSeparationDeg) {
          moved = true;
          const overlap = (minSeparationDeg - dist) / 2 + minSeparationDeg * 0.03;
          const angle = dist > 0.00001 ? Math.atan2(dLat, dLng) : (i + j + 1) * 1.1;
          const shiftLat = Math.sin(angle) * overlap;
          const shiftLng = Math.cos(angle) * overlap;

          a.lat = Number((a.lat - shiftLat).toFixed(5));
          a.lng = Number((a.lng - shiftLng).toFixed(5));
          b.lat = Number((b.lat + shiftLat).toFixed(5));
          b.lng = Number((b.lng + shiftLng).toFixed(5));

          if (Math.hypot(a.lat - a.originLat, a.lng - a.originLng) > minSeparationDeg * 0.1) {
            a.isDisplaced = true;
          }
          if (Math.hypot(b.lat - b.originLat, b.lng - b.originLng) > minSeparationDeg * 0.1) {
            b.isDisplaced = true;
          }
        }
      }
    }
    if (!moved) break;
  }

  for (const item of placed) {
    result.set(item.id, item);
  }

  return result;
}
