import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { parseSearchTerms } from "./search-terms";

/**
 * Búsqueda de texto tolerante del buscador (SPEC-004).
 *
 * Cada término debe aparecer, o parecerse lo bastante
 * (`word_similarity` de pg_trgm >= 0.55), en el título, el organismo,
 * su municipio, comarca o provincia, o el grupo de titulación.
 * Las comparaciones ignoran mayúsculas y tildes (`unaccent`).
 *
 * La puntuación de relevancia suma, por término, la mejor de las
 * coincidencias ponderadas: el título pesa más que el organismo, y
 * este más que la ubicación y el grupo de titulación.
 */

export type TextSearchMatch = {
  id: number;
  score: number;
};

// Columnas normalizadas (sin mayúsculas ni tildes, nunca NULL).
const TITLE = Prisma.sql`unaccent(lower(coalesce(sp.title, '')))`;
const INSTITUTION_NAME = Prisma.sql`unaccent(lower(coalesce(i.name, '')))`;
const MUNICIPALITY = Prisma.sql`unaccent(lower(coalesce(i.municipality, '')))`;
const COUNTY = Prisma.sql`unaccent(lower(coalesce(i.county, '')))`;
const PROVINCE = Prisma.sql`unaccent(lower(coalesce(i.province, '')))`;
const QUALIFICATION_GROUP = Prisma.sql`unaccent(lower(coalesce(sp."qualificationGroup", '')))`;

const SEARCHABLE_COLUMNS = [
  TITLE,
  INSTITUTION_NAME,
  MUNICIPALITY,
  COUNTY,
  PROVINCE,
  QUALIFICATION_GROUP,
];

/**
 * Convocatorias activas que coinciden con todos los términos,
 * de la más relevante a la menos relevante.
 */
export async function findTextMatches(
  prisma: PrismaClient,
  text: string,
): Promise<TextSearchMatch[]> {
  const terms = parseSearchTerms(text);
  if (terms.length === 0) {
    return [];
  }

  const matchConditions = terms.map((term) => {
    const { contains, similarity } = termComparisons(term);
    return Prisma.sql`(${Prisma.join(
      SEARCHABLE_COLUMNS.map(
        (column) =>
          Prisma.sql`${contains(column)} OR ${similarity(column)} >= 0.55`,
      ),
      " OR ",
    )})`;
  });

  const scoreExpressions = terms.map((term) => {
    const { contains, similarity } = termComparisons(term);
    return Prisma.sql`
      GREATEST(
        CASE WHEN ${contains(TITLE)} THEN 2.0 ELSE 0.0 END,
        ${similarity(TITLE)} * 1.5,
        CASE WHEN ${contains(INSTITUTION_NAME)} THEN 1.4 ELSE 0.0 END,
        ${similarity(INSTITUTION_NAME)} * 1.1,
        CASE
          WHEN ${contains(MUNICIPALITY)} OR ${contains(COUNTY)} OR ${contains(PROVINCE)}
          THEN 1.0 ELSE 0.0
        END,
        GREATEST(
          ${similarity(MUNICIPALITY)},
          ${similarity(COUNTY)},
          ${similarity(PROVINCE)}
        ) * 1.0,
        CASE WHEN ${contains(QUALIFICATION_GROUP)} THEN 0.8 ELSE 0.0 END,
        ${similarity(QUALIFICATION_GROUP)} * 0.7
      )
    `;
  });

  return prisma.$queryRaw<TextSearchMatch[]>(Prisma.sql`
    SELECT
      sp.id,
      (${Prisma.join(scoreExpressions, " + ")})::double precision AS score
    FROM "selection_processes" sp
    LEFT JOIN "institutions" i ON i.id = sp."institutionId"
    WHERE sp."sourceActive" = true
      AND ${Prisma.join(matchConditions, " AND ")}
    ORDER BY score DESC, sp.id ASC
  `);
}

/** Comparaciones de un término con una columna normalizada. */
function termComparisons(term: string) {
  const pattern = Prisma.sql`unaccent(lower(${`%${term}%`}))`;
  const word = Prisma.sql`unaccent(lower(${term}))`;
  return {
    /** La columna contiene el término. */
    contains: (column: Prisma.Sql) => Prisma.sql`${column} LIKE ${pattern}`,
    /** Parecido del término con alguna palabra de la columna (0 a 1). */
    similarity: (column: Prisma.Sql) =>
      Prisma.sql`word_similarity(${word}, ${column})`,
  };
}
