import { z } from "zod";

/*
 * Las respuestas de CIDO se validan al recibirlas: si la
 * API cambia, el error indica el endpoint y el campo en
 * lugar de aparecer después en un mapper o en la BD.
 */
export function parseCidoResponse<T>(
  json: unknown,
  schema: z.ZodType<T>,
  url: URL,
): T {
  const result = schema.safeParse(json);

  if (!result.success) {
    throw new Error(
      `Respuesta de CIDO no válida en ${url.pathname}: ${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}

// Identifica un recurso que no ha pasado la validación,
// cuyo id puede faltar o no ser texto.
export function readCidoResourceId(
  resource: unknown,
): string {
  if (
    typeof resource === "object" &&
    resource !== null &&
    "id" in resource &&
    typeof resource.id === "string"
  ) {
    return resource.id;
  }

  return "desconocido";
}
