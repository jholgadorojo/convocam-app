import type { UserSelectionProcessListItem } from "../application/user-selection-process-list-item";
import type { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";
import { FollowedMunicipalitiesMapZoom } from "./followed-municipalities-map-zoom";

/**
 * Mapa de los municipios con convocatorias seguidas.
 * Contorno de Catalunya y comarcas: cartografia oficial del ICGC.
 * Datos descargados en servidor con cache de 30 dias.
 */
const CATALONIA_BOUNDARY_URL =
  "https://maps.icgc.cat/vector01/rest/services/divisions_administratives_wms/MapServer/23/query";

const COMARCAL_BOUNDARY_URL =
  "https://maps.icgc.cat/vector01/rest/services/divisions_administratives_wms/MapServer/9/query";
const MAP_WIDTH = 620;
const MAP_HEIGHT = 500;
const MAP_PADDING = 32;
const LONGITUDE_FACTOR = Math.cos((41.7 * Math.PI) / 180);
const CATALONIA_LIMITS = {
  minLatitude: 40.4,
  maxLatitude: 43.0,
  minLongitude: 0,
  maxLongitude: 3.5,
};
type Coordinate = [longitude: number, latitude: number];
type Marker = {
  municipality: string;
  province: string;
  count: number;
  latitude: number;
  longitude: number;
};
type GroupedMunicipality = {
  municipality: string;
  province: string;
  count: number;
  latitudeSum: number;
  longitudeSum: number;
  coordinatesCount: number;
};
type MapProjection = {
  project: (longitude: number, latitude: number) => { x: number; y: number };
};
type Props = {
  items: readonly UserSelectionProcessListItem[];
  selectedMunicipality?: string | null;
  selectedProvince?: string | null;
  selectedStatuses?: readonly PersonalSelectionProcessStatus[];
};
export async function FollowedMunicipalitiesMap({
  items,
  selectedMunicipality = null,
  selectedProvince = null,
  selectedStatuses = [],
}: Props) {
  const { markers, missingMunicipalities } = groupMunicipalities(items);
  let boundary: Coordinate[][];
  try {
    boundary = await getAdministrativeBoundaries(CATALONIA_BOUNDARY_URL);
  } catch {
    return (
      <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
        <h2 className="text-[17px] font-semibold text-[#131A2C]">
          Mapa de mis convocatorias
        </h2>
        <p className="mt-3 text-sm text-[#69738A]">
          No se ha podido cargar el mapa de Catalunya. Las convocatorias
          siguen disponibles en el listado.
        </p>
      </section>
    );
  }
  // La capa comarcal es opcional: si falla, conservamos el mapa y sus filtros.
  let comarcaBoundaries: Coordinate[][] = [];
  let comarcaBoundariesUnavailable = false;
  try {
    comarcaBoundaries = await getAdministrativeBoundaries(COMARCAL_BOUNDARY_URL);
  } catch {
    comarcaBoundariesUnavailable = true;
  }

  const projection = createProjection(boundary);
  const boundaryPath = buildPolygonPath(boundary, projection);
  const comarcaPath = buildPolygonPath(comarcaBoundaries, projection);
  return (
    <section
      aria-label="Mapa de mis convocatorias"
      className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm"
    >
      <div className="border-b border-[#EEF1F5] px-5 py-4">
        <h2 className="text-[17px] font-semibold text-[#131A2C]">
          Mapa de mis convocatorias
        </h2>
        <p className="mt-1 text-sm text-[#69738A]">
          Municipios donde sigues convocatorias.
        </p>
      </div>
      <div className="p-4">
        <FollowedMunicipalitiesMapZoom>
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            role="group"
            aria-label="Mapa de Catalunya con marcadores para filtrar las convocatorias por municipio"
            className="h-auto w-full"
          >
            <defs>
              <linearGradient id="followed-map-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#EAF0FD" />
                <stop offset="100%" stopColor="#DCE5F8" />
              </linearGradient>
            </defs>
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#F9FBFF" />
            <path
              d={boundaryPath}
              fill="url(#followed-map-fill)"
              fillRule="evenodd"
            />
            {comarcaPath && (
              <path
                d={comarcaPath}
                fill="none"
                stroke="#ACBCD6"
                strokeWidth="1.15"
                strokeLinejoin="round"
                opacity="0.9"
                pointerEvents="none"
              />
            )}
            <path
              d={boundaryPath}
              fill="none"
              stroke="#8FA7D0"
              strokeWidth="1.7"
              strokeLinejoin="round"
              pointerEvents="none"
            />
            {markers.map((marker) => {
              const { x, y } = projection.project(
                marker.longitude,
                marker.latitude,
              );
              const radius = marker.count >= 100 ? 17 : 14;
              const isSelected =
                selectedMunicipality !== null &&
                normalizeLocation(selectedMunicipality) ===
                  normalizeLocation(marker.municipality) &&
                (selectedProvince === null ||
                  normalizeLocation(selectedProvince) ===
                    normalizeLocation(marker.province));
              // Al activar o quitar el filtro territorial, se conservan
              // los estados personales seleccionados en la URL.
              const href = isSelected
                ? buildMunicipalityHref(null, null, selectedStatuses)
                : buildMunicipalityHref(
                    marker.municipality,
                    marker.province,
                    selectedStatuses,
                  );
              return (
                <a
                  key={`${marker.municipality}-${marker.province}`}
                  href={href}
                  aria-current={isSelected ? "true" : undefined}
                  aria-label={
                    isSelected
                      ? `Quitar el filtro de ${marker.municipality} y ver todos los municipios`
                      : `Ver ${marker.count} ${
                          marker.count === 1 ? "convocatoria" : "convocatorias"
                        } de ${marker.municipality}`
                  }
                  className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]"
                >
                  {/* El navegador muestra el municipio al pasar el ratón. */}
                  <title>{marker.municipality}</title>
                  {/* Zona transparente que facilita pulsar el marcador. */}
                  <circle cx={x} cy={y} r={radius + 12} fill="transparent" />
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + 6}
                    fill="#4F5BD5"
                    opacity={isSelected ? "0.35" : "0.15"}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={isSelected ? "#25358F" : "#4F5BD5"}
                    stroke={isSelected ? "#15245F" : "#FFFFFF"}
                    strokeWidth={isSelected ? "3" : "2.5"}
                  />
                  <text
                    x={x}
                    y={y + 0.5}
                    fill="#FFFFFF"
                    fontSize={marker.count >= 100 ? 12 : 14}
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {marker.count}
                  </text>
                </a>
              );
            })}
          </svg>
        </FollowedMunicipalitiesMapZoom>
        <p className="mt-3 text-xs leading-relaxed text-[#69738A]">
          Pasa el cursor sobre un marcador para ver el municipio. Pulsa para
          mostrar sus convocatorias. El número indica cuántas sigues allí.
          Pulsa de nuevo el marcador seleccionado para quitar el filtro
          territorial sin perder los filtros de estado.
        </p>
        {comarcaBoundariesUnavailable && (
          <p className="mt-2 text-xs text-[#69738A]">
            Los límites comarcales no están disponibles temporalmente.
            El mapa y los filtros siguen funcionando.
          </p>
        )}
        {markers.length === 0 && (
          <p className="mt-2 text-xs text-[#69738A]">
            No hay coordenadas disponibles para situar tus convocatorias.
          </p>
        )}
        {missingMunicipalities > 0 && (
          <p className="mt-2 text-xs text-[#69738A]">
            {missingMunicipalities === 1
              ? "Hay 1 municipio que no se puede situar por falta de coordenadas."
              : `Hay ${missingMunicipalities} municipios que no se pueden situar por falta de coordenadas.`}
          </p>
        )}
        <p className="mt-3 text-[11px] text-[#8A93A7]">
          Cartografía: {" "}
          <a
            href="https://www.icgc.cat/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-[#4F5BD5]"
          >
            ICGC
          </a>
          . Ubicaciones aproximadas según la institución.
        </p>
      </div>
    </section>
  );
}
function groupMunicipalities(items: readonly UserSelectionProcessListItem[]): {
  markers: Marker[];
  missingMunicipalities: number;
} {
  const groups = new Map<string, GroupedMunicipality>();
  for (const item of items) {
    const institution = item.selectionProcess.institution;
    const municipality = institution?.municipality?.trim();
    if (!municipality) continue;
    const province = institution?.province?.trim() ?? "";
    const key = `${municipality.toLocaleLowerCase("ca-ES")}::${province.toLocaleLowerCase("ca-ES")}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        municipality,
        province,
        count: 0,
        latitudeSum: 0,
        longitudeSum: 0,
        coordinatesCount: 0,
      };
      groups.set(key, group);
    }
    group.count += 1;
    const latitude = institution?.latitude;
    const longitude = institution?.longitude;
    if (
      latitude != null &&
      longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= CATALONIA_LIMITS.minLatitude &&
      latitude <= CATALONIA_LIMITS.maxLatitude &&
      longitude >= CATALONIA_LIMITS.minLongitude &&
      longitude <= CATALONIA_LIMITS.maxLongitude
    ) {
      group.latitudeSum += latitude;
      group.longitudeSum += longitude;
      group.coordinatesCount += 1;
    }
  }
  const markers: Marker[] = [];
  let missingMunicipalities = 0;
  for (const group of groups.values()) {
    if (group.coordinatesCount === 0) {
      missingMunicipalities += 1;
      continue;
    }
    markers.push({
      municipality: group.municipality,
      province: group.province,
      count: group.count,
      latitude: group.latitudeSum / group.coordinatesCount,
      longitude: group.longitudeSum / group.coordinatesCount,
    });
  }
  return { markers, missingMunicipalities };
}
function normalizeLocation(value: string): string {
  return value.trim().toLocaleLowerCase("ca-ES");
}
function buildMunicipalityHref(
  municipality: string | null,
  province: string | null,
  selectedStatuses: readonly PersonalSelectionProcessStatus[],
): string {
  const params = new URLSearchParams();

  if (municipality?.trim()) {
    params.set("municipality", municipality.trim());
    if (province?.trim()) {
      params.set("province", province.trim());
    }
  }

  // Mismo parametro repetible utilizado por el panel de indicadores.
  for (const status of selectedStatuses) {
    params.append("personalStatus", status);
  }

  const query = params.toString();
  return query ? `/mis-convocatorias?${query}` : "/mis-convocatorias";
}
async function getAdministrativeBoundaries(sourceUrl: string): Promise<Coordinate[][]> {
  const url = new URL(sourceUrl);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", "OBJECTID");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("maxAllowableOffset", "0.005");
  url.searchParams.set("geometryPrecision", "4");
  url.searchParams.set("f", "geojson");
  const response = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!response.ok) throw new Error("No se ha podido consultar la cartografia ICGC");
  const data = (await response.json()) as {
    features?: Array<{
      geometry?: { type?: string; coordinates?: unknown } | null;
    }>;
  };
  const rings: Coordinate[][] = [];
  for (const feature of data.features ?? []) {
    const geometry = feature.geometry;
    if (!geometry || !Array.isArray(geometry.coordinates)) continue;
    if (geometry.type === "Polygon") {
      addPolygonRings(geometry.coordinates, rings);
    } else if (geometry.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates) {
        addPolygonRings(polygon, rings);
      }
    }
  }
  if (rings.length === 0) throw new Error("No hay geometria disponible");
  return rings;
}
function addPolygonRings(polygon: unknown, rings: Coordinate[][]): void {
  if (!Array.isArray(polygon)) return;
  for (const ring of polygon) {
    if (!Array.isArray(ring)) continue;
    const coordinates: Coordinate[] = [];
    for (const point of ring) {
      if (
        Array.isArray(point) &&
        typeof point[0] === "number" &&
        typeof point[1] === "number" &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
      ) {
        coordinates.push([point[0], point[1]]);
      }
    }
    if (coordinates.length >= 3) rings.push(coordinates);
  }
}
function buildPolygonPath(rings: Coordinate[][], projection: MapProjection): string {
  return rings
    .map((ring) =>
      ring
        .map(([longitude, latitude], index) => {
          const { x, y } = projection.project(longitude, latitude);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ") + " Z",
    )
    .join(" ");
}

function createProjection(rings: Coordinate[][]): MapProjection {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const ring of rings) {
    for (const [longitude, latitude] of ring) {
      const x = longitude * LONGITUDE_FACTOR;
      const y = -latitude;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const width = maxX - minX;
  const height = maxY - minY;
  const scale = Math.min(
    (MAP_WIDTH - MAP_PADDING * 2) / width,
    (MAP_HEIGHT - MAP_PADDING * 2) / height,
  );
  const offsetX = (MAP_WIDTH - width * scale) / 2;
  const offsetY = (MAP_HEIGHT - height * scale) / 2;
  return {
    project: (longitude: number, latitude: number) => ({
      x: offsetX + (longitude * LONGITUDE_FACTOR - minX) * scale,
      y: offsetY + (-latitude - minY) * scale,
    }),
  };
}
