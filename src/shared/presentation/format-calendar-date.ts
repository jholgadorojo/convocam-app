const calendarDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Formatea una fecha de calendario como dd/mm/aaaa.
 *
 * Las fechas DATE de PostgreSQL se representan a las 00:00 UTC,
 * por eso se formatean en UTC: así no cambian de día según la
 * zona horaria del servidor.
 *
 * Si la fecha puede faltar, se pasa el texto que se muestra
 * en su lugar.
 */
export function formatCalendarDate(value: Date): string;
export function formatCalendarDate(
  value: Date | null,
  emptyText: string,
): string;
export function formatCalendarDate(
  value: Date | null,
  emptyText = "",
): string {
  return value ? calendarDateFormatter.format(value) : emptyText;
}
