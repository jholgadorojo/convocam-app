
import type { PrismaClient } from "@/generated/prisma/client";

import type { ProfessionalPreferenceCatalogQueryRepository } from "../../application/repositories/professional-preference-catalog-query.repository";

// ============================================================
// CATÁLOGO CIDO PARA PREFERENCIAS PROFESIONALES
// ============================================================

export class PrismaProfessionalPreferenceCatalogQueryRepository
  implements ProfessionalPreferenceCatalogQueryRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  // ==========================================================
  // COMPROBAR ÁREAS Y MATERIAS PROFESIONALES
  // ==========================================================

  async allSubjectAreasExist(
    subjectAreaIds: number[],
  ): Promise<boolean> {
    if (!Array.isArray(subjectAreaIds)) {
      return false;
    }

    // Evitar identificadores inválidos.
    if (
      subjectAreaIds.some(
        (id) =>
          !Number.isSafeInteger(id) ||
          id <= 0,
      )
    ) {
      return false;
    }

    // Evitar comprobar dos veces una misma materia.
    const uniqueIds = [...new Set(subjectAreaIds)];

    // No seleccionar materias es válido.
    if (uniqueIds.length === 0) {
      return true;
    }

    // Contar las materias que existen en CIDO.
    const existingCount =
      await this.prisma.subjectArea.count({
        where: {
          id: {
            in: uniqueIds,
          },
        },
      });

    // Todas deben existir.
    return existingCount === uniqueIds.length;
  }

  // ==========================================================
  // COMPROBAR GRUPOS DE TITULACIÓN
  // ==========================================================

  async allQualificationGroupsExist(
    qualificationGroups: string[],
  ): Promise<boolean> {
    if (!Array.isArray(qualificationGroups)) {
      return false;
    }

    // Rechazar cadenas vacías o valores incorrectos.
    if (
      qualificationGroups.some(
        (group) =>
          typeof group !== "string" ||
          group.trim().length === 0,
      )
    ) {
      return false;
    }

    // Normalizar espacios y eliminar duplicados.
    const requestedGroups = [
      ...new Set(
        qualificationGroups.map(
          (group) => group.trim(),
        ),
      ),
    ];

    // No seleccionar grupos es válido.
    if (requestedGroups.length === 0) {
      return true;
    }

    // Obtener los grupos conocidos por CIDO.
    // Incluimos el histórico de convocatorias.
    const rows =
      await this.prisma.selectionProcess.findMany({
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

    // Construir conjunto de valores disponibles.
    const availableGroups = new Set(
      rows.flatMap((row) => {
        const group =
          row.qualificationGroup?.trim();

        return group ? [group] : [];
      }),
    );

    // Todos los grupos solicitados deben existir.
    return requestedGroups.every(
      (group) => availableGroups.has(group),
    );
  }
}
