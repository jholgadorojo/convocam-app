import type { UserSelectionProcessListItem } from
  "@/modules/user-selection-process/application/user-selection-process-list-item";
import type { PersonalSelectionProcessStatus } from
  "@/modules/user-selection-process/domain/personal-selection-process-status";
import { PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS } from
  "@/modules/user-selection-process/presentation/personal-selection-process-status-options";
import {
  getApplicationPeriodPresentation,
  type ApplicationPeriodPresentation,
} from "@/modules/selection-process/presentation/selection-process-status";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";
import { getCataloniaCalendarDate } from "@/shared/utils/catalonia-calendar-date";

/**
 * Funciones de presentación de «Mis convocatorias».
 *
 * Funciones puras (sin React ni acceso a datos). Las que
 * dependen de la fecha actual reciben `today` (día de
 * calendario de Catalunya a las 00:00 UTC, ver
 * getCataloniaCalendarDate).
 */

const BASE_PATH = "/mis-convocatorias";

/** Días naturales, además de hoy, que abarcan los plazos próximos. */
const UPCOMING_DEADLINE_DAYS = 15;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Filtro temporal del listado:
 * - "upcoming": vencen hoy o en los 15 días siguientes.
 * - "expired": vencieron antes de hoy.
 * - "open": solicitudes abiertas hoy.
 */
export type DeadlineFilter = "upcoming" | "expired" | "open";

export type MySelectionProcessesFilters = {
  deadlineFilter: DeadlineFilter | null;
  municipality: string | null;
  province: string | null;
  statuses: PersonalSelectionProcessStatus[];
};

export type MySelectionProcessesSearchParams = {
  municipality?: string | string[];
  province?: string | string[];
  personalStatus?: string | string[];
  upcomingDeadlines?: string | string[];
  expiredDeadlines?: string | string[];
  openApplications?: string | string[];
};

/* ============================================================
 *   FILTROS DE LA URL
 *============================================================ */

/**
 * Lee los filtros de la URL.
 *
 * Si llegan varios filtros de plazo se aplica uno solo, para
 * evitar ambigüedad: caducadas > plazos próximos > en plazo.
 * personalStatus aparece repetido cuando se seleccionan varios
 * estados; solo se aceptan los definidos en el dominio.
 */
export function parseFilters(
  params: MySelectionProcessesSearchParams,
): MySelectionProcessesFilters {
  const deadlineFilter: DeadlineFilter | null =
    params.expiredDeadlines === "1"
      ? "expired"
      : params.upcomingDeadlines === "1"
        ? "upcoming"
        : params.openApplications === "1"
          ? "open"
          : null;

  const municipality =
    typeof params.municipality === "string"
      ? params.municipality.trim() || null
      : null;
  const province =
    municipality && typeof params.province === "string"
      ? params.province.trim() || null
      : null;

  const rawStatuses =
    typeof params.personalStatus === "string"
      ? [params.personalStatus]
      : (params.personalStatus ?? []);
  const statuses = PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS
    .map((option) => option.value)
    .filter((status) => rawStatuses.includes(status));

  return { deadlineFilter, municipality, province, statuses };
}

export function hasActiveFilters(filters: MySelectionProcessesFilters): boolean {
  return (
    filters.deadlineFilter !== null ||
    filters.municipality !== null ||
    filters.statuses.length > 0
  );
}

