import {
  Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import type { UserSelectionProcessListItem } from "../../application/user-selection-process-list-item";
import type { UserSelectionProcessQueryRepository } from "../../application/user-selection-process-query-repository";

import { PersonalSelectionProcessStatus } from "../../domain/personal-selection-process-status";

type UserSelectionProcessRow =
  Prisma.UserSelectionProcessGetPayload<{
    include: {
      selectionProcess: {
        include: {
          institution: true;
        };
      };
    };
  }>;

export class PrismaUserSelectionProcessQueryRepository
  implements UserSelectionProcessQueryRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) { }

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
            },
          },
        },

        orderBy: {
          followedAt: "desc",
        },
      });

    return rows.map(
      mapUserSelectionProcessListItem,
    );
  }
}

function mapUserSelectionProcessListItem(
  row: UserSelectionProcessRow,
): UserSelectionProcessListItem {
  const selectionProcess =
    row.selectionProcess;

  return {
    id: row.id,

    personalStatus:
      mapPersonalStatus(
        row.personalStatus,
      ),

    followedAt:
      row.followedAt,

    personalStatusUpdatedAt:
      row.personalStatusUpdatedAt,

    selectionProcess: {
      id: selectionProcess.id,

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

      institution:
        selectionProcess.institution
          ? {
            name:
              selectionProcess.institution.name,

            municipality:
              selectionProcess.institution
                .municipality,

            county:
              selectionProcess.institution
                .county,

            province:
              selectionProcess.institution
                .province,
          }
          : null,
    },
  };
}

function mapPersonalStatus(
  status:
    UserSelectionProcessRow["personalStatus"],
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
        "Estado personal no reconocido.",
      );
  }
}