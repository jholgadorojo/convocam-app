import { PrismaClient } from "@/generated/prisma/client";

import {
  MunicipalityListItem,
  MunicipalityQueryRepository,
} from "../../application/repositories/municipality-query.repository";

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

  async listAll(): Promise<MunicipalityListItem[]> {
    const municipalities = await this.prisma.municipality.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        county: {
          select: {
            name: true,
          },
        },
        province: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { name: "asc" },
        { code: "asc" },
      ],
    });

    return municipalities.map((municipality) => ({
      id: municipality.id,
      code: municipality.code,
      name: municipality.name,
      countyName: municipality.county.name,
      provinceName: municipality.province.name,
    }));
  }
}