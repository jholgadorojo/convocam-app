
/**
 * Convierte entidades HTML en caracteres normales.
 *
 * Ejemplos:
 * d&apos;una  -> d'una
 * d&#39;una  -> d'una
 * &amp;      -> &
 * &quot;     -> "
 *
 * Solo transforma el texto para su presentación.
 * No modifica los datos almacenados en PostgreSQL.
 *
 * Compatible con Server Components de Next.js.
 */

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  // Caracteres HTML básicos
  amp: "&",
  apos: "'",
  quot: '"',
  lt: "<",
  gt: ">",
  nbsp: "\u00A0",

  // Signos de puntuación
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
  hellip: "…",

  // Otros símbolos
  euro: "€",
  copy: "©",
  reg: "®",
  bull: "•",

  // Vocales y caracteres catalanes/castellanos
  aacute: "á",
  Aacute: "Á",
  agrave: "à",
  Agrave: "À",
  eacute: "é",
  Eacute: "É",
  egrave: "è",
  Egrave: "È",
  iacute: "í",
  Iacute: "Í",
  igrave: "ì",
  Igrave: "Ì",
  oacute: "ó",
  Oacute: "Ó",
  ograve: "ò",
  Ograve: "Ò",
  uacute: "ú",
  Uacute: "Ú",
  ugrave: "ù",
  Ugrave: "Ù",
  uuml: "ü",
  Uuml: "Ü",
  iuml: "ï",
  Iuml: "Ï",
  ccedil: "ç",
  Ccedil: "Ç",
  ntilde: "ñ",
  Ntilde: "Ñ",
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(
    /&(#(?:[xX][0-9a-fA-F]+|[0-9]+)|[a-zA-Z][a-zA-Z0-9]+);/g,
    (match, entity: string): string => {
      // Entidades numéricas: &#39; o &#x27;
      if (entity.startsWith("#")) {
        const hexadecimal =
          entity[1] === "x" || entity[1] === "X";

        const numericValue = Number.parseInt(
          entity.slice(hexadecimal ? 2 : 1),
          hexadecimal ? 16 : 10,
        );

        // Ignorar códigos Unicode inválidos.
        if (
          !Number.isInteger(numericValue) ||
          numericValue <= 0 ||
          numericValue > 0x10ffff ||
          (numericValue >= 0xd800 &&
            numericValue <= 0xdfff)
        ) {
          return match;
        }

        return String.fromCodePoint(numericValue);
      }

      // Entidades HTML con nombre.
      if (
        Object.prototype.hasOwnProperty.call(
          HTML_ENTITIES,
          entity,
        )
      ) {
        return HTML_ENTITIES[entity];
      }

      // Conservar entidades desconocidas.
      return match;
    },
  );
}
