import type { ApplicationPeriodPresentation } from "./selection-process-status";

/**
 * Funciones de presentación compartidas por las tarjetas y el
 * detalle de convocatoria (buscador, «Mis convocatorias»).
 */

export type ReservedPlaces = {
  disability: number | null;
  unemployed: boolean;
  youngPeople: boolean;
  women: boolean;
};

/** Indica si la convocatoria tiene alguna plaza reservada. */
export function hasReservedPlaces(reservedPlaces: ReservedPlaces): boolean {
  return (
    (reservedPlaces.disability ?? 0) > 0 ||
    reservedPlaces.unemployed ||
    reservedPlaces.youngPeople ||
    reservedPlaces.women
  );
}

/**
 * Texto del badge del plazo: añade el detalle («Quedan 5 días»,
 * «Empieza mañana») cuando el plazo está abierto o por empezar,
 * salvo el último día, cuya etiqueta ya lo dice todo.
 */
export function buildApplicationPeriodBadgeText(
  period: Pick<ApplicationPeriodPresentation, "state" | "label" | "detail">,
): string {
  if (period.state === "open" && period.label === "Finaliza hoy") {
    return period.label;
  }
  if (period.state === "open" || period.state === "future") {
    return `${period.label} · ${period.detail}`;
  }
  return period.label;
}
