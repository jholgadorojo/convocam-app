
/**
 * Límites de la búsqueda de texto del buscador.
 *
 * Cada término genera varias comparaciones LIKE y
 * word_similarity (pg_trgm) en PostgreSQL. Sin límite,
 * un usuario anónimo podría enviar cientos de palabras
 * en ?q= y forzar consultas muy costosas.
 */
export const MAX_SEARCH_TEXT_LENGTH = 100;
export const MAX_SEARCH_TERMS = 8;

/**
 * Convierte el texto de búsqueda en una lista de términos
 * únicos, recortando la longitud total y el número de términos.
 */
export function parseSearchTerms(text: string): string[] {
  const terms = text
    .slice(0, MAX_SEARCH_TEXT_LENGTH)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return [...new Set(terms)].slice(0, MAX_SEARCH_TERMS);
}
