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
        });
      }
    }

    await prisma.userSelectionProcess.createMany({ data: follows });
  });

  afterAll(async () => {
    // Borrar exclusivamente los datos de esta ejecucion.
    try {
      await prisma.userSelectionProcess.deleteMany({
        where: { userId: { in: [FIRST_USER_ID, SECOND_USER_ID] } },
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
});
