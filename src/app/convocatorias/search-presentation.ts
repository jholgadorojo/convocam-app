import type {
  SelectionProcessFilterOption,
  SelectionProcessFilterOptions,
} from "@/modules/selection-process/application/selection-process-filter-options";
import type { SelectionProcessMunicipalityMapPoint } from
  "@/modules/selection-process/application/selection-process-municipality-map-point";
import {
  resolveSelectionProcessSort,
  type SelectionProcessApplicationPeriodFilter,
  type SelectionProcessSearchFilters,
  type SelectionProcessSort,
} from "@/modules/selection-process/application/selection-process-search-filters";
import type { SelectionProcessResultsView } from
  "@/modules/selection-process/presentation/selection-process-results-view-toggle";
import type { IcgcMunicipalityMarker } from
  "@/modules/user-selection-process/presentation/icgc-municipalities-map";
import { parsePositiveId } from "@/shared/presentation/parse-positive-id";

/**
 * Funciones de presentación del buscador de convocatorias.
 *
 * Funciones puras (sin React ni acceso a datos): leen los
 * parámetros de la URL, construyen los filtros de la consulta
 * y las URL que conservan la búsqueda.
 */

export type SearchParams = {
  q?: string;
  page?: string;
  view?: string;
  sort?: string;
  qualificationGroup?: string | string[];
  isJobPool?: string | string[];
  statusId?: string | string[];
  statusFilterApplied?: string;
  applicationPeriod?: string;
  province?: string;
  county?: string;
  municipality?: string;
  radiusKm?: string;
  scopeId?: string;
  selectionSystemId?: string;
  personnelTypeId?: string;
  applicationEndDateFrom?: string;
  applicationEndDateTo?: string;
  reservedDisability?: string;
  reservedUnemployed?: string;
  reservedYoung?: string;
  reservedWomen?: string;
};

/** Filtros tal como se muestran en el formulario y viajan en la URL. */
export type CurrentFilterState = {
  sort: SelectionProcessSort;
  qualificationGroups: string[];
  /** "false" = plazas de plantilla, "true" = bolsas de trabajo. */
  jobPoolValues: string[];
  statusIds: number[];
  applicationPeriod?: SelectionProcessApplicationPeriodFilter;
  province?: string;
  county?: string;
  municipality?: string;
  radiusKm?: number;
  scopeId?: number;
  selectionSystemId?: number;
  personnelTypeId?: number;
  /** aaaa-mm-dd, tal como llega del campo de fecha. */
  applicationEndDateFrom?: string;
  applicationEndDateTo?: string;
  reservedDisability: boolean;
  reservedUnemployed: boolean;
  reservedYoung: boolean;
  reservedWomen: boolean;
};

export type ParsedSearch = {
  query: string;
  view: SelectionProcessResultsView;
  page: number;
  filters: CurrentFilterState;
};

export const RADIUS_KM_OPTIONS = [5, 10, 25, 50, 100] as const;

export const APPLICATION_PERIOD_OPTIONS: {
  value: SelectionProcessApplicationPeriodFilter;
  label: string;
}[] = [
  { value: "open", label: "Abierto ahora" },
  { value: "future", label: "Próximo a abrir" },
  { value: "closed", label: "Finalizado" },
  { value: "unknown", label: "Sin fechas disponibles" },
];

const SORT_VALUES: SelectionProcessSort[] = [
  "relevance",
  "publication-desc",
  "deadline-asc",
  "deadline-desc",
  "municipality-asc",
];

const APPLICATION_PERIOD_VALUES: SelectionProcessApplicationPeriodFilter[] = [
  "open",
  "future",
  "closed",
  "unknown",
];

// Estados oficiales CIDO marcados por defecto: los que aún admiten solicitud.
const DEFAULT_STATUS_NAMES = ["pendent de termini", "termini obert"];

/* ============================================================
 *   LECTURA DE LA URL
 *============================================================ */

/**
 * Lee y valida los parámetros del buscador.
 *
 * - Sin `statusId` ni `statusFilterApplied` se marcan los estados
 *   «Pendent de termini» y «Termini obert»; si el usuario ya ha
 *   enviado el formulario se respeta su selección, aunque esté vacía.
 * - El radio solo se aplica si hay municipio.
 * - La ordenación por relevancia solo tiene sentido con texto.
 */
