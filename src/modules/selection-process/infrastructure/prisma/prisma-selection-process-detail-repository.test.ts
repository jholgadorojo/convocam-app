import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/shared/infrastructure/database/prisma";

import { PrismaSelectionProcessDetailRepository } from "./prisma-selection-process-detail-repository";

const TEST_PREFIX =
  "TEST-CONVOCAM-DETAIL";

const repository =
  new PrismaSelectionProcessDetailRepository(
    prisma,
  );

let selectionProcessId: number;

describe(
  "PrismaSelectionProcessDetailRepository",
  () => {
    beforeAll(async () => {
      /*
       * Limpiamos posibles datos de una
       * ejecución anterior.
       */
      await cleanTestData();

      /*
       * Institución.
       */
      const institution =
        await prisma.institution.create({
          data: {
            cidoId:
              `${TEST_PREFIX}-INSTITUTION`,

            name:
              "Ajuntament de Convocam Test",

            shortName:
              "Convocam Test",

            isActive:
              true,

            latitude:
              "41.6380000",

            longitude:
              "2.3547000",

            address:
              "Carrer de Prova, 1",

            postalCode:
              "08440",

            municipality:
              "Cardedeu",

            county:
              "Vallès Oriental",

            province:
              "Barcelona",
          },
        });

      /*
       * Materias.
       */
      const subjectArea1 =
        await prisma.subjectArea.create({
          data: {
            cidoId:
              `${TEST_PREFIX}-SUBJECT-1`,

            name:
              "Informàtica",

            cidoModuleId:
              1,
          },
        });

      const subjectArea2 =
        await prisma.subjectArea.create({
          data: {
            cidoId:
              `${TEST_PREFIX}-SUBJECT-2`,

            name:
              "Administració pública",

            cidoModuleId:
              1,
          },
        });

      /*
       * Convocatoria.
       */
      const selectionProcess =
        await prisma.selectionProcess.create({
          data: {
            cidoId:
              `${TEST_PREFIX}-PROCESS`,

            cidoIdentifier:
              `${TEST_PREFIX}-001`,

            fileNumber:
              "EXP-TEST-001",

            publicOfferYear:
              2026,

            title:
              "3 places de tècnic auxiliar d'informàtica",

            isJobPool:
              false,

            scopeId:
              1,

            scopeName:
              "Local",

            institutionName:
              institution.name,

            institutionId:
              institution.id,

            numberOfPositions:
              3,

            qualificationGroupId:
              3,

            qualificationGroup:
              "C1",

            applicationStartDate:
              new Date(
                "2026-10-01T00:00:00.000Z",
              ),

            applicationEndDate:
              new Date(
                "2026-10-20T00:00:00.000Z",
              ),

            applicationEndTime:
              "23:59",

            applicationDeadlineNotes:
              "Presentació telemàtica.",

            selectionSystemId:
              1,

            selectionSystem:
              "Concurs oposició",

            personnelTypeId:
              1,

            personnelType:
              "Funcionari",

            requiredQualification:
              "Batxillerat o equivalent",

            otherRequirements:
              "Coneixements de català.",

            firstExamDate:
              new Date(
                "2026-11-15T00:00:00.000Z",
              ),

            observations:
              "Convocatòria de prova.",

            applicationUrl:
              "https://example.com/sollicitud",

            institutionUrl:
              "https://example.com/institucio",

            cidoUrl:
              "https://cido.diba.cat/oposicions/test",

            lastDocumentPublicationDate:
              new Date(
                "2026-10-05T00:00:00.000Z",
              ),

            reservedDisabilityPositions:
              2,

            reservedUnemployed:
              true,

            reservedYoung:
              false,

            reservedWomen:
              true,

            statusId:
              1,

            status:
              "Termini obert",

            sourceActive:
              true,
          },
        });

      selectionProcessId =
        selectionProcess.id;

      /*
       * Relaciones con materias.
       */
      await prisma.selectionProcessSubjectArea.createMany({
        data: [
          {
            selectionProcessId:
              selectionProcess.id,

            subjectAreaId:
              subjectArea1.id,
          },
          {
            selectionProcessId:
              selectionProcess.id,

            subjectAreaId:
              subjectArea2.id,
          },
        ],
      });

      /*
       * Documentos oficiales.
       *
       * Creamos dos con fechas diferentes
       * para comprobar también que el
       * repositorio devuelve primero el
       * más reciente.
       */
      await prisma.selectionProcessDocument.createMany({
        data: [
          {
            cidoId:
              `${TEST_PREFIX}-DOCUMENT-1`,

            selectionProcessId:
              selectionProcess.id,

            publicationDate:
              new Date(
                "2026-09-25T00:00:00.000Z",
              ),

            summary:
              "Bases específiques",

            publisher:
              "Ajuntament de Convocam Test",

            bulletinId:
              1,

            bulletin:
              "BOPB",

            bulletinNumber:
              180,

            entryDate:
              new Date(
                "2026-09-25T00:00:00.000Z",
              ),

            phaseId:
              1,

            phase:
              "Bases",

            phaseNotes:
              null,

            documentUrl:
              "https://example.com/bases.pdf",

            htmlUrl:
              "https://example.com/bases",
          },

          {
            cidoId:
              `${TEST_PREFIX}-DOCUMENT-2`,

            selectionProcessId:
              selectionProcess.id,

            publicationDate:
              new Date(
                "2026-10-05T00:00:00.000Z",
              ),

            summary:
              "Convocatòria oficial",

            publisher:
              "Ajuntament de Convocam Test",

            bulletinId:
              1,

            bulletin:
              "BOPB",

            bulletinNumber:
              187,

            entryDate:
              new Date(
                "2026-10-05T00:00:00.000Z",
              ),

            phaseId:
              2,

            phase:
              "Convocatòria",

            phaseNotes:
              "Obertura del termini.",

            documentUrl:
              "https://example.com/convocatoria.pdf",

            htmlUrl:
              "https://example.com/convocatoria",
          },
        ],
      });
    });

    afterAll(async () => {
      await cleanTestData();

      await prisma.$disconnect();
    });

    it(
      "returns an existing selection process detail",
      async () => {
        const result =
          await repository.findById(
            selectionProcessId,
          );

        expect(result).not.toBeNull();

        expect(result?.id).toBe(
          selectionProcessId,
        );

        expect(
          result?.cidoIdentifier,
        ).toBe(
          `${TEST_PREFIX}-001`,
        );

        expect(result?.title).toBe(
          "3 places de tècnic auxiliar d'informàtica",
        );

        expect(
          result?.isJobPool,
        ).toBe(false);

        /*
         * Importante:
         *
         * Prisma guarda scopeName,
         * pero el DTO expone scope.
         */
        expect(result?.scope).toBe(
          "Local",
        );

        expect(
          result?.numberOfPositions,
        ).toBe(3);

        expect(
          result?.qualificationGroup,
        ).toBe("C1");

        expect(
          result?.selectionSystem,
        ).toBe(
          "Concurs oposició",
        );

        expect(
          result?.personnelType,
        ).toBe(
          "Funcionari",
        );

        expect(result?.status).toBe(
          "Termini obert",
        );
      },
    );

    it(
      "returns null when the selection process does not exist",
      async () => {
        const result =
          await repository.findById(
            -1,
          );

        expect(result).toBeNull();
      },
    );

    it(
      "maps institution, subject areas, documents and reserved places",
      async () => {
        const result =
          await repository.findById(
            selectionProcessId,
          );

        expect(result).not.toBeNull();

        /*
         * Institución.
         */
        expect(
          result?.institution,
        ).toMatchObject({
          name:
            "Ajuntament de Convocam Test",

          shortName:
            "Convocam Test",

          address:
            "Carrer de Prova, 1",

          postalCode:
            "08440",

          municipality:
            "Cardedeu",

          county:
            "Vallès Oriental",

          province:
            "Barcelona",

          latitude:
            41.638,

          longitude:
            2.3547,
        });

        /*
         * Materias.
         *
         * No dependemos del orden porque
         * el repositorio no necesita
         * garantizarlo.
         */
        expect(
          result?.subjectAreas,
        ).toHaveLength(2);

        expect(
          result?.subjectAreas,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name:
                "Informàtica",
            }),

            expect.objectContaining({
              name:
                "Administració pública",
            }),
          ]),
        );

        /*
         * Plazas reservadas.
         */
        expect(
          result?.reservedPlaces,
        ).toEqual({
          disability:
            2,

          unemployed:
            true,

          youngPeople:
            false,

          women:
            true,
        });

        /*
         * Documentos.
         *
         * El repositorio debe devolverlos
         * ordenados por publicationDate DESC.
         *
         * Por tanto:
         *
         * 05/10/2026
         * 25/09/2026
         */
        expect(
          result?.documents,
        ).toHaveLength(2);

        expect(
          result?.documents[0],
        ).toMatchObject({
          summary:
            "Convocatòria oficial",

          publisher:
            "Ajuntament de Convocam Test",

          bulletin:
            "BOPB",

          bulletinNumber:
            187,

          phase:
            "Convocatòria",

          phaseNotes:
            "Obertura del termini.",

          documentUrl:
            "https://example.com/convocatoria.pdf",

          htmlUrl:
            "https://example.com/convocatoria",
        });

        expect(
          result?.documents[1],
        ).toMatchObject({
          summary:
            "Bases específiques",

          bulletin:
            "BOPB",

          bulletinNumber:
            180,

          phase:
            "Bases",

          documentUrl:
            "https://example.com/bases.pdf",

          htmlUrl:
            "https://example.com/bases",
        });
      },
    );
  },
);

/*
 * La limpieza utiliza nuestro prefijo
 * exclusivo de test.
 *
 * Nunca borra convocatorias reales.
 */
async function cleanTestData() {
  /*
   * Al eliminar SelectionProcess,
   * documentos y relaciones con materias
   * se eliminan por CASCADE.
   */
  await prisma.selectionProcess.deleteMany({
    where: {
      cidoIdentifier: {
        startsWith:
          TEST_PREFIX,
      },
    },
  });

  await prisma.subjectArea.deleteMany({
    where: {
      cidoId: {
        startsWith:
          TEST_PREFIX,
      },
    },
  });

  await prisma.institution.deleteMany({
    where: {
      cidoId: {
        startsWith:
          TEST_PREFIX,
      },
    },
  });
}