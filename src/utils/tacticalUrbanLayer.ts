import L from 'leaflet';

/**
 * Classification codes for each pixel of a real OpenStreetMap tile:
 * 0 = Land / Park / Background -> Rendered as 100% Pure Black (#000000)
 * 1 = Water (Lakes, Rivers, Ocean) -> Deep abyssal blue with glowing electric-blue shoreline
 * 2 = Highway / Arterial Avenue (Motorway, Trunk, Primary, Secondary) -> Glowing Electric-Blue dual-curb avenue
 * 3 = Local Street / Roundabout / Service Road -> Sleek dark-blue roadbed with crisp electric-blue curb lines
 * 4 = Real Building Footprint (Arquitetura Real dos Prédios) -> Dark tactical footprint + 2.5D Isometric Wireframe Extrusion
 * 5 = Neighborhood Division (Divisa de Bairro) / Street & Bairro Label -> High-contrast glowing Cyan
 */
const TYPE_LAND = 0;
const TYPE_WATER = 1;
const TYPE_HIGHWAY = 2;
const TYPE_STREET = 3;
const TYPE_BUILDING = 4;
const TYPE_LABEL_OR_BORDER = 5;

function classifyOsmPixel(r: number, g: number, b: number, z: number): number {
  // 1. Water (#aad3df and river/lake/ocean fills)
  if (b > r + 20 && g > r + 10 && b >= 145) {
    return TYPE_WATER;
  }

  // 2. Real Building Footprints (#d9d0c9, #ccb59e, #c5b8b0)
  if (
    r >= 175 &&
    r <= 223 &&
    g >= 160 &&
    g <= 213 &&
    b >= 146 &&
    b <= 204 &&
    r - b >= 12 &&
    r - b <= 48 &&
    r - g >= 5 &&
    g - b >= 4
  ) {
    return TYPE_BUILDING;
  }

  // 3. Highways & Arterial Avenues
  // Motorway (#e892a2), Trunk (#f9b29c), Primary (#fcd6a4), Secondary (#f7fabf)
  const isMotorway = r >= 205 && g >= 105 && g <= 168 && b >= 125 && b <= 185 && r - g >= 42;
  const isTrunkOrPrimary = r >= 232 && g >= 160 && g <= 226 && b >= 130 && b <= 188 && r - b >= 48;
  const isSecondary = r >= 236 && g >= 236 && b <= 212 && r - b >= 26 && Math.abs(r - g) <= 22;
  if (isMotorway || isTrunkOrPrimary || isSecondary) {
    return TYPE_HIGHWAY;
  }

  // 4. Real Local Streets, Residential Roads & Roundabouts (Clean white road fills #ffffff - #f7f7f5)
  if (r >= 246 && g >= 246 && b >= 244 && Math.abs(r - b) <= 6) {
    return TYPE_STREET;
  }

  // At medium zoom (z <= 13), local streets are thin gray lines (#cccccc - #dddddd)
  if (
    z <= 13 &&
    r >= 188 &&
    r <= 216 &&
    Math.abs(r - g) <= 4 &&
    Math.abs(g - b) <= 4
  ) {
    return TYPE_STREET;
  }

  // 5. Real Neighborhood Borders (purple/magenta admin lines) & Crisp Dark Text Labels (Bairros / Streets)
  const isAdminBorder = r >= 135 && b >= 135 && g <= 125 && r - g >= 22 && b - g >= 22;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  // Ignore colored POI icons at high zoom; keep only neutral dark typography & admin boundaries
  const isDarkNeutralText = lum < 115 && Math.abs(r - g) <= 28 && Math.abs(g - b) <= 28;
  if (isAdminBorder || isDarkNeutralText) {
    return TYPE_LABEL_OR_BORDER;
  }

  // Default: Land (#f2efe9), Residential (#e0dfdf), Parks (#c8facc), Commercial (#f2dad9) -> 100% Pure Black
  return TYPE_LAND;
}

/**
 * Creates a custom Leaflet GridLayer that fetches real OpenStreetMap cartography
 * (100% real streets, avenues, viaducts, neighborhood divisions, and real building footprints)
 * and transforms every 256x256 tile on an HTML5 Canvas into our Pure Black (#000000) +
 * Electric Blue (#38bdf8) Watch Dogs ctOS / GTA tactical aesthetic, with sleek dual-curb
 * vector-style streets and 2.5D isometric wireframe building architecture!
 */
