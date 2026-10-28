/**
 * Fecha de calendario actual en Catalunya.
 *
 * Las columnas DATE de PostgreSQL llegan desde Prisma como
 * `Date` a las 00:00 UTC. Para compararlas con «hoy» hay que
 * usar el día de calendario de Catalunya (Europe/Madrid),
 * con independencia de la zona horaria del servidor.
 */
const CATALONIA_TIME_ZONE = "Europe/Madrid";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const cataloniaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CATALONIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Devuelve el día de calendario de Catalunya en el instante
 * indicado, codificado como 00:00 UTC.
 *
 * Por ejemplo, si en Catalunya es 18/10/2026, devuelve
 * 2026-10-18T00:00:00.000Z. No es la medianoche física de
 * Catalunya, sino una fecha comparable con los campos DATE.
 */
export function getCataloniaCalendarDate(now: Date = new Date()): Date {
  const parts = cataloniaDateFormatter.formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Número de día (días desde el 01/01/1970) del día de
 * calendario actual en Catalunya.
 */
export function getCataloniaDayNumber(now: Date = new Date()): number {
  return Math.floor(
    getCataloniaCalendarDate(now).getTime() / MILLISECONDS_PER_DAY,
  );
}