export function parseSearchParams(
  params: SearchParams,
  statuses: SelectionProcessFilterOption[],
): ParsedSearch {
  const query = params.q?.trim() ?? "";
  const municipality = cleanString(params.municipality);

  const selectedStatusIds =
    params.statusId !== undefined || params.statusFilterApplied === "1"
      ? unique(
        toArray(params.statusId)
          .map(parsePositiveInteger)
          .filter((value): value is number => value !== undefined),
      )
      : statuses
        .filter((status) =>
          DEFAULT_STATUS_NAMES.includes(
            status.name.trim().toLocaleLowerCase("ca-ES"),
          ),
        )
        .map((status) => status.id);

  return {
    query,
    // El listado es la vista predeterminada.
    view: params.view === "map" ? "map" : "list",
    page: parsePositiveInteger(params.page) ?? 1,
    filters: {
      sort: resolveSelectionProcessSort(parseSort(params.sort), Boolean(query)),
      qualificationGroups: unique(
        toArray(params.qualificationGroup)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
      jobPoolValues: unique(
        toArray(params.isJobPool).filter(
          (value) => value === "true" || value === "false",
        ),
      ),
      statusIds: selectedStatusIds,
      applicationPeriod: APPLICATION_PERIOD_VALUES.find(
        (value) => value === params.applicationPeriod,
      ),
      province: cleanString(params.province),
      county: cleanString(params.county),
      municipality,
      radiusKm: municipality ? parseRadiusKm(params.radiusKm) : undefined,
      scopeId: parsePositiveInteger(params.scopeId),
      selectionSystemId: parsePositiveInteger(params.selectionSystemId),
      personnelTypeId: parsePositiveInteger(params.personnelTypeId),
      applicationEndDateFrom: cleanString(params.applicationEndDateFrom),
      applicationEndDateTo: cleanString(params.applicationEndDateTo),
      reservedDisability: params.reservedDisability === "true",
      reservedUnemployed: params.reservedUnemployed === "true",
      reservedYoung: params.reservedYoung === "true",
      reservedWomen: params.reservedWomen === "true",
    },
  };
}

/* ============================================================
 *   FILTROS DE LA CONSULTA
 *============================================================ */

/**
 * Filtros para PostgreSQL. Los mismos para el listado y los
 * municipios del mapa, así ambos muestran las mismas coincidencias.
 */
export function toSearchFilters(
  query: string,
  filters: CurrentFilterState,
): SelectionProcessSearchFilters {
  return {
    sort: filters.sort,
    text: query || undefined,
    qualificationGroup:
      filters.qualificationGroups.length > 0
        ? filters.qualificationGroups
        : undefined,
    isJobPool: getJobPoolFilter(filters.jobPoolValues),
    statusId: filters.statusIds.length > 0 ? filters.statusIds : undefined,
    applicationPeriod: filters.applicationPeriod,
    province: filters.province,
    county: filters.county,
    municipality: filters.municipality,
    radiusKm: filters.radiusKm,
    scopeId: filters.scopeId,
    selectionSystemId: filters.selectionSystemId,
    personnelTypeId: filters.personnelTypeId,
    applicationEndDateFrom: parseDate(filters.applicationEndDateFrom),
    applicationEndDateTo: parseDate(filters.applicationEndDateTo),
    reservedDisability: filters.reservedDisability || undefined,
    reservedUnemployed: filters.reservedUnemployed || undefined,
    reservedYoung: filters.reservedYoung || undefined,
    reservedWomen: filters.reservedWomen || undefined,
  };
}

/** Marcar plaza y bolsa a la vez (o ninguna) equivale a no filtrar. */
function getJobPoolFilter(jobPoolValues: string[]): boolean | undefined {
  const hasRegularPositions = jobPoolValues.includes("false");
  const hasJobPools = jobPoolValues.includes("true");
  return hasRegularPositions === hasJobPools ? undefined : hasJobPools;
}

/* ============================================================
 *   URLS
 *============================================================ */

export function buildPageHref(
  page: number,
  query: string,
  filters: CurrentFilterState,
  view: SelectionProcessResultsView = "list",
): string {
  const params = new URLSearchParams();
  if (view === "map") {
    params.set("view", "map");
  }
  if (query) {
    params.set("q", query);
  }
  appendFiltersToParams(params, filters);
  params.set("page", String(page));
  return `/convocatorias?${params.toString()}`;
}

/**
 * Clave del formulario de filtros: cambia con la búsqueda para
 * que React lo vuelva a montar con los valores de la URL.
 */
export function buildFilterFormKey(
  query: string,
  page: number,
  filters: CurrentFilterState,
): string {
  return JSON.stringify({ query, page, ...filters });
}

function appendFiltersToParams(
  params: URLSearchParams,
  filters: CurrentFilterState,
): void {
  params.set("sort", filters.sort);
  for (const group of filters.qualificationGroups) {
    params.append("qualificationGroup", group);
  }
  for (const value of filters.jobPoolValues) {
    params.append("isJobPool", value);
  }
  params.set("statusFilterApplied", "1");
  for (const statusId of filters.statusIds) {
    params.append("statusId", String(statusId));
  }
  const optionalValues: [string, string | number | undefined][] = [
    ["applicationPeriod", filters.applicationPeriod],
    ["province", filters.province],
    ["county", filters.county],
    ["municipality", filters.municipality],
    ["radiusKm", filters.radiusKm],
    ["scopeId", filters.scopeId],
    ["selectionSystemId", filters.selectionSystemId],
    ["personnelTypeId", filters.personnelTypeId],
    ["applicationEndDateFrom", filters.applicationEndDateFrom],
    ["applicationEndDateTo", filters.applicationEndDateTo],
  ];
  for (const [name, value] of optionalValues) {
    if (value !== undefined && value !== "") {
      params.set(name, String(value));
    }
  }
  const reservations: [string, boolean][] = [
    ["reservedDisability", filters.reservedDisability],
    ["reservedUnemployed", filters.reservedUnemployed],
    ["reservedYoung", filters.reservedYoung],
    ["reservedWomen", filters.reservedWomen],
  ];
  for (const [name, checked] of reservations) {
    if (checked) {
      params.set(name, "true");
    }
  }
}

/* ============================================================
 *   FILTROS ACTIVOS
 *============================================================ */

/** Un filtro aplicado, con la URL que lo quita. */
export type ActiveFilterChip = {
  key: string;
  label: string;
  removeHref: string;
};

const RESERVATION_LABELS: [
  "reservedDisability" | "reservedUnemployed" | "reservedYoung" | "reservedWomen",
  string,
][] = [
  ["reservedDisability", "Personas con discapacidad"],
  ["reservedUnemployed", "Personas desempleadas"],
  ["reservedYoung", "Jóvenes"],
  ["reservedWomen", "Mujeres"],
];

/**
 * Filtros aplicados (texto incluido, ordenación no), cada uno con
 * un enlace que lo quita conservando el resto y la vista. Quitar un
 * territorio quita también los que dependen de él (comarca,
 * municipio y radio).
 */
export function getActiveFilterChips(
  query: string,
  filters: CurrentFilterState,
  filterOptions: Pick<
    SelectionProcessFilterOptions,
    "statuses" | "scopes" | "selectionSystems" | "personnelTypes"
  >,
  view: SelectionProcessResultsView,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const add = (
    key: string,
    label: string,
    changes: Partial<CurrentFilterState>,
    nextQuery = query,
  ) => {
    chips.push({
      key,
      label,
      removeHref: buildPageHref(1, nextQuery, { ...filters, ...changes }, view),
    });
  };

  if (query) {
    add("q", `«${query}»`, {}, "");
  }
  for (const value of filters.jobPoolValues) {
    add(
      `isJobPool-${value}`,
      value === "true" ? "Bolsa de trabajo" : "Plazas de plantilla",
      { jobPoolValues: filters.jobPoolValues.filter((item) => item !== value) },
    );
  }
  for (const statusId of filters.statusIds) {
    add(
      `statusId-${statusId}`,
      findOptionName(filterOptions.statuses, statusId),
      { statusIds: filters.statusIds.filter((item) => item !== statusId) },
    );
  }
  if (filters.applicationPeriod) {
    const period = APPLICATION_PERIOD_OPTIONS.find(
      (option) => option.value === filters.applicationPeriod,
    );
    add("applicationPeriod", `Plazo: ${period?.label ?? ""}`.trim(), {
      applicationPeriod: undefined,
    });
  }
  if (filters.province) {
    add("province", filters.province, {
      province: undefined,
      county: undefined,
      municipality: undefined,
      radiusKm: undefined,
    });
  }
  if (filters.county) {
    add("county", filters.county, {
      county: undefined,
      municipality: undefined,
      radiusKm: undefined,
    });
  }
  if (filters.municipality) {
    add("municipality", filters.municipality, {
      municipality: undefined,
      radiusKm: undefined,
    });
  }
  if (filters.radiusKm !== undefined) {
    add("radiusKm", `Hasta ${filters.radiusKm} km`, { radiusKm: undefined });
  }
  for (const group of filters.qualificationGroups) {
    add(`qualificationGroup-${group}`, `Grupo ${group}`, {
      qualificationGroups: filters.qualificationGroups.filter((item) => item !== group),
    });
  }
  if (filters.scopeId !== undefined) {
    add("scopeId", findOptionName(filterOptions.scopes, filters.scopeId), {
      scopeId: undefined,
    });
  }
  if (filters.selectionSystemId !== undefined) {
    add(
      "selectionSystemId",
      findOptionName(filterOptions.selectionSystems, filters.selectionSystemId),
      { selectionSystemId: undefined },
    );
  }
  if (filters.personnelTypeId !== undefined) {
    add(
      "personnelTypeId",
      findOptionName(filterOptions.personnelTypes, filters.personnelTypeId),
      { personnelTypeId: undefined },
    );
  }
  if (filters.applicationEndDateFrom) {
    add(
      "applicationEndDateFrom",
      `Fin del plazo desde ${formatDateInput(filters.applicationEndDateFrom)}`,
      { applicationEndDateFrom: undefined },
    );
  }
  if (filters.applicationEndDateTo) {
    add(
      "applicationEndDateTo",
      `Fin del plazo hasta ${formatDateInput(filters.applicationEndDateTo)}`,
      { applicationEndDateTo: undefined },
    );
  }
  for (const [name, label] of RESERVATION_LABELS) {
    if (filters[name]) {
      add(name, `Reserva: ${label}`, { [name]: false });
    }
  }
  return chips;
}

/**
 * Filtros activos del bloque «Más filtros» del panel (ámbito,
 * sistema, tipo de personal, plazo de solicitud y reservas). Si hay alguno,
 * el bloque se muestra abierto.
 */
export function countAdvancedActiveFilters(filters: CurrentFilterState): number {
  return [
    filters.scopeId !== undefined,
    filters.selectionSystemId !== undefined,
    filters.personnelTypeId !== undefined,
    filters.applicationPeriod !== undefined,
    filters.reservedDisability,
    filters.reservedUnemployed,
    filters.reservedYoung,
    filters.reservedWomen,
  ].filter(Boolean).length;
}

function findOptionName(
  options: readonly SelectionProcessFilterOption[],
  id: number,
): string {
  return options.find((option) => option.id === id)?.name.trim() ?? String(id);
}

/** aaaa-mm-dd → dd/mm/aaaa; cualquier otro valor se muestra tal cual. */
function formatDateInput(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

/* ============================================================
 *   MAPA
 *============================================================ */

/**
 * Marcadores del mapa. Cada uno abre el listado filtrado por su
 * municipio: se conserva el resto de filtros, pero se limpian la
 * comarca y el radio para que el filtro territorial anterior no
 * excluya el municipio elegido.
 */
export function buildMapMarkers(
  points: readonly SelectionProcessMunicipalityMapPoint[],
  query: string,
  filters: CurrentFilterState,
): IcgcMunicipalityMarker[] {
  return points.map((point) => ({
    municipality: point.municipality,
    province: point.province,
    latitude: point.latitude,
    longitude: point.longitude,
    count: point.count,
    selected: Boolean(
      filters.municipality &&
        sameName(point.municipality, filters.municipality) &&
        (!filters.province || sameName(point.province, filters.province)),
    ),
    href: buildPageHref(
      1,
      query,
      {
        ...filters,
        province: point.province || undefined,
        county: undefined,
        municipality: point.municipality,
        radiusKm: undefined,
      },
      "list",
    ),
  }));
}

function sameName(first: string, second: string): boolean {
  return first.toLocaleLowerCase("ca-ES") === second.toLocaleLowerCase("ca-ES");
}

/* ============================================================
 *   AUXILIARES
 *============================================================ */

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function cleanString(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  return parsePositiveId(value) ?? undefined;
}

function parseRadiusKm(value: string | undefined): number | undefined {
  const radius = Number(value);
  return RADIUS_KM_OPTIONS.find((option) => option === radius);
}

function parseSort(value: string | undefined): SelectionProcessSort | undefined {
  return SORT_VALUES.find((sort) => sort === value);
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
