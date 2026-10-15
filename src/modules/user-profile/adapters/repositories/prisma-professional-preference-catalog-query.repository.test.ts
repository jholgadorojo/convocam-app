
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

import { PrismaProfessionalPreferenceCatalogQueryRepository } from "./prisma-professional-preference-catalog-query.repository";

describe(
  "PrismaProfessionalPreferenceCatalogQueryRepository",
  () => {
    // ========================================================
    // PREPARAR CLIENTE PRISMA SIMULADO
    // ========================================================

    function setup() {
      const subjectAreaCount = vi.fn();
      const selectionProcessFindMany = vi.fn();

      const prisma = {
        subjectArea: {
          count: subjectAreaCount,
        },
        selectionProcess: {
          findMany: selectionProcessFindMany,
        },
      } as unknown as PrismaClient;

      const repository =
        new PrismaProfessionalPreferenceCatalogQueryRepository(
          prisma,
        );

      return {
        repository,
        subjectAreaCount,
        selectionProcessFindMany,
      };
    }

    // ========================================================
    // TEST 1 — SELECCIONES VACÍAS
    // ========================================================

    it("acepta selecciones vacías sin consultar Prisma", async () => {
      const {
        repository,
        subjectAreaCount,
        selectionProcessFindMany,
      } = setup();

      expect(
        await repository.allSubjectAreasExist([]),
      ).toBe(true);

      expect(
        await repository.allQualificationGroupsExist([]),
      ).toBe(true);

      expect(subjectAreaCount).not.toHaveBeenCalled();

      expect(
        selectionProcessFindMany,
      ).not.toHaveBeenCalled();
    });

    // ========================================================
    // TEST 2 — MATERIAS EXISTENTES
    // ========================================================

    it("acepta varias materias existentes", async () => {
      const {
        repository,
        subjectAreaCount,
      } = setup();

      subjectAreaCount.mockResolvedValue(2);

      const result =
        await repository.allSubjectAreasExist([
          10,
          20,
        ]);

      expect(result).toBe(true);

      expect(subjectAreaCount).toHaveBeenCalledWith({
        where: {
          id: {
            in: [10, 20],
          },
        },
      });
    });

    // ========================================================
    // TEST 3 — MATERIA INEXISTENTE
    // ========================================================

    it("rechaza si falta alguna materia", async () => {
      const {
        repository,
        subjectAreaCount,
      } = setup();

      // Pedimos tres materias, pero solo existen dos.
      subjectAreaCount.mockResolvedValue(2);

      const result =
        await repository.allSubjectAreasExist([
          10,
          20,
          999,
        ]);

      expect(result).toBe(false);
    });

    // ========================================================
    // TEST 4 — MATERIAS DUPLICADAS
    // ========================================================

    it("no cuenta dos veces las materias repetidas", async () => {
      const {
        repository,
        subjectAreaCount,
      } = setup();

      subjectAreaCount.mockResolvedValue(2);

      const result =
        await repository.allSubjectAreasExist([
          10,
          10,
          20,
          20,
        ]);

      expect(result).toBe(true);

      expect(subjectAreaCount).toHaveBeenCalledWith({
        where: {
          id: {
            in: [10, 20],
          },
        },
      });
    });

    // ========================================================
    // TEST 5 — IDENTIFICADORES INVÁLIDOS
    // ========================================================

    it("rechaza identificadores de materias incorrectos", async () => {
      const {
        repository,
        subjectAreaCount,
      } = setup();

      expect(
        await repository.allSubjectAreasExist([
          0,
        ]),
      ).toBe(false);

      expect(
        await repository.allSubjectAreasExist([
          -1,
        ]),
      ).toBe(false);

      expect(
        await repository.allSubjectAreasExist([
          1.5,
        ]),
      ).toBe(false);

      expect(subjectAreaCount).not.toHaveBeenCalled();
    });

    // ========================================================
    // TEST 6 — GRUPOS EXISTENTES
    // ========================================================

    it("acepta varios grupos de titulación conocidos", async () => {
      const {
        repository,
        selectionProcessFindMany,
      } = setup();

      selectionProcessFindMany.mockResolvedValue([
        { qualificationGroup: "A1" },
        { qualificationGroup: "A2" },
        { qualificationGroup: "C1" },
        { qualificationGroup: "C2" },
      ]);

      const result =
        await repository.allQualificationGroupsExist([
          "A2",
          "C1",
        ]);

      expect(result).toBe(true);
    });

    // ========================================================
    // TEST 7 — GRUPO INEXISTENTE
    // ========================================================

    it("rechaza un grupo que no está en CIDO", async () => {
      const {
        repository,
        selectionProcessFindMany,
      } = setup();

      selectionProcessFindMany.mockResolvedValue([
        { qualificationGroup: "A1" },
        { qualificationGroup: "A2" },
        { qualificationGroup: "C1" },
      ]);

      const result =
        await repository.allQualificationGroupsExist([
          "A2",
          "GRUPO_INEXISTENTE",
        ]);

      expect(result).toBe(false);
    });

    // ========================================================
    // TEST 8 — NORMALIZACIÓN
    // ========================================================

    it("normaliza espacios y grupos duplicados", async () => {
      const {
        repository,
        selectionProcessFindMany,
      } = setup();

      selectionProcessFindMany.mockResolvedValue([
        { qualificationGroup: "A1" },
        { qualificationGroup: "C1" },
      ]);

      const result =
        await repository.allQualificationGroupsExist([
          " A1 ",
          "A1",
          "C1",
          " C1 ",
        ]);

      expect(result).toBe(true);
    });

    // ========================================================
    // TEST 9 — GRUPOS VACÍOS INCORRECTOS
    // ========================================================

    it("rechaza un grupo de titulación vacío", async () => {
      const {
        repository,
        selectionProcessFindMany,
      } = setup();

      const result =
        await repository.allQualificationGroupsExist([
          "A1",
          "   ",
        ]);

      expect(result).toBe(false);

      expect(
        selectionProcessFindMany,
      ).not.toHaveBeenCalled();
    });

    // ========================================================
    // TEST 10 — CATÁLOGO HISTÓRICO
    // ========================================================

    it("consulta los grupos CIDO sin limitarse a convocatorias activas", async () => {
      const {
        repository,
        selectionProcessFindMany,
      } = setup();

      selectionProcessFindMany.mockResolvedValue([
        { qualificationGroup: "A1" },
        { qualificationGroup: "A2" },
        { qualificationGroup: null },
      ]);

      const result =
        await repository.allQualificationGroupsExist([
          "A2",
        ]);

      expect(result).toBe(true);

      expect(
        selectionProcessFindMany,
      ).toHaveBeenCalledWith({
        where: {
          qualificationGroup: {
            not: null,
          },
        },
        select: {
          qualificationGroup: true,
        },
        distinct: ["qualificationGroup"],
      });
    });
  },
);
