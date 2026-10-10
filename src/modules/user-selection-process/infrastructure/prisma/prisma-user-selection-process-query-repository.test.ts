import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  PersonalSelectionProcessStatus as PrismaPersonalSelectionProcessStatus,
  PrismaClient,
} from "@/generated/prisma/client";

import { PersonalSelectionProcessStatus } from "../../domain/personal-selection-process-status";

import { PrismaUserSelectionProcessQueryRepository } from "./prisma-user-selection-process-query-repository";

import { prisma } from "@/shared/infrastructure/database/prisma";

const repository =
  new PrismaUserSelectionProcessQueryRepository(
    prisma,
  );

const TEST_PREFIX =
  "test-user-selection-process-query";

describe(
  "PrismaUserSelectionProcessQueryRepository",
  () => {
    beforeEach(async () => {
      await cleanTestData();
    });

    afterAll(async () => {
      await cleanTestData();
    });

    it(
      "devuelve solo las convocatorias seguidas por el usuario y las ordena por fecha de seguimiento descendente",
      async () => {
        const user =
          await createUser(
            "user-1",
          );

        const otherUser =
          await createUser(
            "user-2",
          );

        const institution =
          await prisma.institution.create({
            data: {
              cidoId:
                `${TEST_PREFIX}-institution-1`,

              name:
                "Ajuntament de Cardedeu",

              shortName:
                "Cardedeu",

              isActive:
                true,

              municipality:
                "Cardedeu",

              county:
                "Vallès Oriental",

              province:
                "Barcelona",
            },
          });

        const olderProcess =
          await createSelectionProcess({
            suffix:
              "older",

            institutionId:
              institution.id,

            sourceActive:
              true,
          });

        const newerHistoricalProcess =
          await createSelectionProcess({
            suffix:
              "newer-historical",

            institutionId:
              institution.id,

            sourceActive:
              false,
          });

        const otherUserProcess =
          await createSelectionProcess({
            suffix:
              "other-user",

            institutionId:
              institution.id,

            sourceActive:
              true,
          });

        await prisma.userSelectionProcess.create({
          data: {
            userId:
              user.id,

            selectionProcessId:
              olderProcess.id,

            personalStatus:
              PrismaPersonalSelectionProcessStatus.INTERESTED,

            followedAt:
              new Date(
                "2026-10-01T08:00:00.000Z",
              ),

            personalStatusUpdatedAt:
              new Date(
                "2026-10-02T09:00:00.000Z",
              ),
          },
        });

        await prisma.userSelectionProcess.create({
          data: {
            userId:
              user.id,

            selectionProcessId:
              newerHistoricalProcess.id,

            personalStatus:
              PrismaPersonalSelectionProcessStatus.EXAM_COMPLETED,

            followedAt:
              new Date(
                "2026-10-08T10:00:00.000Z",
              ),

            personalStatusUpdatedAt:
              new Date(
                "2026-10-10T12:30:45.000Z",
              ),
          },
        });

        await prisma.userSelectionProcess.create({
          data: {
            userId:
              otherUser.id,

            selectionProcessId:
              otherUserProcess.id,

            personalStatus:
              PrismaPersonalSelectionProcessStatus.ADMITTED,

            followedAt:
              new Date(
                "2026-10-09T10:00:00.000Z",
              ),

            personalStatusUpdatedAt:
              new Date(
                "2026-10-09T10:00:00.000Z",
              ),
          },
        });

        const result =
          await repository.findByUser(
            user.id,
          );

        expect(result).toHaveLength(
          2,
        );

        expect(
          result.map(
            (item) =>
              item.selectionProcess.id,
          ),
        ).toEqual([
          newerHistoricalProcess.id,
          olderProcess.id,
        ]);

        expect(
          result[0].personalStatus,
        ).toBe(
          PersonalSelectionProcessStatus.EXAM_COMPLETED,
        );

        expect(
          result[0].selectionProcess.sourceActive,
        ).toBe(false);

        expect(
          result[0].selectionProcess.institution,
        ).toEqual({
          name:
            "Ajuntament de Cardedeu",

          municipality:
            "Cardedeu",

          county:
            "Vallès Oriental",

          province:
            "Barcelona",
        });
      },
    );

    it(
      "devuelve como último documento el más reciente que siga activo",
      async () => {
        const user =
          await createUser(
            "documents-user",
          );

        const process =
          await createSelectionProcess({
            suffix:
              "documents",

            sourceActive:
              true,
          });

        await prisma.selectionProcessDocument.createMany({
          data: [
            {
              cidoId:
                `${TEST_PREFIX}-document-old`,

              selectionProcessId:
                process.id,

              publicationDate:
                new Date(
                  "2026-09-01T00:00:00.000Z",
                ),

              summary:
                "Documento antiguo",

              bulletinId:
                1,

              bulletin:
                "BOPB",

              entryDate:
                new Date(
                  "2026-09-01T00:00:00.000Z",
                ),

              phaseId:
                1,

              phase:
                "Convocatoria",

              documentUrl:
                "https://example.com/old.pdf",

              htmlUrl:
                "https://example.com/old",

              sourceActive:
                true,
            },

            {
              cidoId:
                `${TEST_PREFIX}-document-new`,

              selectionProcessId:
                process.id,

              publicationDate:
                new Date(
                  "2026-10-08T00:00:00.000Z",
                ),

              summary:
                "Documento más reciente",

              bulletinId:
                1,

              bulletin:
                "BOPB",

              entryDate:
                new Date(
                  "2026-10-08T00:00:00.000Z",
                ),

              phaseId:
                2,

              phase:
                "Resultados",

              documentUrl:
                "https://example.com/new.pdf",

              htmlUrl:
                "https://example.com/new",

              sourceActive:
                true,
            },

            {
              cidoId:
                `${TEST_PREFIX}-document-inactive`,

              selectionProcessId:
                process.id,

              publicationDate:
                new Date(
                  "2026-10-09T00:00:00.000Z",
                ),

              summary:
                "Documento inactivo",

              bulletinId:
                1,

              bulletin:
                "BOPB",

              entryDate:
                new Date(
                  "2026-10-09T00:00:00.000Z",
                ),

              phaseId:
                3,

              phase:
                "Resultados",

              documentUrl:
                "https://example.com/inactive.pdf",

              htmlUrl:
                "https://example.com/inactive",

              sourceActive:
                false,
            },
          ],
        });

        await prisma.userSelectionProcess.create({
          data: {
            userId:
              user.id,

            selectionProcessId:
              process.id,

            personalStatus:
              PrismaPersonalSelectionProcessStatus.INTERESTED,

            followedAt:
              new Date(
                "2026-10-10T08:00:00.000Z",
              ),

            personalStatusUpdatedAt:
              new Date(
                "2026-10-10T08:00:00.000Z",
              ),
          },
        });

        const result =
          await repository.findByUser(
            user.id,
          );

        expect(result).toHaveLength(
          1,
        );

        expect(
          result[0].selectionProcess.latestDocument,
        ).toEqual({
          publicationDate:
            new Date(
              "2026-10-08T00:00:00.000Z",
            ),

          documentUrl:
            "https://example.com/new.pdf",

          htmlUrl:
            "https://example.com/new",
        });
      },
    );

    it(
      "devuelve latestDocument null cuando la convocatoria no tiene documentos activos",
      async () => {
        const user =
          await createUser(
            "without-documents-user",
          );

        const process =
          await createSelectionProcess({
            suffix:
              "without-documents",

            sourceActive:
              true,
          });

        await prisma.userSelectionProcess.create({
          data: {
            userId:
              user.id,

            selectionProcessId:
              process.id,

            personalStatus:
              PrismaPersonalSelectionProcessStatus.PREPARING_APPLICATION,

            followedAt:
              new Date(
                "2026-10-10T08:00:00.000Z",
              ),

            personalStatusUpdatedAt:
              new Date(
                "2026-10-10T08:00:00.000Z",
              ),
          },
        });

        const result =
          await repository.findByUser(
            user.id,
          );

        expect(result).toHaveLength(
          1,
        );

        expect(
          result[0].selectionProcess.latestDocument,
        ).toBeNull();
      },
    );
  },
);

