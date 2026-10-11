import { PrismaClient } from "@/generated/prisma/client";

import { MunicipalityQueryRepository } from "../../application/repositories/municipality-query.repository";

export class PrismaMunicipalityQueryRepository
  implements MunicipalityQueryRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async existsById(municipalityId: number): Promise<boolean> {
    const municipality = await this.prisma.municipality.findUnique({
      where: {
        id: municipalityId,
      },
      select: {
        id: true,
      },
    });

    return municipality !== null;
  }
}