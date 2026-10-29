import type { SelectionProcessMunicipalityMapPoint } from "../../selection-process/application/selection-process-municipality-map-point";
import type { UserSelectionProcessListItem } from "../application/user-selection-process-list-item";
import type { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";
import { IcgcMunicipalitiesMap } from "./icgc-municipalities-map";
import type { IcgcMunicipalityMarker } from "./icgc-municipalities-map";
import { FollowedMunicipalitiesMapZoom } from "./followed-municipalities-map-zoom";

/**
 * Mapa compartido por "Mis convocatorias" y "Para mi".
 * En "Mis convocatorias" agrupa los seguimientos del usuario.
 * En "Para mi" recibe los municipios agregados por PostgreSQL.
 * Contorno y comarcas: cartografia oficial del ICGC, cache de 30 dias.
 */
/**
 * Activacion provisional del mapa ICGC en ambas pantallas.
 * El SVG previo permanece abajo para comparar y poder revertir cambiando
 * este valor a false, sin modificar las paginas ni las reglas de negocio.
 */
const USE_ICGC_MAP = true;

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
type DeadlineFilter = "upcoming" | "expired" | "open";

type SharedProps = {
  selectedMunicipality?: string | null;
  selectedProvince?: string | null;
};

type FollowedProps = SharedProps & {
  /** Compatibilidad con "Mis convocatorias": no cambia ninguna llamada actual. */
  mode?: "followed";
  items: readonly UserSelectionProcessListItem[];
  mapPoints?: never;
  selectedStatuses?: readonly PersonalSelectionProcessStatus[];
  /** Mantiene el filtro de plazo al seleccionar o deseleccionar municipios. */
  deadlineFilter?: DeadlineFilter;
};

type ForMeProps = SharedProps & {
  mode: "for-me";
  mapPoints: readonly SelectionProcessMunicipalityMapPoint[];
  items?: never;
  selectedStatuses?: never;
  deadlineFilter?: never;
};

type Props = FollowedProps | ForMeProps;

export async function FollowedMunicipalitiesMap(props: Props) {
  const selectedMunicipality = props.selectedMunicipality ?? null;
  const selectedProvince = props.selectedProvince ?? null;
  const isForMe = props.mode === "for-me";
  const selectedStatuses = isForMe ? [] : (props.selectedStatuses ?? []);
  const deadlineFilter =
    props.mode === "for-me" ? undefined : props.deadlineFilter;
  const basePath = isForMe ? "/para-mi" : "/mis-convocatorias";
  const mapTitle = isForMe
    ? "Mapa de convocatorias para mí"
    : "Mapa de mis convocatorias";
  const mapDescription = isForMe
    ? "Municipios con convocatorias que coinciden con tu perfil."
    : "Municipios donde sigues convocatorias.";
  const { markers, missingMunicipalities } = isForMe
    ? markersFromMapPoints(props.mapPoints)
    : groupMunicipalities(props.items);
  if (USE_ICGC_MAP) {
    // Mantenemos exactamente los mismos municipios, contadores y enlaces
    // de filtrado que utilizaba el SVG. Solo cambia el motor visual.
    // En "Para mi", el enlace omite page para empezar en la pagina 1.
    // En "Mis convocatorias" conserva estados personales y filtro temporal.
    const mapMarkers: IcgcMunicipalityMarker[] = markers.map((marker) => {
      const selected =
        selectedMunicipality !== null &&
        normalizeLocation(selectedMunicipality) ===
          normalizeLocation(marker.municipality) &&
        (selectedProvince === null ||
          normalizeLocation(selectedProvince) ===
            normalizeLocation(marker.province));

      return {
        municipality: marker.municipality,
        province: marker.province,
        latitude: marker.latitude,
        longitude: marker.longitude,
        count: marker.count,
        selected,
        href: selected
          ? buildMunicipalityHref(
              null,
              null,
              selectedStatuses,
              basePath,
              deadlineFilter,
            )
          : buildMunicipalityHref(
              marker.municipality,
              marker.province,
              selectedStatuses,
              basePath,
              deadlineFilter,
            ),
      };
    });

    return (
      <section
        aria-label={mapTitle}
        className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm"
      >
        <div className="border-b border-[#EEF1F5] px-5 py-4">
          <h2 className="text-[17px] font-semibold text-[#131A2C]">
            {mapTitle}
          </h2>
          <p className="mt-1 text-sm text-[#69738A]">
            {mapDescription}
          </p>
        </div>
        <div className="p-4">
          <IcgcMunicipalitiesMap
            markers={mapMarkers}
            mode={isForMe ? "for-me" : "followed"}
            height={410}
          />
          <p className="mt-3 text-xs leading-relaxed text-[#69738A]">
            {isForMe ? (
              <>
                Pasa el cursor sobre un marcador para ver el municipio y sus
                convocatorias recomendadas. Pulsa para filtrar las tarjetas.
                El número indica cuántas coinciden con tu perfil. Pulsa de
                nuevo el marcador seleccionado para mostrar todos los municipios.
              </>
            ) : (
              <>
                Pasa el cursor sobre un marcador para ver el municipio. Pulsa
                para mostrar sus convocatorias. El número indica cuántas sigues
                allí. Pulsa de nuevo el marcador seleccionado para quitar el
                filtro territorial sin perder los filtros de estado.
              </>
            )}
          </p>
          {markers.length === 0 && (
            <p className="mt-2 text-xs text-[#69738A]">
              {isForMe
                ? "No hay coordenadas disponibles para situar las convocatorias recomendadas."
                : "No hay coordenadas disponibles para situar tus convocatorias."}
            </p>
          )}
          {missingMunicipalities > 0 && (
            <p className="mt-2 text-xs text-[#69738A]">
              {missingMunicipalities === 1
                ? "Hay 1 municipio que no se puede situar por falta de coordenadas."
                : `Hay ${missingMunicipalities} municipios que no se pueden situar por falta de coordenadas.`}
            </p>
          )}
        </div>
      </section>
    );
  }

  // Modo clasico: cartografia SVG conservada temporalmente como respaldo.
  let boundary: Coordinate[][];
  try {
    boundary = await getAdministrativeBoundaries(CATALONIA_BOUNDARY_URL);
  } catch {
    return (
      <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
        <h2 className="text-[17px] font-semibold text-[#131A2C]">
          {mapTitle}
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

  // El municipio seleccionado ya llega mediante la URL de ambas pantallas.
  // Centramos el zoom en su marcador, sin modificar los filtros existentes.
  // Si no tiene coordenadas validas, mantenemos la vista completa.
  const selectedMarker = selectedMunicipality
    ? markers.find((marker) =>
        normalizeLocation(marker.municipality) ===
          normalizeLocation(selectedMunicipality) &&
        (selectedProvince === null ||
          normalizeLocation(marker.province) ===
            normalizeLocation(selectedProvince)),
      )
    : null;
  const focusPoint = selectedMarker
    ? projection.project(selectedMarker.longitude, selectedMarker.latitude)
    : null;

  return (
    <section
      aria-label={mapTitle}
      className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm"
    >
      <div className="border-b border-[#EEF1F5] px-5 py-4">
        <h2 className="text-[17px] font-semibold text-[#131A2C]">
          {mapTitle}
        </h2>
        <p className="mt-1 text-sm text-[#69738A]">
          {mapDescription}
        </p>
      </div>
      <div className="p-4">
        <FollowedMunicipalitiesMapZoom focusPoint={focusPoint}>
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
              // "Mis convocatorias" conserva estados y filtro temporal.
              // "Para mi" filtra en /para-mi y vuelve a la pagina 1.
              const href = isSelected
                ? buildMunicipalityHref(
                    null,
                    null,
                    selectedStatuses,
                    basePath,
                    deadlineFilter,
                  )
                : buildMunicipalityHref(
                    marker.municipality,
                    marker.province,
                    selectedStatuses,
                    basePath,
                    deadlineFilter,
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
                  {/* Tooltip nativo al pasar el raton por el marcador. */}
                  <title>
                    {isForMe
                      ? `${marker.municipality}: ${marker.count} ${
                          marker.count === 1
                            ? "convocatoria recomendada"
                            : "convocatorias recomendadas"
                        }`
                      : marker.municipality}
                  </title>
                  {/*
                    El zoom amplía el SVG completo. Compensamos esa escala
                    solo en los marcadores para que su diámetro, el contador
                    y la zona pulsable mantengan un tamaño legible.
                    La variable la publica el controlador de zoom compartido.
                  */}
                  <g
                    style={{
                      transform: "scale(var(--map-marker-inverse-zoom, 1))",
                      transformOrigin: `${x}px ${y}px`,
                      transformBox: "view-box",
                    }}
                  >
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
                  </g>
                </a>
              );
            })}
          </svg>
        </FollowedMunicipalitiesMapZoom>
        <p className="mt-3 text-xs leading-relaxed text-[#69738A]">
          {isForMe ? (
            <>
              Pasa el cursor sobre un marcador para ver el municipio y sus
              convocatorias recomendadas. Pulsa para filtrar las tarjetas.
              El número indica cuántas coinciden con tu perfil. Pulsa de nuevo
              el marcador seleccionado para mostrar todos los municipios.
            </>
          ) : (
            <>
              Pasa el cursor sobre un marcador para ver el municipio. Pulsa para
              mostrar sus convocatorias. El número indica cuántas sigues allí.
              Pulsa de nuevo el marcador seleccionado para quitar el filtro
              territorial sin perder los filtros de estado.
            </>
          )}
        </p>
        {comarcaBoundariesUnavailable && (
          <p className="mt-2 text-xs text-[#69738A]">
            Los límites comarcales no están disponibles temporalmente.
            El mapa y los filtros siguen funcionando.
          </p>
        )}
        {markers.length === 0 && (
          <p className="mt-2 text-xs text-[#69738A]">
            {isForMe
              ? "No hay coordenadas disponibles para situar las convocatorias recomendadas."
              : "No hay coordenadas disponibles para situar tus convocatorias."}
          </p>
        )}
        {missingMunicipalities > 0 && (
          <p className="mt-2 text-xs text-[#69738A]">
            {missingMunicipalities === 1
              ? "Hay 1 municipio que no se puede situar por falta de coordenadas."
              : `Hay ${missingMunicipalities} municipios que no se pueden situar por falta de coordenadas.`}
          </p>
        )}
        <p className="mt-3 text-[11px] text-[#646E85]">
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
/** Los puntos de "Para mi" ya llegan agrupados y contados desde PostgreSQL. */
function markersFromMapPoints(
  points: readonly SelectionProcessMunicipalityMapPoint[],
): { markers: Marker[]; missingMunicipalities: number } {
  const markers: Marker[] = [];
  let missingMunicipalities = 0;

  for (const point of points) {
    if (!point.municipality.trim() || !Number.isFinite(point.count) || point.count <= 0) {
      continue;
    }
    if (
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude) ||
      point.latitude < CATALONIA_LIMITS.minLatitude ||
      point.latitude > CATALONIA_LIMITS.maxLatitude ||
      point.longitude < CATALONIA_LIMITS.minLongitude ||
      point.longitude > CATALONIA_LIMITS.maxLongitude
    ) {
      missingMunicipalities += 1;
      continue;
    }
    markers.push({
      municipality: point.municipality,
      province: point.province,
      count: point.count,
      latitude: point.latitude,
      longitude: point.longitude,
    });
  }

  return { markers, missingMunicipalities };
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
  basePath: "/mis-convocatorias" | "/para-mi" = "/mis-convocatorias",
  deadlineFilter?: DeadlineFilter,
): string {
  const params = new URLSearchParams();

  if (municipality?.trim()) {
    params.set("municipality", municipality.trim());
    if (province?.trim()) {
      params.set("province", province.trim());
    }
  }

  // Estos filtros solo existen en "Mis convocatorias", nunca en "Para mi".
  if (basePath === "/mis-convocatorias") {
    if (deadlineFilter === "upcoming") {
      params.set("upcomingDeadlines", "1");
    } else if (deadlineFilter === "expired") {
      params.set("expiredDeadlines", "1");
    } else if (deadlineFilter === "open") {
      params.set("openApplications", "1");
    }
  }

  // Mismo parametro repetible utilizado por el panel de indicadores.
  for (const status of selectedStatuses) {
    params.append("personalStatus", status);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
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
