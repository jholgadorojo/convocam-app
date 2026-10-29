/**
 * Normaliza un texto para comparaciones de búsqueda:
 * sin tildes ni diacríticos, en minúsculas y sin espacios
 * en los extremos.
 *
 * Así «Lleida», « lleida » y «LLEIDA» coinciden, igual que
 * «Tècnic» y «tecnic».
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}