export function createTacticalUrbanCanvasLayer(): L.Layer {
  const TacticalOsmShaderLayer = L.GridLayer.extend({
    options: {
      tileSize: 256,
      minZoom: 7,
      maxZoom: 19,
      maxNativeZoom: 18,
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: 2,
      pane: 'tilePane',
    },

    createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        setTimeout(() => done(undefined, canvas), 0);
        return canvas;
      }

      // Fill with 100% Pure Black initially
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 256, 256);

      const z = coords.z;
      const subdomains = ['a', 'b', 'c'];
      const sub = subdomains[Math.abs(coords.x + coords.y) % subdomains.length];
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, 256, 256);
          const imgData = ctx.getImageData(0, 0, 256, 256);
          const src = imgData.data;

          const outData = ctx.createImageData(256, 256);
          const dst = outData.data;

          const rawTypes = new Uint8Array(256 * 256);
          for (let i = 0, p = 0; i < src.length; i += 4, p++) {
            const t = classifyOsmPixel(src[i], src[i + 1], src[i + 2], z);
            // Level of detail: zoomed out, keep only highways + water (local streets,
            // buildings and the raster's blurry text read as noise there).
            // Water returns at z11, streets at z12, buildings and labels at z14.
            rawTypes[p] =
              (z < 12 && (t === TYPE_STREET || t === TYPE_BUILDING || t === TYPE_LABEL_OR_BORDER)) ||
              (z < 14 && (t === TYPE_BUILDING || t === TYPE_LABEL_OR_BORDER))
              || (z < 11 && t === TYPE_WATER) // thin cerrado creeks look like cracks when zoomed out
                ? TYPE_LAND
                : t;
          }

          // Pass 1.5: Morphological Despeckle Filter
          // Removes isolated 1-pixel noise from icons/halos so lines and building footprints are vector-clean
          const types = new Uint8Array(rawTypes);
          for (let y = 1; y < 255; y++) {
            const row = y * 256;
            for (let x = 1; x < 255; x++) {
              const p = row + x;
              const t = rawTypes[p];
              if (t === TYPE_BUILDING || t === TYPE_STREET || t === TYPE_HIGHWAY) {
                let sameNeighbors = 0;
                if (rawTypes[p - 1] === t) sameNeighbors++;
                if (rawTypes[p + 1] === t) sameNeighbors++;
                if (rawTypes[p - 256] === t) sameNeighbors++;
                if (rawTypes[p + 256] === t) sameNeighbors++;
                if (sameNeighbors === 0) {
                  types[p] = TYPE_LAND;
                }
              }
            }
          }

          // Pass 2: Render Pure Black base + Sleek Vector-Curb Streets, Highways, Water & Real Building Footprints
          for (let y = 0; y < 256; y++) {
            const rowOffset = y * 256;
            for (let x = 0; x < 256; x++) {
              const p = rowOffset + x;
              const idx = p * 4;
              const t = types[p];

              if (t === TYPE_LAND) {
                // 100% Pure Black (#000000)
                dst[idx] = 0;
                dst[idx + 1] = 0;
                dst[idx + 2] = 0;
                dst[idx + 3] = 255;
              } else if (t === TYPE_WATER) {
                const isShore =
                  (x > 0 && types[p - 1] !== TYPE_WATER) ||
                  (x < 255 && types[p + 1] !== TYPE_WATER) ||
                  (y > 0 && types[p - 256] !== TYPE_WATER) ||
                  (y < 255 && types[p + 256] !== TYPE_WATER);
                if (isShore) {
                  dst[idx] = 56;
                  dst[idx + 1] = 189;
                  dst[idx + 2] = 248;
                  dst[idx + 3] = 255;
                } else {
                  dst[idx] = 2;
                  dst[idx + 1] = 11;
                  dst[idx + 2] = 28;
                  dst[idx + 3] = 255;
                }
              } else if (t === TYPE_HIGHWAY) {
                // Check if highway curb edge vs highway roadbed interior (creates sleek dual-line vector look at high zoom)
                const isRoadCurb =
                  z >= 14 &&
                  ((x > 0 && types[p - 1] !== TYPE_HIGHWAY) ||
                    (x < 255 && types[p + 1] !== TYPE_HIGHWAY) ||
                    (y > 0 && types[p - 256] !== TYPE_HIGHWAY) ||
                    (y < 255 && types[p + 256] !== TYPE_HIGHWAY));
                if (isRoadCurb || z < 14) {
                  // Bright glowing cyan-blue highway line / curb
                  dst[idx] = 56;
                  dst[idx + 1] = 189;
                  dst[idx + 2] = 248;
                  dst[idx + 3] = 255;
                } else {
                  // Sleek tactical dark-blue highway roadbed
                  dst[idx] = 10;
                  dst[idx + 1] = 48;
                  dst[idx + 2] = 110;
                  dst[idx + 3] = 255;
                }
              } else if (t === TYPE_STREET) {
                // Local streets: glowing electric-blue curb edges + deep tactical roadbed interior
                const isStreetCurb =
                  z >= 15 &&
                  ((x > 0 && types[p - 1] !== TYPE_STREET) ||
                    (x < 255 && types[p + 1] !== TYPE_STREET) ||
                    (y > 0 && types[p - 256] !== TYPE_STREET) ||
                    (y < 255 && types[p + 256] !== TYPE_STREET));
                if (isStreetCurb || z < 15) {
                  dst[idx] = 37;
                  dst[idx + 1] = 115;
                  dst[idx + 2] = 240;
                  dst[idx + 3] = 255;
                } else {
                  dst[idx] = 6;
                  dst[idx + 1] = 24;
                  dst[idx + 2] = 60;
                  dst[idx + 3] = 255;
                }
              } else if (t === TYPE_BUILDING) {
                // Real Building Footprint (Arquitetura Real)
                const isWallEdge =
                  (x > 0 && types[p - 1] !== TYPE_BUILDING) ||
                  (x < 255 && types[p + 1] !== TYPE_BUILDING) ||
                  (y > 0 && types[p - 256] !== TYPE_BUILDING) ||
                  (y < 255 && types[p + 256] !== TYPE_BUILDING);

                if (isWallEdge) {
                  dst[idx] = 37;
                  dst[idx + 1] = 99;
                  dst[idx + 2] = 235;
                  dst[idx + 3] = 255;
                } else {
                  dst[idx] = 4;
                  dst[idx + 1] = 18;
                  dst[idx + 2] = 46;
                  dst[idx + 3] = 255;
                }
              } else if (t === TYPE_LABEL_OR_BORDER) {
                // Street names, Neighborhood (Bairro) names & Suburb borders
                const lum = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
                const intensity = Math.min(1, Math.max(0.4, (135 - lum) / 95));
                dst[idx] = Math.round(125 * intensity);
                dst[idx + 1] = Math.round(211 * intensity);
                dst[idx + 2] = Math.round(252 * intensity);
                dst[idx + 3] = 255;
              }
            }
          }

          // Pass 3: Real 2.5D Isometric Wireframe Building Extrusion (at Zoom >= 14)
          // Projects every real OpenStreetMap building's footprint upward-left by (dx, dy)
          // to create genuine 2.5D wireframe roofs & vertical pillars matching the real architecture!
          if (z >= 14) {
            const dx = z >= 17 ? 6 : z >= 16 ? 5 : 4;
            const dy = z >= 17 ? 8 : z >= 16 ? 7 : 5;

            // Step 3A: Extruded 2.5D rooftop translucent surface fill
            for (let y = dy; y < 256; y++) {
              const srcRow = y * 256;
              const roofRow = (y - dy) * 256;
              for (let x = dx; x < 256; x++) {
                const pBase = srcRow + x;
                if (types[pBase] !== TYPE_BUILDING) continue;

                const pRoof = roofRow + (x - dx);
                const roofIdx = pRoof * 4;
                dst[roofIdx] = Math.min(255, Math.round(dst[roofIdx] * 0.4 + 10));
                dst[roofIdx + 1] = Math.min(255, Math.round(dst[roofIdx + 1] * 0.4 + 52));
                dst[roofIdx + 2] = Math.min(255, Math.round(dst[roofIdx + 2] * 0.4 + 115));
                dst[roofIdx + 3] = 255;
              }
            }

            // Step 3B: Crisp glowing cyan 2.5D roofline wireframe & corner vertical pillars
            for (let y = dy; y < 256; y++) {
              const srcRow = y * 256;
              const roofRow = (y - dy) * 256;
              for (let x = dx; x < 256; x++) {
                const pBase = srcRow + x;
                if (types[pBase] !== TYPE_BUILDING) continue;

                const isLeftEdge = x > 0 && types[pBase - 1] !== TYPE_BUILDING;
                const isRightEdge = x < 255 && types[pBase + 1] !== TYPE_BUILDING;
                const isTopEdge = y > 0 && types[pBase - 256] !== TYPE_BUILDING;
                const isBottomEdge = y < 255 && types[pBase + 256] !== TYPE_BUILDING;

                if (isLeftEdge || isRightEdge || isTopEdge || isBottomEdge) {
                  const pRoof = roofRow + (x - dx);
                  const roofIdx = pRoof * 4;
                  // Bright glowing cyan 2.5D roof outline (#7dd3fc)
                  dst[roofIdx] = 125;
                  dst[roofIdx + 1] = 211;
                  dst[roofIdx + 2] = 252;
                  dst[roofIdx + 3] = 255;

                  // At building corners, draw the diagonal 2.5D wireframe pillar connecting base to roof
                  if ((isLeftEdge || isRightEdge) && (isTopEdge || isBottomEdge)) {
                    for (let step = 1; step < dy; step++) {
                      const px = x - Math.round((step * dx) / dy);
                      const py = y - step;
                      if (px >= 0 && px < 256 && py >= 0 && py < 256) {
                        const pillarIdx = (py * 256 + px) * 4;
                        dst[pillarIdx] = 56;
                        dst[pillarIdx + 1] = 189;
                        dst[pillarIdx + 2] = 248;
                        dst[pillarIdx + 3] = 255;
                      }
                    }
                  }
                }
              }
            }
          }

          ctx.putImageData(outData, 0, 0);
        } catch {
          // Fallback cleanly if needed
        }
        done(undefined, canvas);
      };

      img.onerror = () => {
        done(undefined, canvas);
      };

      img.src = `https://${sub}.tile.openstreetmap.org/${z}/${coords.x}/${coords.y}.png`;
      return canvas;
    },
  });

  return new (TacticalOsmShaderLayer as unknown as { new (): L.Layer })();
}
