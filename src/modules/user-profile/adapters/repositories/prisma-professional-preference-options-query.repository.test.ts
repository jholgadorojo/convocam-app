
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

import { PrismaProfessionalPreferenceOptionsQueryRepository } from "./prisma-professional-preference-options-query.repository";

describe(
  "PrismaProfessionalPreferenceOptionsQueryRepository",
  () => {
    type SubjectAreaRow = {
      id: number;
      name: string;
    };

    type QualificationGroupRow = {
      qualificationGroup: string | null;
    };

    function setup(
      subjectAreas: SubjectAreaRow[] = [],
      qualificationGroups: QualificationGroupRow[] = [],
    ) {
      const subjectAreaFindMany = vi
        .fn()
        .mockResolvedValue(subjectAreas);

      const selectionProcessFindMany = vi
        .fn()
        .mockResolvedValue(qualificationGroups);

      const prisma = {
        subjectArea: {
          findMany: subjectAreaFindMany,
        },
        selectionProcess: {
          findMany: selectionProcessFindMany,
        },
      } as unknown as PrismaClient;

      const repository =
        new PrismaProfessionalPreferenceOptionsQueryRepository(
          prisma,
        );

      return {
        repository,
        subjectAreaFindMany,
        selectionProcessFindMany,
      };
    }

    // ========================================================
    // TEST 1 — CATÁLOGOS VACÍOS
    // ========================================================

    it("devuelve arrays vacíos si no existen opciones", async () => {
      const { repository } = setup();

      const result = await repository.listAll();

      expect(result).toEqual({
        subjectAreas: [],
        qualificationGroups: [],
      });
    });

    // ========================================================
    // TEST 2 — ORDENAR MATERIAS
    // ========================================================

    it("recupera y ordena las materias por nombre", async () => {
      const { repository } = setup([
        { id: 30, name: "Informática" },
        { id: 10, name: "Administración" },
        { id: 20, name: "Educación" },
      ]);

      const result = await repository.listAll();

      expect(result.subjectAreas).toEqual([
        { id: 10, name: "Administración" },
        { id: 20, name: "Educación" },
        { id: 30, name: "Informática" },
      ]);
    });

    // ========================================================
    // TEST 3 — NORMALIZAR MATERIAS
    // ========================================================

    it("elimina espacios y nombres vacíos", async () => {
      const { repository } = setup([
        { id: 10, name: " Informática " },
        { id: 20, name: "  " },
        { id: 30, name: "Administración" },
      ]);

      const result = await repository.listAll();

      expect(result.subjectAreas).toEqual([
        { id: 30, name: "Administración" },
        { id: 10, name: "Informática" },
      ]);
    });

    // ========================================================
    // TEST 4 — NORMALIZAR GRUPOS
    // ========================================================

    it("elimina duplicados y ordena los grupos", async () => {
      const { repository } = setup(
        [],
        [
          { qualificationGroup: "C1" },
          { qualificationGroup: " A2 " },
          { qualificationGroup: "A1" },
          { qualificationGroup: "A2" },
          { qualificationGroup: null },
          { qualificationGroup: "   " },
        ],
      );

      const result = await repository.listAll();

      expect(result.qualificationGroups).toEqual([
        "A1",
        "A2",
        "C1",
      ]);
    });

    // ========================================================
    // TEST 5 — CONSERVAR MATERIAS CON NOMBRE IGUAL
    // ========================================================

    it("conserva materias diferentes aunque tengan el mismo nombre", async () => {
      const { repository } = setup([
        { id: 20, name: "Informática" },
        { id: 10, name: "Informática" },
      ]);

      const result = await repository.listAll();

      expect(result.subjectAreas).toEqual([
        { id: 10, name: "Informática" },
        { id: 20, name: "Informática" },
      ]);
    });

    // ========================================================
    // TEST 6 — CONSULTAR HISTÓRICO CIDO
    // ========================================================

    it("consulta los catálogos sin filtrar por convocatorias activas", async () => {
      const {
        repository,
        subjectAreaFindMany,
        selectionProcessFindMany,
      } = setup();

      await repository.listAll();

      expect(subjectAreaFindMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
      });

      expect(selectionProcessFindMany).toHaveBeenCalledWith({
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
