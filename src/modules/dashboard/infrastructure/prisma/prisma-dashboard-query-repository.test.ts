import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/infrastructure/database/prisma";
import { PersonalSelectionProcessStatus } from
  "@/modules/user-selection-process/domain/personal-selection-process-status";

import type { DashboardUpcomingDeadlinesQuery } from
  "../../application/dashboard-query-repository";

import { PrismaDashboardQueryRepository } from
  "./prisma-dashboard-query-repository";

/**
 * SPEC-009 - Tests de integracion con PostgreSQL.
 *
 * Todos los registros son ficticios. El identificador unico de
 * esta ejecucion permite limpiar solo sus propios datos.
 */
const RUN_ID = randomUUID().replace(/-/g, "");
const PREFIX = `TEST-CONVOCAM-DASHBOARD-${RUN_ID}`;
const FIRST_USER_ID = `${PREFIX}-USER-1`;
const SECOND_USER_ID = `${PREFIX}-USER-2`;

const FROM_DATE = "2026-10-18";
const TO_DATE = "2026-11-02";

type PersistedPersonalStatus =
  | "INTERESTED"
  | "PREPARING_APPLICATION"
  | "APPLICATION_SUBMITTED"
  | "COMPLETED";

type Fixture = {
  key: string;
  endDate: string | null;
  personalStatus: PersistedPersonalStatus | null;
  followedBy: "first" | "second" | "none";
  withInstitution?: boolean;
  sourceActive?: boolean;
};

/**
 * Fechas de seguimiento fijas para comprobar los dias locales.
 * Prisma guarda followedAt como timestamp sin zona horaria;
 * la aplicacion escribe los instantes en UTC.
 */
const DEFAULT_FOLLOWED_AT = "2026-10-18T12:00:00.000Z";

const SPECIAL_FOLLOWED_AT: Record<string, string> = {
  // El 18 a las 22:30 UTC ya es dia 19 en Catalunya.
  tomorrow: "2026-10-18T22:30:00.000Z",

  // Tras pasar al horario de verano, ya es 30 de marzo.
  "day-3": "2026-03-29T22:30:00.000Z",

  // Tras pasar al horario de invierno, ya es 26 de octubre.
  "day-4": "2026-10-25T23:30:00.000Z",
};

type DocumentFixture = {
  key: string;
  selectionProcessKey: string;
  publicationDate: string;
  sourceActive?: boolean;
};

/**
 * Documentos en varias convocatorias, incluidos:
 * - publicaciones previas o iguales al dia de seguimiento;
 * - documentos activos e inactivos;
 * - otros usuarios y convocatorias sin seguimiento;
 * - varias publicaciones de una misma convocatoria;
 * - cambios de horario de Catalunya.
 */
const DOCUMENT_FIXTURES: DocumentFixture[] = [
  { key: "today-before", selectionProcessKey: "today", publicationDate: "2026-10-17" },
  { key: "today-same", selectionProcessKey: "today", publicationDate: "2026-10-18" },
  { key: "today-tie-older", selectionProcessKey: "today", publicationDate: "2026-11-02" },
  { key: "today-tie-newer", selectionProcessKey: "today", publicationDate: "2026-11-02" },
  { key: "today-inactive", selectionProcessKey: "today", publicationDate: "2026-11-10", sourceActive: false },
  { key: "tomorrow-before", selectionProcessKey: "tomorrow", publicationDate: "2026-10-18" },
  { key: "tomorrow-same", selectionProcessKey: "tomorrow", publicationDate: "2026-10-19" },
  { key: "tomorrow-newest", selectionProcessKey: "tomorrow", publicationDate: "2026-11-03" },
  { key: "same-day-document", selectionProcessKey: "same-day", publicationDate: "2026-10-27" },
  { key: "spring-before", selectionProcessKey: "day-3", publicationDate: "2026-03-29" },
  { key: "spring-same", selectionProcessKey: "day-3", publicationDate: "2026-03-30" },
  { key: "autumn-before", selectionProcessKey: "day-4", publicationDate: "2026-10-25" },
  { key: "autumn-same", selectionProcessKey: "day-4", publicationDate: "2026-10-26" },
  { key: "no-institution-document", selectionProcessKey: "no-institution", publicationDate: "2026-10-28" },
  { key: "historical-document", selectionProcessKey: "historical", publicationDate: "2026-10-29" },
  { key: "other-user-document", selectionProcessKey: "other-user", publicationDate: "2026-11-06" },
  { key: "not-followed-document", selectionProcessKey: "not-followed", publicationDate: "2026-11-08" },
];

