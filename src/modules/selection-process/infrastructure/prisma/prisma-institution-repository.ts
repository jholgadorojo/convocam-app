import type { PrismaClient } from "@/generated/prisma/client";

import type { InstitutionRepository } from "../../application/institution-repository";
import type { InstitutionSyncData } from "../../application/institution-sync-data";

export class PrismaInstitutionRepository
  implements InstitutionRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async upsert(
    data: InstitutionSyncData,
  ): Promise<number> {
    const institution =
      await this.prisma.institution.upsert({
        where: {
          cidoId: data.cidoId,
        },

        create: {
          ...data,
        },

        update: {
          ...data,
        },

        select: {
          id: true,
        },
      });

    return institution.id;
  }
}