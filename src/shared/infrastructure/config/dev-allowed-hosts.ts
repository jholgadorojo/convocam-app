
/**
 * Hosts adicionales desde los que se permite abrir el
 * servidor de desarrollo (127.0.0.1, IP de la red local...).
 *
 * Se leen de la variable de entorno DEV_ALLOWED_HOSTS,
 * separados por comas, para no dejar IPs de la red local
 * fijas en el código:
 *
 * DEV_ALLOWED_HOSTS=127.0.0.1,192.168.0.173
 *
 * Los usan allowedDevOrigins (next.config.ts) y
 * trustedOrigins (src/lib/auth.ts). Sin dependencias de
 * Next.js ni del alias "@", porque se importa desde
 * next.config.ts.
 */
export function getDevAllowedHosts(): string[] {
  return (process.env.DEV_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}
