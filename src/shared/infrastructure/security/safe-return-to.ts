
/**
 * Validación del parámetro returnTo tras el login.
 *
 * Solo se permiten rutas internas de la aplicación.
 * Comprobar únicamente que empiece por "/" no basta:
 * el navegador interpreta "/\evil.com" como "//evil.com"
 * y saldría a un dominio externo (open redirect).
 *
 * Por eso se resuelve la URL igual que lo haría el
 * navegador y se exige que el origen no cambie.
 */

const DEFAULT_RETURN_TO = "/dashboard";

// Origen ficticio: solo sirve para detectar si la
// resolución de la URL sale de la propia aplicación.
const INTERNAL_ORIGIN = "http://convocam.internal";

export function getSafeReturnTo(
  value: string | null | undefined,
): string {
  if (!value || !value.startsWith("/")) {
    return DEFAULT_RETURN_TO;
  }

  let url: URL;

  try {
    url = new URL(value, INTERNAL_ORIGIN);
  } catch {
    return DEFAULT_RETURN_TO;
  }

  if (url.origin !== INTERNAL_ORIGIN) {
    return DEFAULT_RETURN_TO;
  }

  // Devolver la ruta ya normalizada, nunca el texto original.
  return `${url.pathname}${url.search}${url.hash}`;
}
