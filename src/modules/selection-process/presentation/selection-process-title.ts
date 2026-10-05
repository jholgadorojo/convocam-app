/*
 * Palabras que normalmente deben
 * permanecer en minúscula dentro
 * de un título.
 */
const LOWERCASE_WORDS =
  new Set([
    "a",
    "al",
    "amb",
    "de",
    "del",
    "dels",
    "en",
    "i",
    "la",
    "les",
    "per",
    "pel",
    "pels",
    "el",
    "els",
    "o",

    /*
     * Castellano, por si aparece
     * alguna convocatoria.
     */
    "y",
    "con",
    "para",
    "por",
    "los",
    "las",
    "un",
    "una",
  ]);

/*
 * Valores que queremos conservar
 * siempre en mayúsculas.
 */
const PRESERVED_TOKENS =
  new Set([
    "A1",
    "A2",
    "B",
    "C1",
    "C2",
    "AP",

    "TIC",
    "IT",
    "SQL",
    "SAP",
    "ERP",
    "GIS",
    "CAD",

    "CIDO",
    "DOGC",
    "BOPB",
    "BOE",
    "UE",
  ]);

/*
 * Formatea únicamente la
 * representación visual.
 *
 * El título original almacenado
 * en PostgreSQL no se modifica.
 */
export function formatSelectionProcessTitle(
  title: string,
): string {
  const cleaned =
    cleanTitle(
      title,
    );

  if (!cleaned) {
    return cleaned;
  }

  /*
   * Primero normalizamos todo
   * a minúsculas.
   *
   * Después reconstruimos las
   * mayúsculas de forma consistente.
   */
  const lower =
    cleaned.toLocaleLowerCase(
      "ca-ES",
    );

  const words =
    lower.split(
      " ",
    );

  const formatted =
    words.map(
      (
        word,
        index,
      ) =>
        formatWord(
          word,
          index,
          words,
        ),
    );

  return formatted.join(
    " ",
  );
}

/*
 * ============================================================
 * PALABRAS
 * ============================================================
 */

function formatWord(
  word: string,
  index: number,
  words: string[],
): string {
  /*
   * Casos:
   *
   * d'administració
   * d'informació
   * l'ajuntament
   *
   * Tratamos de forma especial
   * la parte posterior al apóstrofo.
   */
  if (
    word.includes(
      "'",
    ) ||
    word.includes(
      "’",
    )
  ) {
    return formatApostropheWord(
      word,
    );
  }

  /*
   * Restauramos códigos:
   *
   * A1
   * C1
   * TIC
   * SQL
   * etc.
   */
  const preserved =
    getPreservedToken(
      word,
    );

  if (
    preserved
  ) {
    return preserved;
  }

  /*
   * Números:
   *
   * 1
   * 2
   * 25
   */
  if (
    /^\d+$/.test(
      word,
    )
  ) {
    return word;
  }

  /*
   * Conservamos descriptores
   * iniciales típicos:
   *
   * 1 plaça de ...
   * 2 places de ...
   * 1 borsa de ...
   */
  if (
    isInitialProcessDescriptor(
      word,
      index,
      words,
    )
  ) {
    return word;
  }

  /*
   * Conectores interiores.
   *
   * Tècnic de Recursos Humans
   *
   * y no:
   *
   * Tècnic De Recursos Humans
   */
  if (
    LOWERCASE_WORDS.has(
      word,
    )
  ) {
    return word;
  }

  return capitalizeWord(
    word,
  );
}

/*
 * Detectamos el comienzo típico
 * de los títulos de CIDO:
 *
 * 1 plaça de ...
 * 2 places de ...
 * 1 borsa de ...
 */
function isInitialProcessDescriptor(
  word: string,
  index: number,
  words: string[],
): boolean {
  if (
    index !== 1
  ) {
    return false;
  }

  if (
    !/^\d+$/.test(
      words[0] ?? "",
    )
  ) {
    return false;
  }

  return [
    "plaça",
    "places",
    "plaza",
    "plazas",
    "borsa",
    "borses",
  ].includes(
    word,
  );
}

/*
 * ============================================================
 * APÓSTROFOS
 * ============================================================
 */

function formatApostropheWord(
  word: string,
): string {
  const separator =
    word.includes(
      "’",
    )
      ? "’"
      : "'";

  const [
    prefix,
    ...rest
  ] =
    word.split(
      separator,
    );

  if (
    rest.length ===
    0
  ) {
    return word;
  }

  const suffix =
    rest.join(
      separator,
    );

  /*
   * d'administració
   *
   * ->
   *
   * d'Administració
   *
   * l'ajuntament
   *
   * ->
   *
   * l'Ajuntament
   */
  const formattedSuffix =
    getPreservedToken(
      suffix,
    ) ??
    capitalizeWord(
      suffix,
    );

  return `${prefix.toLocaleLowerCase(
    "ca-ES",
  )}${separator}${formattedSuffix}`;
}

/*
 * ============================================================
 * MAYÚSCULAS
 * ============================================================
 */

function capitalizeWord(
  word: string,
): string {
  if (!word) {
    return word;
  }

  /*
   * Soporte para:
   *
   * tècnic/a
   * administratiu/va
   */
  if (
    word.includes(
      "/",
    )
  ) {
    const parts =
      word.split(
        "/",
      );

    return [
      capitalizeSimpleWord(
        parts[0],
      ),

      ...parts
        .slice(
          1,
        )
        .map(
          (
            part,
          ) =>
            part.toLocaleLowerCase(
              "ca-ES",
            ),
        ),
    ].join(
      "/",
    );
  }

  /*
   * Soporte para palabras
   * con guion.
   */
  if (
    word.includes(
      "-",
    )
  ) {
    return word
      .split(
        "-",
      )
      .map(
        (
          part,
        ) =>
          capitalizeSimpleWord(
            part,
          ),
      )
      .join(
        "-",
      );
  }

  return capitalizeSimpleWord(
    word,
  );
}

function capitalizeSimpleWord(
  word: string,
): string {
  const characters =
    [
      ...word,
    ];

  const firstLetter =
    characters.findIndex(
      (
        character,
      ) =>
        /\p{L}/u.test(
          character,
        ),
    );

  if (
    firstLetter ===
    -1
  ) {
    return word;
  }

  characters[
    firstLetter
  ] =
    characters[
      firstLetter
    ].toLocaleUpperCase(
      "ca-ES",
    );

  return characters.join(
    "",
  );
}

/*
 * ============================================================
 * SIGLAS Y CÓDIGOS
 * ============================================================
 */

function getPreservedToken(
  value: string,
): string | null {
  const upper =
    value.toLocaleUpperCase(
      "ca-ES",
    );

  if (
    PRESERVED_TOKENS.has(
      upper,
    )
  ) {
    return upper;
  }

  return null;
}

/*
 * ============================================================
 * LIMPIEZA
 * ============================================================
 */

function cleanTitle(
  title: string,
): string {
  return title
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}