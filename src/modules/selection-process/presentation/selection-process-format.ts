/**
 * Formato de datos de convocatoria compartido por el buscador
 * y el detalle.
 */

/** Plazas de una plaza de plantilla; en una bolsa no aplica. */
export function formatNumberOfPositions(
  numberOfPositions: number | null,
  isJobPool: boolean,
): string {
  if (isJobPool) {
    return "—";
  }
  if (numberOfPositions !== null && numberOfPositions > 0) {
    return String(numberOfPositions);
  }
  return "Sin definir";
}

/** Municipio · comarca · provincia del organismo, omitiendo los vacíos. */
export function formatInstitutionLocation(
  institution: {
    municipality: string | null;
    county: string | null;
    province: string | null;
  } | null,
): string {
  const parts = [
    institution?.municipality,
    institution?.county,
    institution?.province,
  ].filter((value): value is string => Boolean(value));
  return parts.length > 0 ? parts.join(" · ") : "Ubicación no disponible";
}
