
import type { PrismaClient } from "@/generated/prisma/client";

import type { UserSelectionProcessListItem } from "../../application/user-selection-process-list-item";

import type { UserSelectionProcessQueryRepository } from "../../application/user-selection-process-query-repository";

import { PersonalSelectionProcessStatus } from "../../domain/personal-selection-process-status";

export class PrismaUserSelectionProcessQueryRepository
  implements UserSelectionProcessQueryRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async findByUser(
    userId: string,
  ): Promise<UserSelectionProcessListItem[]> {
    const rows =
      await this.prisma.userSelectionProcess.findMany({
        where: {
          userId,
        },

        include: {
          selectionProcess: {
            include: {
              institution: true,

              /**
               * Solo necesitamos el documento
               * oficial más reciente.
               *
               * No cargamos todos los documentos
               * de la convocatoria.
               */
              documents: {
                where: {
                  sourceActive: true,
                },

                orderBy: [
                  {
                    publicationDate: "desc",
                  },
                  {
                    id: "desc",
                  },
                ],

                take: 1,
              },
            },
          },
        },

        orderBy: {
          followedAt: "desc",
        },
      });

    return rows.map((row) => {
      const selectionProcess =
        row.selectionProcess;

      const latestDocument =
        selectionProcess.documents[0] ??
        null;

      return {
        id: row.id,

        personalStatus:
          mapPersonalSelectionProcessStatus(
            row.personalStatus,
          ),

        followedAt:
          row.followedAt,

        personalStatusUpdatedAt:
          row.personalStatusUpdatedAt,

        selectionProcess: {
          id:
            selectionProcess.id,

          cidoIdentifier:
            selectionProcess.cidoIdentifier,

          title:
            selectionProcess.title,

          isJobPool:
            selectionProcess.isJobPool,

          statusId:
            selectionProcess.statusId,

          status:
            selectionProcess.status,

          applicationStartDate:
            selectionProcess.applicationStartDate,

          applicationEndDate:
            selectionProcess.applicationEndDate,

          qualificationGroup:
            selectionProcess.qualificationGroup,

          numberOfPositions:
            selectionProcess.numberOfPositions,

          personnelType:
            selectionProcess.personnelType,

          selectionSystem:
            selectionProcess.selectionSystem,

          scope:
            selectionProcess.scopeName,

          reservedPlaces: {
            disability:
              selectionProcess.reservedDisabilityPositions,

            unemployed:
              selectionProcess.reservedUnemployed,

            youngPeople:
              selectionProcess.reservedYoung,

            women:
              selectionProcess.reservedWomen,
          },

          sourceActive:
            selectionProcess.sourceActive,

          cidoUrl:
            selectionProcess.cidoUrl,

          /**
           * Documento oficial más reciente.
           *
           * Si la convocatoria todavía no tiene
           * documentos, devolvemos null.
           */
          latestDocument:
            latestDocument
              ? {
                  publicationDate:
                    latestDocument.publicationDate,

                  documentUrl:
                    latestDocument.documentUrl,

                  htmlUrl:
                    latestDocument.htmlUrl,
                }
              : null,

          /**
           * Institución asociada a la convocatoria.
           *
           * Incorporamos las coordenadas existentes
           * en PostgreSQL para el mapa de seguimiento.
           *
           * Prisma devuelve Decimal.
           * Lo convertimos a number.
           *
           * Si no existen coordenadas,
           * mantenemos null.
           */
          institution:
            selectionProcess.institution
              ? {
                  name:
                    selectionProcess
                      .institution
                      .name,

                  municipality:
                    selectionProcess
                      .institution
                      .municipality,

                  county:
                    selectionProcess
                      .institution
                      .county,

                  province:
                    selectionProcess
                      .institution
                      .province,

                  latitude:
                    selectionProcess
                      .institution
                      .latitude
                      ?.toNumber() ?? null,

                  longitude:
                    selectionProcess
                      .institution
                      .longitude
                      ?.toNumber() ?? null,
                }
              : null,
        },
      };
    });
  }
}

function mapPersonalSelectionProcessStatus(
  status: string,
): PersonalSelectionProcessStatus {
  switch (status) {
    case "INTERESTED":
      return PersonalSelectionProcessStatus.INTERESTED;

    case "PREPARING_APPLICATION":
      return PersonalSelectionProcessStatus.PREPARING_APPLICATION;

    case "APPLICATION_SUBMITTED":
      return PersonalSelectionProcessStatus.APPLICATION_SUBMITTED;

    case "ADMITTED":
      return PersonalSelectionProcessStatus.ADMITTED;

    case "EXCLUDED":
      return PersonalSelectionProcessStatus.EXCLUDED;

    case "EXAM_PENDING":
      return PersonalSelectionProcessStatus.EXAM_PENDING;

    case "EXAM_COMPLETED":
      return PersonalSelectionProcessStatus.EXAM_COMPLETED;

    case "COMPLETED":
      return PersonalSelectionProcessStatus.COMPLETED;

    default:
      throw new Error(
        `Estado personal no soportado: ${status}`,
      );
  }
}
