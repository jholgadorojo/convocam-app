
/**
 * Validación de identificadores numéricos recibidos desde
 * la URL o desde formularios.
 *
 * Las claves de la base de datos son `Int` de PostgreSQL
 * (máximo 2.147.483.647). Comprobar solo Number.isInteger
 * no basta: "99999999999" o "1e20" son enteros para
 * JavaScript, pero Prisma lanza un error al consultarlos
 * y la página acaba en un 500 en lugar de un 404.
 */
export const MAX_DATABASE_ID = 2_147_483_647;

/**
 * Comprueba que un número sea un identificador válido.
 */
export function isPositiveId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_DATABASE_ID
  );
}

/**
 * Convierte un texto en identificador. Solo admite dígitos
 * (sin notación científica, signos ni decimales) y devuelve
 * null si el valor no es válido o está fuera de rango.
 */
export function parsePositiveId(value: unknown): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d{1,10}$/.test(trimmed)) {
    return null;
  }

  const id = Number(trimmed);

  return isPositiveId(id) ? id : null;
}
