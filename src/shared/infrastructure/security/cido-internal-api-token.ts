
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Seguridad de las API internas de CIDO.
 *
 * Las mismas reglas se aplican en desarrollo,
 * pruebas y producción.
 *
 * El cliente debe enviar:
 *
 * Authorization: Bearer <token>
 *
 * El token esperado se obtiene exclusivamente
 * de la variable de entorno:
 *
 * CIDO_INTERNAL_API_TOKEN
 *
 * Si el token no está configurado, es inválido
 * o no coincide, se deniega la autorización.
 */

const TOKEN_ENV_NAME = "CIDO_INTERNAL_API_TOKEN";
const MIN_TOKEN_LENGTH = 32;
const MAX_TOKEN_LENGTH = 512;

/**
 * Comprueba si una petición HTTP está autorizada
 * para utilizar las API internas de CIDO.
 *
 * No depende de Next.js y puede reutilizarse
 * desde distintos Route Handlers.
 */
export function hasValidCidoInternalApiToken(
  request: Request,
): boolean {
  const expectedToken = process.env[TOKEN_ENV_NAME];

  // Nunca permitir acceso sin configuración válida.
  if (
    !expectedToken ||
    expectedToken.length < MIN_TOKEN_LENGTH ||
    expectedToken.length > MAX_TOKEN_LENGTH ||
    /\s/.test(expectedToken)
  ) {
    return false;
  }

  const authorization = request.headers.get(
    "authorization",
  );

  if (!authorization) {
    return false;
  }

  // Exigir el formato Bearer <token>.
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);

  if (!match) {
    return false;
  }

  const providedToken = match[1];

  if (
    providedToken.length < MIN_TOKEN_LENGTH ||
    providedToken.length > MAX_TOKEN_LENGTH
  ) {
    return false;
  }

  // Convertir ambos tokens a hashes de longitud fija.
  // Esto permite utilizar una comparación segura.
  const expectedHash = createHash("sha256")
    .update(expectedToken, "utf8")
    .digest();

  const providedHash = createHash("sha256")
    .update(providedToken, "utf8")
    .digest();

  return timingSafeEqual(expectedHash, providedHash);
}
