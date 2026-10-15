
import type { PrismaClient } from "@/generated/prisma/client";

import type {
  ProfessionalPreferenceOptionsDto,
} from "../../application/dto/professional-preference-options.dto";

import type {
  ProfessionalPreferenceOptionsQueryRepository,
} from "../../application/repositories/professional-preference-options-query.repository";

// ============================================================
// REPOSITORIO PRISMA: OPCIONES PROFESIONALES
// ============================================================

export class PrismaProfessionalPreferenceOptionsQueryRepository
  implements ProfessionalPreferenceOptionsQueryRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  // ==========================================================
  // OBTENER OPCIONES DISPONIBLES
  // ==========================================================

  async listAll(): Promise<ProfessionalPreferenceOptionsDto> {
    // --------------------------------------------------------
    // 1. CONSULTAR MATERIAS Y GRUPOS DE CIDO
    // --------------------------------------------------------

    const [
      subjectAreaRows,
      qualificationGroupRows,
    ] = await Promise.all([
      this.prisma.subjectArea.findMany({
        select: {
          id: true,
          name: true,
        },
      }),

      this.prisma.selectionProcess.findMany({
        where: {
          qualificationGroup: {
            not: null,
          },
        },
        select: {
          qualificationGroup: true,
        },
        distinct: ["qualificationGroup"],
      }),
    ]);

    // --------------------------------------------------------
    // 2. NORMALIZAR Y ORDENAR MATERIAS
    // --------------------------------------------------------

    const subjectAreas = subjectAreaRows
      .map((row) => ({
        id: row.id,
        name: row.name.trim(),
      }))
      .filter((row) => row.name.length > 0)
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name, "ca", {
            sensitivity: "base",
          }) || a.id - b.id,
      );

    // --------------------------------------------------------
    // 3. NORMALIZAR GRUPOS DE TITULACIÓN
    // --------------------------------------------------------

    const groups = qualificationGroupRows.flatMap(
      (row) => {
        const group =
          row.qualificationGroup?.trim();

        return group ? [group] : [];
      },
    );

    // --------------------------------------------------------
    // 4. ELIMINAR DUPLICADOS Y ORDENAR GRUPOS
    // --------------------------------------------------------

    const qualificationGroups = [
      ...new Set(groups),
    ].sort((a, b) =>
      a.localeCompare(b, "ca", {
        numeric: true,
        sensitivity: "base",
      }),
    );

    // --------------------------------------------------------
    // 5. DEVOLVER OPCIONES
    // --------------------------------------------------------

    return {
      subjectAreas,
      qualificationGroups,
    };
  }
}