const FIXTURES: Fixture[] = [
  { key: "today", endDate: "2026-10-18", personalStatus: "INTERESTED", followedBy: "first" },
  { key: "tomorrow", endDate: "2026-10-19", personalStatus: "PREPARING_APPLICATION", followedBy: "first" },
  { key: "same-day", endDate: "2026-10-19", personalStatus: "INTERESTED", followedBy: "first" },
  { key: "day-3", endDate: "2026-10-21", personalStatus: "INTERESTED", followedBy: "first" },
  { key: "day-4", endDate: "2026-10-22", personalStatus: "PREPARING_APPLICATION", followedBy: "first" },
  { key: "no-institution", endDate: "2026-10-23", personalStatus: "INTERESTED", followedBy: "first", withInstitution: false },
  { key: "day-15", endDate: "2026-11-02", personalStatus: "INTERESTED", followedBy: "first" },
  { key: "yesterday", endDate: "2026-10-17", personalStatus: "INTERESTED", followedBy: "first" },
  { key: "day-16", endDate: "2026-11-03", personalStatus: "INTERESTED", followedBy: "first" },
  { key: "submitted", endDate: "2026-10-20", personalStatus: "APPLICATION_SUBMITTED", followedBy: "first" },
  { key: "completed", endDate: "2026-10-20", personalStatus: "COMPLETED", followedBy: "first" },
  { key: "without-date", endDate: null, personalStatus: "INTERESTED", followedBy: "first" },
  { key: "historical", endDate: "2026-10-20", personalStatus: "COMPLETED", followedBy: "first", sourceActive: false },
  { key: "other-user", endDate: "2026-10-19", personalStatus: "INTERESTED", followedBy: "second" },
  { key: "not-followed", endDate: "2026-10-19", personalStatus: null, followedBy: "none" },
];

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function upcomingQuery(
  userId: string = FIRST_USER_ID,
  overrides: Partial<DashboardUpcomingDeadlinesQuery> = {},
): DashboardUpcomingDeadlinesQuery {
  return {
    userId,
    fromDate: dateOnly(FROM_DATE),
    toDate: dateOnly(TO_DATE),
    personalStatuses: [
      PersonalSelectionProcessStatus.INTERESTED,
      PersonalSelectionProcessStatus.PREPARING_APPLICATION,
    ],
    ...overrides,
  };
}

