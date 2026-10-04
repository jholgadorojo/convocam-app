import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/shared/infrastructure/database/prisma";

import { PrismaSelectionProcessQueryRepository } from "./prisma-selection-process-query-repository";

const PREFIX =
  "TEST-CONVOCAM-SEARCH";

describe(
  "PrismaSelectionProcessQueryRepository",
  () => {
    const repository =
      new PrismaSelectionProcessQueryRepository(
        prisma,
      );

    let institutionId: number;
    let otherInstitutionId: number;

    beforeAll(async () => {
      /*
       * Limpiamos posibles datos
       * sobrantes de una ejecución anterior.
       */
      await prisma.selectionProcess.deleteMany({
        where: {
          cidoId: {
            startsWith: PREFIX,
          },
        },
      });

      await prisma.institution.deleteMany({
        where: {
          cidoId: {
            startsWith: PREFIX,
          },
        },
      });

      /*
       * Institución principal.
       */
      const institution =
        await prisma.institution.create({
          data: {
            cidoId:
              `${PREFIX}-INSTITUTION-1`,

            name:
              "Institut Convocam Informàtica",

            shortName:
              "Convocam Test",

            isActive: true,

            municipality:
              "Municipi Convocam",

            county:
              "Vallès Convocam",

            province:
              "Barcelona Convocam",
          },
        });

      institutionId =
        institution.id;

      /*
       * Otra institución para comprobar
       * que el territorio filtra bien.
       */
      const otherInstitution =
        await prisma.institution.create({
          data: {
            cidoId:
              `${PREFIX}-INSTITUTION-2`,

            name:
              "Ajuntament Exterior",

            shortName:
              "Exterior",

            isActive: true,

            municipality:
              "Municipi Exterior",

            county:
              "Comarca Exterior",

            province:
              "Girona Convocam",
          },
        });

      otherInstitutionId =
        otherInstitution.id;

      /*
       * Convocatoria 1
       *
       * La mejor coincidencia para
       * "informatic" porque aparece
       * directamente en el título.
       */
      await prisma.selectionProcess.create({
        data: {
          cidoId:
            `${PREFIX}-SP-1`,

          cidoIdentifier:
            `${PREFIX}-IDENTIFIER-1`,

          title:
            "Tècnic informàtic",

          isJobPool: false,

          scopeId: 1,
          scopeName:
            "Administració local",

          institutionName:
            institution.name,

          institutionId,

          qualificationGroupId: 2,
          qualificationGroup:
            "A2",

          selectionSystemId: 1,
          selectionSystem:
            "Concurs oposició",

          personnelTypeId: 1,
          personnelType:
            "Funcionari",

          applicationEndDate:
            new Date(
              "2026-11-01T00:00:00.000Z",
            ),

          reservedDisabilityPositions:
            1,

          reservedUnemployed:
            false,

          reservedYoung:
            false,

          reservedWomen:
            false,

          cidoUrl:
            "https://example.com/test-1",

          statusId: 2,
          status:
            "Termini obert",

          sourceActive: true,
        },
      });

      /*
       * Convocatoria 2
       *
       * No contiene "informatic" en
       * el título, pero sí lo contiene
       * la institución.
       */
      await prisma.selectionProcess.create({
        data: {
          cidoId:
            `${PREFIX}-SP-2`,

          cidoIdentifier:
            `${PREFIX}-IDENTIFIER-2`,

          title:
            "Administratiu",

          isJobPool: false,

          scopeId: 1,
          scopeName:
            "Administració local",

          institutionName:
            institution.name,

          institutionId,

          qualificationGroupId: 4,
          qualificationGroup:
            "C1",

          selectionSystemId: 1,
          selectionSystem:
            "Concurs oposició",

          personnelTypeId: 1,
          personnelType:
            "Funcionari",

          applicationEndDate:
            new Date(
              "2026-12-01T00:00:00.000Z",
            ),

          reservedDisabilityPositions:
            0,

          reservedUnemployed:
            false,

          reservedYoung:
            false,

          reservedWomen:
            false,

          cidoUrl:
            "https://example.com/test-2",

          statusId: 2,
          status:
            "Termini obert",

          sourceActive: true,
        },
      });

      /*
       * Convocatoria 3
       *
       * Bolsa de trabajo y grupo C2.
       */
      await prisma.selectionProcess.create({
        data: {
          cidoId:
            `${PREFIX}-SP-3`,

          cidoIdentifier:
            `${PREFIX}-IDENTIFIER-3`,

          title:
            "Auxiliar administratiu",

          isJobPool: true,

          scopeId: 1,
          scopeName:
            "Administració local",

          institutionName:
            institution.name,

          institutionId,

          qualificationGroupId: 5,
          qualificationGroup:
            "C2",

          applicationEndDate:
            new Date(
              "2027-01-01T00:00:00.000Z",
            ),

          reservedDisabilityPositions:
            0,

          reservedUnemployed:
            true,

          reservedYoung:
            true,

          reservedWomen:
            false,

          cidoUrl:
            "https://example.com/test-3",

          statusId: 1,
          status:
            "Pendent de termini",

          sourceActive: true,
        },
      });

      /*
       * Convocatoria inactiva.
       *
       * Nunca debería aparecer.
       */
      await prisma.selectionProcess.create({
        data: {
          cidoId:
            `${PREFIX}-SP-INACTIVE`,

          cidoIdentifier:
            `${PREFIX}-IDENTIFIER-INACTIVE`,

          title:
            "Tècnic informàtic inactiu",

          isJobPool: false,

          scopeId: 1,
          scopeName:
            "Administració local",

          institutionName:
            institution.name,

          institutionId,

          qualificationGroup:
            "A2",

          reservedUnemployed:
            false,

          reservedYoung:
            false,

          reservedWomen:
            false,

          cidoUrl:
            "https://example.com/inactive",

          statusId: 2,
          status:
            "Termini obert",

          sourceActive: false,
        },
      });

      /*
       * Convocatoria de otro territorio.
       */
      await prisma.selectionProcess.create({
        data: {
          cidoId:
            `${PREFIX}-SP-OUTSIDE`,

          cidoIdentifier:
            `${PREFIX}-IDENTIFIER-OUTSIDE`,

          title:
            "Tècnic informàtic exterior",

          isJobPool: false,

          scopeId: 1,
          scopeName:
            "Administració local",

          institutionName:
            otherInstitution.name,

          institutionId:
            otherInstitutionId,

          qualificationGroup:
            "A2",

          reservedUnemployed:
            false,

          reservedYoung:
            false,

          reservedWomen:
            false,

          cidoUrl:
            "https://example.com/outside",

          statusId: 2,
          status:
            "Termini obert",

          sourceActive: true,
        },
      });
    });

    afterAll(async () => {
      await prisma.selectionProcess.deleteMany({
        where: {
          cidoId: {
            startsWith: PREFIX,
          },
        },
      });

      await prisma.institution.deleteMany({
        where: {
          cidoId: {
            startsWith: PREFIX,
          },
        },
      });

      await prisma.$disconnect();
    });

    it(
      "returns only active selection processes",
      async () => {
        const result =
          await repository.findActive(
            1,
            20,
            {
              municipality:
                "Municipi Convocam",
            },
          );

        expect(
          result.totalItems,
        ).toBe(3);

        expect(
          result.items.some(
            (item) =>
              item.cidoIdentifier ===
              `${PREFIX}-IDENTIFIER-INACTIVE`,
          ),
        ).toBe(false);
      },
    );

    it(
      "filters by province, county and municipality",
      async () => {
        const result =
          await repository.findActive(
            1,
            20,
            {
              province:
                "Barcelona Convocam",

              county:
                "Vallès Convocam",

              municipality:
                "Municipi Convocam",
            },
          );

        expect(
          result.totalItems,
        ).toBe(3);

        for (const item of result.items) {
          expect(
            item.institution
              ?.province,
          ).toBe(
            "Barcelona Convocam",
          );

          expect(
            item.institution
              ?.county,
          ).toBe(
            "Vallès Convocam",
          );

          expect(
            item.institution
              ?.municipality,
          ).toBe(
            "Municipi Convocam",
          );
        }
      },
    );

    it(
      "filters by multiple qualification groups",
      async () => {
        const result =
          await repository.findActive(
            1,
            20,
            {
              municipality:
                "Municipi Convocam",

              qualificationGroup: [
                "A2",
                "C1",
              ],
            },
          );

        expect(
          result.totalItems,
        ).toBe(2);

        expect(
          result.items.map(
            (item) =>
              item.qualificationGroup,
          ),
        ).toEqual(
          expect.arrayContaining([
            "A2",
            "C1",
          ]),
        );
      },
    );

    it(
      "filters job pools",
      async () => {
        const result =
          await repository.findActive(
            1,
            20,
            {
              municipality:
                "Municipi Convocam",

              isJobPool: true,
            },
          );

        expect(
          result.totalItems,
        ).toBe(1);

        expect(
          result.items[0]
            .isJobPool,
        ).toBe(true);
      },
    );

    it(
      "finds text ignoring accents",
      async () => {
        const result =
          await repository.findActive(
            1,
            20,
            {
              text:
                "informatic",

              municipality:
                "Municipi Convocam",
            },
          );

        expect(
          result.totalItems,
        ).toBeGreaterThan(0);

        expect(
          result.items.some(
            (item) =>
              item.title ===
              "Tècnic informàtic",
          ),
        ).toBe(true);
      },
    );

    it(
      "supports tolerant text search",
      async () => {
        const result =
          await repository.findActive(
            1,
            20,
            {
              text:
                "informatics",

              municipality:
                "Municipi Convocam",
            },
          );

        expect(
          result.items.some(
            (item) =>
              item.title ===
              "Tècnic informàtic",
          ),
        ).toBe(true);
      },
    );

    it(
      "orders text results by relevance",
      async () => {
        const result =
          await repository.findActive(
            1,
            20,
            {
              text:
                "informatic",

              municipality:
                "Municipi Convocam",
            },
          );

        /*
         * SP-1 tiene informàtic
         * directamente en el título.
         *
         * SP-2 solamente lo encuentra
         * por el nombre de institución.
         *
         * Por tanto SP-1 debe ir primero.
         */
        expect(
          result.items[0]
            .cidoIdentifier,
        ).toBe(
          `${PREFIX}-IDENTIFIER-1`,
        );
      },
    );

    it(
      "paginates results",
      async () => {
        const firstPage =
          await repository.findActive(
            1,
            2,
            {
              municipality:
                "Municipi Convocam",
            },
          );

        expect(
          firstPage.totalItems,
        ).toBe(3);

        expect(
          firstPage.totalPages,
        ).toBe(2);

        expect(
          firstPage.items,
        ).toHaveLength(2);

        const secondPage =
          await repository.findActive(
            2,
            2,
            {
              municipality:
                "Municipi Convocam",
            },
          );

        expect(
          secondPage.items,
        ).toHaveLength(1);

        expect(
          secondPage.page,
        ).toBe(2);
      },
    );

    it(
      "orders results by application end date when there is no text search",
      async () => {
        const result =
          await repository.findActive(
            1,
            20,
            {
              municipality:
                "Municipi Convocam",
            },
          );

        expect(
          result.items.map(
            (item) =>
              item.cidoIdentifier,
          ),
        ).toEqual([
          `${PREFIX}-IDENTIFIER-1`,
          `${PREFIX}-IDENTIFIER-2`,
          `${PREFIX}-IDENTIFIER-3`,
        ]);
      },
    );
  },
);