/** URL de «Mis convocatorias» con los filtros indicados. */
export function myProcessesHref(filters: MySelectionProcessesFilters): string {
  const params = new URLSearchParams();
  if (filters.deadlineFilter === "upcoming") {
    params.set("upcomingDeadlines", "1");
  }
  if (filters.deadlineFilter === "expired") {
    params.set("expiredDeadlines", "1");
  }
  if (filters.deadlineFilter === "open") {
    params.set("openApplications", "1");
  }
  if (filters.municipality) {
    params.set("municipality", filters.municipality);
    if (filters.province) {
      params.set("province", filters.province);
    }
  }
  for (const status of filters.statuses) {
    params.append("personalStatus", status);
  }
  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

/* ============================================================
 *   APLICACIÓN DE LOS FILTROS
 *============================================================ */

type Item = UserSelectionProcessListItem;

export type FilteredMySelectionProcesses = {
  /** Indicadores de estados personales: solo filtra el municipio. */
  itemsForStatusIndicators: Item[];
  /** Mapa: filtra plazo y estados, no el municipio (para poder cambiarlo). */
  itemsForMap: Item[];
  /** Listado: cruza todos los filtros y ordena los de plazo. */
  listedItems: Item[];
  /** Resumen bajo el mapa: siempre sobre todos los seguimientos. */
  counts: {
    all: number;
    open: number;
    expired: number;
  };
};

export function applyFilters(
  items: readonly Item[],
  filters: MySelectionProcessesFilters,
  today: Date,
): FilteredMySelectionProcesses {
  const selectedStatuses = new Set(filters.statuses);

  const itemsForStatusIndicators = items.filter((item) =>
    matchesMunicipality(item, filters),
  );
  const itemsWithinDeadline = items.filter((item) =>
    matchesDeadlineFilter(item, filters.deadlineFilter, today),
  );
  const itemsForMap =
    selectedStatuses.size > 0
      ? itemsWithinDeadline.filter((item) =>
        selectedStatuses.has(item.personalStatus),
      )
      : itemsWithinDeadline;
  const listedItems = itemsForMap.filter((item) =>
    matchesMunicipality(item, filters),
  );

  // Plazos próximos: primero los más urgentes.
  // Caducadas: primero los vencimientos más recientes.
  if (
    filters.deadlineFilter === "upcoming" ||
    filters.deadlineFilter === "expired"
  ) {
    const direction = filters.deadlineFilter === "expired" ? -1 : 1;
    listedItems.sort(
      (a, b) =>
        direction *
        ((a.selectionProcess.applicationEndDate?.getTime() ?? 0) -
          (b.selectionProcess.applicationEndDate?.getTime() ?? 0)),
    );
  }

  return {
    itemsForStatusIndicators,
    itemsForMap,
    listedItems,
    counts: {
      all: items.length,
      open: items.filter(isApplicationOpen).length,
      expired: items.filter((item) => isExpired(item, today)).length,
    },
  };
}

function matchesDeadlineFilter(
  item: Item,
  deadlineFilter: DeadlineFilter | null,
  today: Date,
): boolean {
  switch (deadlineFilter) {
    case null:
      return true;
    case "open":
      return isApplicationOpen(item);
    case "expired":
      return isExpired(item, today);
    case "upcoming":
      return isUpcoming(item, today);
  }
}

/** Solicitudes abiertas hoy, con cualquier estado personal. */
function isApplicationOpen(item: Item): boolean {
  return (
    getApplicationPeriodPresentation(
      item.selectionProcess.applicationStartDate,
      item.selectionProcess.applicationEndDate,
    ).state === "open"
  );
}

/** Plazos que aún interesan: «Me interesa» o «Preparando solicitud». */
function isPendingApplication(item: Item): boolean {
  return (
    item.personalStatus === "INTERESTED" ||
    item.personalStatus === "PREPARING_APPLICATION"
  );
}

/** Pendiente de solicitar y con el plazo vencido antes de hoy. */
function isExpired(item: Item, today: Date): boolean {
  const endDate = item.selectionProcess.applicationEndDate;
  return (
    isPendingApplication(item) &&
    endDate !== null &&
    endDate.getTime() < today.getTime()
  );
}

/** Pendiente de solicitar y con el plazo venciendo hoy o en 15 días. */
function isUpcoming(item: Item, today: Date): boolean {
  const endDate = item.selectionProcess.applicationEndDate;
  if (!isPendingApplication(item) || endDate === null) {
    return false;
  }
  const lastDay = today.getTime() + UPCOMING_DEADLINE_DAYS * MILLISECONDS_PER_DAY;
  return endDate.getTime() >= today.getTime() && endDate.getTime() <= lastDay;
}

function matchesMunicipality(
  item: Item,
  filters: Pick<MySelectionProcessesFilters, "municipality" | "province">,
): boolean {
  if (!filters.municipality) {
    return true;
  }
  const institution = item.selectionProcess.institution;
  if (!institution?.municipality) {
    return false;
  }
  return (
    normalizeLocation(institution.municipality) ===
      normalizeLocation(filters.municipality) &&
    (filters.province === null ||
      normalizeLocation(institution.province ?? "") ===
        normalizeLocation(filters.province))
  );
}

function normalizeLocation(value: string): string {
  return value.trim().toLocaleLowerCase("ca-ES");
}

/* ============================================================
 *   TEXTOS DE LOS FILTROS
 *============================================================ */

/** Descripción de los filtros activos, en el orden en que se muestran. */
export function getActiveFilterLabels(
  filters: MySelectionProcessesFilters,
): string[] {
  const labels: string[] = [];
  if (filters.municipality) {
    labels.push(
      `Municipio: ${filters.municipality}` +
        (filters.province ? ` · ${filters.province}` : ""),
    );
  }
  if (filters.deadlineFilter === "upcoming") {
    labels.push(
      "Plazos próximos (hoy y 15 días siguientes) · Me interesa o Preparando solicitud",
    );
  }
  if (filters.deadlineFilter === "expired") {
    labels.push(
      "Caducadas (plazo finalizado antes de hoy) · Me interesa o Preparando solicitud",
    );
  }
  if (filters.deadlineFilter === "open") {
    labels.push("En plazo (solicitudes abiertas hoy)");
  }
  if (filters.statuses.length > 0) {
    labels.push(
      `${filters.statuses.length} ${filters.statuses.length === 1 ? "estado seleccionado" : "estados seleccionados"}`,
    );
  }
  return labels;
}

export function getRemoveDeadlineFilterLabel(
  deadlineFilter: DeadlineFilter,
): string {
  switch (deadlineFilter) {
    case "expired":
      return "Quitar filtro de caducadas";
    case "open":
      return "Quitar filtro de plazo abierto";
    case "upcoming":
      return "Quitar filtro de plazos";
  }
}

export function getEmptyListMessage(
  deadlineFilter: DeadlineFilter | null,
): string {
  switch (deadlineFilter) {
    case "expired":
      return "No tienes convocatorias con el plazo de solicitud caducado y estado «Me interesa» o «Preparando solicitud».";
    case "upcoming":
      return "No tienes solicitudes que venzan en los próximos 15 días con estado «Me interesa» o «Preparando solicitud».";
    case "open":
      return "No tienes convocatorias con el plazo de solicitud abierto hoy que coincidan con los filtros seleccionados.";
    case null:
      return "No hay convocatorias que coincidan con los filtros seleccionados.";
  }
}

/* ============================================================
 *   TARJETA
 *============================================================ */

/** Frase sobre el plazo de solicitud para la tarjeta. */
export function buildApplicationSummary(
  period: Pick<ApplicationPeriodPresentation, "state">,
  applicationStartDate: Date | null,
  applicationEndDate: Date | null,
  today: Date,
): string {
  if (period.state === "open" && applicationEndDate) {
    const days = differenceInDays(today, applicationEndDate);
    if (days === 0) {
      return "El plazo para presentar la solicitud finaliza hoy.";
    }
    if (days === 1) {
      return "Queda 1 día para presentar la solicitud.";
    }
    return `Quedan ${days} días para presentar la solicitud.`;
  }
  if (period.state === "future" && applicationStartDate) {
    const days = differenceInDays(today, applicationStartDate);
    if (days === 1) {
      return "El plazo de solicitud comienza mañana.";
    }
    return `El plazo de solicitud comienza en ${days} días.`;
  }
  if (period.state === "closed") {
    return "El plazo para presentar la solicitud ha finalizado.";
  }
  return "No hay fechas de solicitud disponibles.";
}

function differenceInDays(from: Date, to: Date): number {
  return Math.max(
    0,
    Math.round((to.getTime() - from.getTime()) / MILLISECONDS_PER_DAY),
  );
}

export function buildLocationText(
  institution: {
    municipality: string | null;
    county: string | null;
  } | null,
): string {
  if (!institution) {
    return "Ubicación no disponible";
  }
  const parts = [institution.municipality, institution.county].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Ubicación no disponible";
}

/**
 * Día de calendario en Catalunya de un instante (timestamp),
 * como dd/mm/aaaa. A diferencia de las fechas DATE, un
 * timestamp formateado en UTC puede caer en el día anterior.
 */
export function formatCataloniaDate(instant: Date): string {
  return formatCalendarDate(getCataloniaCalendarDate(instant));
}
