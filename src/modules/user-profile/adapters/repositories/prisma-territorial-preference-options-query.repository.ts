
import type { PrismaClient } from "@/generated/prisma/client";

import type {
  TerritorialPreferenceOptionsDto,
} from "../../application/dto/territorial-preference-options.dto";

import type {
  TerritorialPreferenceOptionsQueryRepository,
} from "../../application/repositories/territorial-preference-options-query.repository";

// ============================================================
// CONSULTA DE OPCIONES PARA PREFERENCIAS TERRITORIALES
// ============================================================

export class PrismaTerritorialPreferenceOptionsQueryRepository
  implements TerritorialPreferenceOptionsQueryRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async listAll(): Promise<TerritorialPreferenceOptionsDto> {
    const [provinces, counties, municipalities] =
      await Promise.all([
        // ----------------------------------------------------
        // PROVINCIAS
        // ----------------------------------------------------
        this.prisma.province.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: [
            { name: "asc" },
            { id: "asc" },
          ],
        }),

        // ----------------------------------------------------
        // COMARCAS
        // ----------------------------------------------------
        this.prisma.county.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: [
            { name: "asc" },
            { id: "asc" },
          ],
        }),

        // ----------------------------------------------------
        // MUNICIPIOS
        // ----------------------------------------------------
        this.prisma.municipality.findMany({
          select: {
            id: true,
            name: true,
            countyId: true,
            provinceId: true,
          },
          orderBy: [
            { name: "asc" },
            { id: "asc" },
          ],
        }),
      ]);

    return {
      provinces,
      counties,
      municipalities,
    };
  }
}
