import type { SelectionProcessListItem } from
  "@/modules/selection-process/application/selection-process-list-item";

/**
 * SPEC-009 - Funciones de presentación del dashboard.
 *
 * Funciones puras (sin React ni acceso a datos) que usan
 * los paneles del dashboard.
 */

/** Los enlaces de detalle son botones destacados. */
export const secondaryDetailButtonClasses =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg " +
  "border border-[#C9CEF5] bg-[#EEF0FC] px-3.5 py-2 text-sm " +
  "font-semibold text-[#3B45B5] transition-colors " +
  "hover:border-[#9FA8EC] hover:bg-[#E2E6FB] " +
  "focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]";

const calendarDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** Las fechas DATE de PostgreSQL se representan a las 00:00 UTC. */
export function formatCalendarDate(value: Date): string {
  return calendarDateFormatter.format(value);
}

/** Enlace al detalle que vuelve al dashboard con «Volver». */
export function dashboardDetailHref(selectionProcessId: number): string {
  return `/convocatorias/${selectionProcessId}?returnTo=${encodeURIComponent("/dashboard")}`;
}

/**
 * Fecha relevante de una oportunidad según su estado
 * oficial CIDO: 3 = plazo abierto, 2 = pendiente de plazo.
 */
export function getOpportunityDateText(
  item: Pick<
    SelectionProcessListItem,
    "statusId" | "applicationStartDate" | "applicationEndDate"
  >,
): string {
  if (item.statusId === 3) {
    return item.applicationEndDate
      ? `Fin del plazo: ${formatCalendarDate(item.applicationEndDate)}`
      : "Fin del plazo por confirmar";
  }
  if (item.statusId === 2) {
    return item.applicationStartDate
      ? `Inicio del plazo: ${formatCalendarDate(item.applicationStartDate)}`
      : "Inicio del plazo por confirmar";
  }
  return item.applicationEndDate
    ? `Fin del plazo: ${formatCalendarDate(item.applicationEndDate)}`
    : "Fechas por confirmar";
}

export function deadlineBadgeClasses(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return "bg-[#FDEDEC] text-[#B42318]";
  }
  if (daysRemaining <= 3) {
    return "bg-[#FFF2DF] text-[#955000]";
  }
  return "bg-[#F0F2F5] text-[#4E5870]";
}

export function deadlineBadgeLabel(daysRemaining: number): string {
  if (daysRemaining === 0) return "Finaliza hoy";
  if (daysRemaining === 1) return "Queda 1 día";
  return `Quedan ${daysRemaining} días`;
}