describe("PrismaDashboardQueryRepository", () => {
  const repository = new PrismaDashboardQueryRepository(prisma);
  const selectionProcessIds = new Map<string, number>();
  const documentIds = new Map<string, number>();

  beforeAll(async () => {
    // Usuarios de prueba independientes de cualquier cuenta real.
    await prisma.user.createMany({
      data: [
        {
          id: FIRST_USER_ID,
          name: "Usuario dashboard 1",
          email: `dashboard-${RUN_ID}-1@example.test`,
        },
        {
          id: SECOND_USER_ID,
          name: "Usuario dashboard 2",
          email: `dashboard-${RUN_ID}-2@example.test`,
        },
      ],
    });

    const institution = await prisma.institution.create({
      data: {
        cidoId: `${PREFIX}-INSTITUTION`,
        name: "Ajuntament de prova Convocam",
        shortName: "Ajuntament de prova",
        isActive: true,
        municipality: "Municipio de prueba",
        county: "Comarca de prueba",
        province: "Barcelona",
      },
    });

    const follows: {
      userId: string;
      selectionProcessId: number;
      personalStatus: PersistedPersonalStatus;
      followedAt: Date;
    }[] = [];

    for (const fixture of FIXTURES) {
      const selectionProcess = await prisma.selectionProcess.create({
        data: {
          cidoId: `${PREFIX}-SP-${fixture.key}`,
          cidoIdentifier: `${PREFIX}-IDENTIFIER-${fixture.key}`,
          title: `Convocatoria dashboard ${fixture.key}`,
          isJobPool: false,
          scopeId: 1,
          scopeName: "Administracio local",
          institutionName: "Ajuntament de prova Convocam",
          institutionId:
            fixture.withInstitution === false ? null : institution.id,
          applicationEndDate:
            fixture.endDate === null ? null : dateOnly(fixture.endDate),
          reservedUnemployed: false,
          reservedYoung: false,
          reservedWomen: false,
          cidoUrl: "https://example.com/convocam-dashboard-test",
          statusId: fixture.sourceActive === false ? 4 : 3,
          status: fixture.sourceActive === false ? "Tancat" : "Termini obert",
          sourceActive: fixture.sourceActive ?? true,
        },
      });

      selectionProcessIds.set(fixture.key, selectionProcess.id);

      if (fixture.followedBy !== "none" && fixture.personalStatus !== null) {
        follows.push({
          userId:
            fixture.followedBy === "first"
              ? FIRST_USER_ID
              : SECOND_USER_ID,
          selectionProcessId: selectionProcess.id,
          personalStatus: fixture.personalStatus,
          followedAt: new Date(
            SPECIAL_FOLLOWED_AT[fixture.key] ?? DEFAULT_FOLLOWED_AT,
          ),
        });
      }
    }

    await prisma.userSelectionProcess.createMany({ data: follows });

    // Documentos ficticios para las pruebas de publicaciones oficiales.
    for (const fixture of DOCUMENT_FIXTURES) {
      const selectionProcessId = selectionProcessIds.get(
        fixture.selectionProcessKey,
      );

      if (selectionProcessId === undefined) {
        throw new Error(`Convocatoria no encontrada: ${fixture.selectionProcessKey}`);
      }

      const document = await prisma.selectionProcessDocument.create({
        data: {
          cidoId: `${PREFIX}-DOC-${fixture.key}`,
          selectionProcessId,
          publicationDate: dateOnly(fixture.publicationDate),
          summary: `Resumen oficial ${fixture.key}`,
          bulletinId: 1,
          bulletin: "BOP",
          entryDate: dateOnly(fixture.publicationDate),
          phaseId: 1,
          phase: "Fase de prueba",
          documentUrl: `https://example.com/convocam-test/${fixture.key}.pdf`,
          sourceActive: fixture.sourceActive ?? true,
        },
      });

      documentIds.set(fixture.key, document.id);
    }
  });

  afterAll(async () => {
    // Borrar exclusivamente los datos de esta ejecucion.
    try {
      await prisma.userSelectionProcess.deleteMany({
        where: { userId: { in: [FIRST_USER_ID, SECOND_USER_ID] } },
      });

      await prisma.selectionProcessDocument.deleteMany({
        where: { cidoId: { startsWith: PREFIX } },
      });

      await prisma.selectionProcess.deleteMany({
        where: { cidoId: { startsWith: PREFIX } },
      });

      await prisma.institution.deleteMany({
        where: { cidoId: { startsWith: PREFIX } },
      });

      await prisma.user.deleteMany({
        where: { id: { in: [FIRST_USER_ID, SECOND_USER_ID] } },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it("cuenta todos los seguimientos del usuario, incluidos los historicos", async () => {
    expect(await repository.countFollowedByUser(FIRST_USER_ID)).toBe(13);
    expect(await repository.countFollowedByUser(SECOND_USER_ID)).toBe(1);
  });

  it("devuelve cero si el usuario no tiene seguimientos", async () => {
    expect(await repository.countFollowedByUser(`${PREFIX}-UNKNOWN`)).toBe(0);
  });

  it("cuenta solo plazos entre hoy y el dia 15 con estados permitidos", async () => {
    const result = await repository.countUpcomingDeadlines(upcomingQuery());
    expect(result).toBe(7);
  });

  it("incluye ambos extremos del intervalo de fechas", async () => {
    const today = await repository.countUpcomingDeadlines(
      upcomingQuery(FIRST_USER_ID, {
        fromDate: dateOnly("2026-10-18"),
        toDate: dateOnly("2026-10-18"),
      }),
    );

    const lastDay = await repository.countUpcomingDeadlines(
      upcomingQuery(FIRST_USER_ID, {
        fromDate: dateOnly("2026-11-02"),
        toDate: dateOnly("2026-11-02"),
      }),
    );

    expect(today).toBe(1);
    expect(lastDay).toBe(1);
  });

  it("respeta los estados personales indicados en la consulta", async () => {
    const interested = await repository.countUpcomingDeadlines(
      upcomingQuery(FIRST_USER_ID, {
        personalStatuses: [PersonalSelectionProcessStatus.INTERESTED],
      }),
    );
    const preparing = await repository.countUpcomingDeadlines(
      upcomingQuery(FIRST_USER_ID, {
        personalStatuses: [PersonalSelectionProcessStatus.PREPARING_APPLICATION],
      }),
    );

    expect(interested).toBe(5);
    expect(preparing).toBe(2);
  });

  it("no mezcla los seguimientos de dos usuarios", async () => {
    expect(await repository.countUpcomingDeadlines(upcomingQuery(SECOND_USER_ID))).toBe(1);
    expect(await repository.countUpcomingDeadlines(upcomingQuery(`${PREFIX}-UNKNOWN`))).toBe(0);

    const items = await repository.listUpcomingDeadlines({
      ...upcomingQuery(),
      limit: 20,
    });

    expect(items.map((item) => item.selectionProcessId)).not.toContain(
      selectionProcessIds.get("other-user"),
    );
    expect(items.map((item) => item.selectionProcessId)).not.toContain(
      selectionProcessIds.get("not-followed"),
    );
  });

  it("devuelve los cinco plazos mas cercanos con orden estable", async () => {
    const result = await repository.listUpcomingDeadlines({
      ...upcomingQuery(),
      limit: 5,
    });

    expect(result).toHaveLength(5);
    expect(result.map((item) => item.selectionProcessId)).toEqual([
      selectionProcessIds.get("today"),
      selectionProcessIds.get("tomorrow"),
      selectionProcessIds.get("same-day"),
      selectionProcessIds.get("day-3"),
      selectionProcessIds.get("day-4"),
    ]);

    expect(result[1]).toEqual({
      selectionProcessId: selectionProcessIds.get("tomorrow"),
      title: "Convocatoria dashboard tomorrow",
      municipality: "Municipio de prueba",
      applicationEndDate: dateOnly("2026-10-19"),
      personalStatus: PersonalSelectionProcessStatus.PREPARING_APPLICATION,
    });
  });

  it("aplica el limite en PostgreSQL sin alterar el contador", async () => {
    const result = await repository.listUpcomingDeadlines({
      ...upcomingQuery(),
      limit: 3,
    });

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.selectionProcessId)).toEqual([
      selectionProcessIds.get("today"),
      selectionProcessIds.get("tomorrow"),
      selectionProcessIds.get("same-day"),
    ]);
    expect(await repository.countUpcomingDeadlines(upcomingQuery())).toBe(7);
  });

  it("incluye el dia 15 y muestra municipio nulo cuando falta institucion", async () => {
    const result = await repository.listUpcomingDeadlines({
      ...upcomingQuery(),
      limit: 10,
    });

    expect(result).toHaveLength(7);
    expect(result.at(-1)).toMatchObject({
      selectionProcessId: selectionProcessIds.get("day-15"),
      applicationEndDate: dateOnly("2026-11-02"),
    });

    const withoutInstitution = result.find(
      (item) => item.selectionProcessId === selectionProcessIds.get("no-institution"),
    );
    expect(withoutInstitution?.municipality).toBeNull();
  });

  it.each([0, -1, 1.5, 101])(
    "rechaza limites invalidos: %s",
    async (limit) => {
      await expect(
        repository.listUpcomingDeadlines({
          ...upcomingQuery(),
          limit,
        }),
      ).rejects.toThrow("limit must be an integer between 1 and 100");
    },
  );
  /**
   * ============================================================
   * SPEC-009 - ULTIMAS PUBLICACIONES OFICIALES
   * ============================================================
   */

  it("devuelve los documentos validos ordenados por fecha e id descendentes", async () => {
    const result = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 100,
    });

    // Son 10 documentos validos de las convocatorias seguidas.
    expect(result).toHaveLength(10);
    expect(result.map((item) => item.documentId)).toEqual([
      documentIds.get("tomorrow-newest"),
      documentIds.get("today-tie-newer"),
      documentIds.get("today-tie-older"),
      documentIds.get("historical-document"),
      documentIds.get("no-institution-document"),
      documentIds.get("same-day-document"),
      documentIds.get("autumn-same"),
      documentIds.get("tomorrow-same"),
      documentIds.get("today-same"),
      documentIds.get("spring-same"),
    ]);
  });

  it("aplica el limite de cinco despues de ordenar y filtrar", async () => {
    const result = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 5,
    });

    expect(result).toHaveLength(5);
    expect(result.map((item) => item.documentId)).toEqual([
      documentIds.get("tomorrow-newest"),
      documentIds.get("today-tie-newer"),
      documentIds.get("today-tie-older"),
      documentIds.get("historical-document"),
      documentIds.get("no-institution-document"),
    ]);
  });

  it("incluye la publicacion del mismo dia local del seguimiento", async () => {
    const result = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 100,
    });

    const ids = result.map((item) => item.documentId);

    expect(ids).toContain(documentIds.get("today-same"));
    expect(ids).toContain(documentIds.get("tomorrow-same"));
    expect(ids).not.toContain(documentIds.get("today-before"));
    expect(ids).not.toContain(documentIds.get("tomorrow-before"));
  });

  it("interpreta en hora catalana un seguimiento hecho al final del dia UTC", async () => {
    // 18/10/2026, 22:30 UTC = 19/10/2026, 00:30 Catalunya.
    const result = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 100,
    });

    const ids = result.map((item) => item.documentId);
    expect(ids).not.toContain(documentIds.get("tomorrow-before"));
    expect(ids).toContain(documentIds.get("tomorrow-same"));
  });

  it("respeta el cambio al horario de verano de Catalunya", async () => {
    // 29/03/2026, 22:30 UTC = 30/03/2026, 00:30 Catalunya.
    const result = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 100,
    });

    const ids = result.map((item) => item.documentId);
    expect(ids).not.toContain(documentIds.get("spring-before"));
    expect(ids).toContain(documentIds.get("spring-same"));
  });

  it("respeta el cambio al horario de invierno de Catalunya", async () => {
    // 25/10/2026, 23:30 UTC = 26/10/2026, 00:30 Catalunya.
    const result = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 100,
    });

    const ids = result.map((item) => item.documentId);
    expect(ids).not.toContain(documentIds.get("autumn-before"));
    expect(ids).toContain(documentIds.get("autumn-same"));
  });

  it("excluye documentos inactivos y convocatorias no seguidas", async () => {
    const result = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 100,
    });

    const ids = result.map((item) => item.documentId);
    expect(ids).not.toContain(documentIds.get("today-inactive"));
    expect(ids).not.toContain(documentIds.get("not-followed-document"));
    expect(ids).not.toContain(documentIds.get("other-user-document"));
  });

  it("mantiene separados los documentos de cada usuario", async () => {
    const first = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 100,
    });
    const second = await repository.listLatestOfficialPublications({
      userId: SECOND_USER_ID,
      limit: 100,
    });

    expect(first.map((item) => item.documentId)).not.toContain(
      documentIds.get("other-user-document"),
    );
    expect(second.map((item) => item.documentId)).toEqual([
      documentIds.get("other-user-document"),
    ]);
  });

  it("incluye publicaciones de procesos historicos seguidos", async () => {
    const result = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 100,
    });

    expect(result.map((item) => item.documentId)).toContain(
      documentIds.get("historical-document"),
    );
  });

  it("devuelve los datos oficiales del documento y admite municipio nulo", async () => {
    const result = await repository.listLatestOfficialPublications({
      userId: FIRST_USER_ID,
      limit: 100,
    });

    const withoutInstitution = result.find(
      (item) => item.documentId === documentIds.get("no-institution-document"),
    );

    expect(withoutInstitution).toEqual({
      documentId: documentIds.get("no-institution-document"),
      selectionProcessId: selectionProcessIds.get("no-institution"),
      selectionProcessTitle: "Convocatoria dashboard no-institution",
      municipality: null,
      publicationDate: dateOnly("2026-10-28"),
      summary: "Resumen oficial no-institution-document",
      phase: "Fase de prueba",
      documentUrl:
        "https://example.com/convocam-test/no-institution-document.pdf",
    });
  });

  it("devuelve vacio cuando el usuario no sigue ninguna convocatoria", async () => {
    const result = await repository.listLatestOfficialPublications({
      userId: `${PREFIX}-UNKNOWN`,
      limit: 5,
    });

    expect(result).toEqual([]);
  });

  it("rechaza un identificador de usuario en blanco", async () => {
    await expect(
      repository.listLatestOfficialPublications({
        userId: "   ",
        limit: 5,
      }),
    ).rejects.toThrow("userId is required");
  });

  it("acepta espacios alrededor del identificador de usuario", async () => {
    const result = await repository.listLatestOfficialPublications({
      userId: `  ${SECOND_USER_ID}  `,
      limit: 5,
    });

    expect(result.map((item) => item.documentId)).toEqual([
      documentIds.get("other-user-document"),
    ]);
  });

  it.each([0, -1, 1.5, 101])(
    "rechaza limites invalidos para publicaciones: %s",
    async (limit) => {
      await expect(
        repository.listLatestOfficialPublications({
          userId: FIRST_USER_ID,
          limit,
        }),
      ).rejects.toThrow("limit must be an integer between 1 and 100");
    },
  );
});