/* ============================================================
   HELPERS
============================================================ */

async function createUser(
  suffix: string,
) {
  return prisma.user.create({
    data: {
      id:
        `${TEST_PREFIX}-${suffix}`,

      name:
        `Usuario ${suffix}`,

      email:
        `${TEST_PREFIX}-${suffix}@example.com`,

      emailVerified:
        true,
    },
  });
}

async function createSelectionProcess({
  suffix,
  institutionId,
  sourceActive,
}: {
  suffix: string;
  institutionId?: number;
  sourceActive: boolean;
}) {
  return prisma.selectionProcess.create({
    data: {
      cidoId:
        `${TEST_PREFIX}-process-${suffix}`,

      cidoIdentifier:
        `${TEST_PREFIX}-identifier-${suffix}`,

      title:
        `Convocatoria ${suffix}`,

      isJobPool:
        false,

      scopeId:
        1,

      scopeName:
        "Administración local",

      institutionName:
        institutionId
          ? "Ajuntament de Cardedeu"
          : "Organismo de prueba",

      institutionId:
        institutionId ??
        null,

      applicationStartDate:
        new Date(
          "2026-10-01T00:00:00.000Z",
        ),

      applicationEndDate:
        new Date(
          "2026-10-31T00:00:00.000Z",
        ),

      qualificationGroup:
        "A1",

      numberOfPositions:
        2,

      personnelType:
        "Funcionario",

      selectionSystem:
        "Concurso oposición",

      reservedDisabilityPositions:
        1,

      reservedUnemployed:
        false,

      reservedYoung:
        false,

      reservedWomen:
        true,

      cidoUrl:
        `https://cido.example/${suffix}`,

      statusId:
        2,

      status:
        "En proceso",

      sourceActive,
    },
  });
}

async function cleanTestData() {
  await prisma.selectionProcessDocument.deleteMany({
    where: {
      cidoId: {
        startsWith:
          `${TEST_PREFIX}-`,
      },
    },
  });

  await prisma.selectionProcess.deleteMany({
    where: {
      cidoId: {
        startsWith:
          `${TEST_PREFIX}-`,
      },
    },
  });

  await prisma.institution.deleteMany({
    where: {
      cidoId: {
        startsWith:
          `${TEST_PREFIX}-`,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        startsWith:
          `${TEST_PREFIX}-`,
      },
    },
  });
}