
import type { PrismaClient } from "@/generated/prisma/client";

import type { TerritorialCatalogQueryRepository } from "../../application/repositories/territorial-catalog-query.repository";

import type { TerritorialSelection } from "../../domain/user-territorial-preference";

// ============================================================
// REPOSITORIO DE CONSULTA DEL CATÁLOGO TERRITORIAL
// ============================================================

export class PrismaTerritorialCatalogQueryRepository
  implements TerritorialCatalogQueryRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  // ==========================================================
  // COMPROBAR QUE TODOS LOS TERRITORIOS EXISTEN
  // ==========================================================

  async allTerritoriesExist(
    selection: TerritorialSelection,
  ): Promise<boolean> {
    // --------------------------------------------------------
    // 1. COMPROBAR LA ESTRUCTURA RECIBIDA
    // --------------------------------------------------------

    if (
      !Array.isArray(selection.provinceIds) ||
      !Array.isArray(selection.countyIds) ||
      !Array.isArray(selection.municipalityIds)
    ) {
      return false;
    }

    // --------------------------------------------------------
    // 2. ELIMINAR IDENTIFICADORES DUPLICADOS
    // --------------------------------------------------------

    const provinceIds = [
      ...new Set(selection.provinceIds),
    ];

    const countyIds = [
      ...new Set(selection.countyIds),
    ];

    const municipalityIds = [
      ...new Set(selection.municipalityIds),
    ];

    // --------------------------------------------------------
    // 3. VALIDAR IDENTIFICADORES
    // --------------------------------------------------------

    const allIds = [
      ...provinceIds,
      ...countyIds,
      ...municipalityIds,
    ];

    const MAX_DATABASE_ID = 2147483647;

    const hasInvalidId = allIds.some(
      (id) =>
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        id > MAX_DATABASE_ID,
    );

    if (hasInvalidId) {
      return false;
    }

    // --------------------------------------------------------
    // 4. CONSULTAR EL CATÁLOGO TERRITORIAL
    // --------------------------------------------------------

    const [
      provinceCount,
      countyCount,
      municipalityCount,
    ] = await Promise.all([
      this.prisma.province.count({
        where: {
          id: {
            in: provinceIds,
          },
        },
      }),

      this.prisma.county.count({
        where: {
          id: {
            in: countyIds,
          },
        },
      }),

      this.prisma.municipality.count({
        where: {
          id: {
            in: municipalityIds,
          },
        },
      }),
    ]);

    // --------------------------------------------------------
    // 5. VERIFICAR QUE TODOS EXISTEN
    // --------------------------------------------------------

    return (
      provinceCount === provinceIds.length &&
      countyCount === countyIds.length &&
      municipalityCount === municipalityIds.length
    );
  }
}
