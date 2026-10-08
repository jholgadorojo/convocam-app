import {
  PersonalSelectionProcessStatus as PrismaPersonalSelectionProcessStatus,
  type UserSelectionProcess as PrismaUserSelectionProcess,
} from "@/generated/prisma/client";

import { PersonalSelectionProcessStatus } from "../../domain/personal-selection-process-status";
import { UserSelectionProcess } from "../../domain/user-selection-process";

export class UserSelectionProcessMapper {
  static toDomain(
    row: PrismaUserSelectionProcess,
  ): UserSelectionProcess {
    return UserSelectionProcess.restore({
      id: row.id,
      userId: row.userId,
      selectionProcessId:
        row.selectionProcessId,
      personalStatus:
        UserSelectionProcessMapper.toDomainStatus(
          row.personalStatus,
        ),
      followedAt: row.followedAt,
      personalStatusUpdatedAt:
        row.personalStatusUpdatedAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(
    entity: UserSelectionProcess,
  ) {
    return {
      userId: entity.userId,
      selectionProcessId:
        entity.selectionProcessId,
      personalStatus:
        UserSelectionProcessMapper.toPrismaStatus(
          entity.personalStatus,
        ),
      followedAt: entity.followedAt,
      personalStatusUpdatedAt:
        entity.personalStatusUpdatedAt,
    };
  }

  private static toDomainStatus(
    status: PrismaPersonalSelectionProcessStatus,
  ): PersonalSelectionProcessStatus {
    switch (status) {
      case PrismaPersonalSelectionProcessStatus.INTERESTED:
        return PersonalSelectionProcessStatus.INTERESTED;

      case PrismaPersonalSelectionProcessStatus.PREPARING_APPLICATION:
        return PersonalSelectionProcessStatus.PREPARING_APPLICATION;

      case PrismaPersonalSelectionProcessStatus.APPLICATION_SUBMITTED:
        return PersonalSelectionProcessStatus.APPLICATION_SUBMITTED;

      case PrismaPersonalSelectionProcessStatus.ADMITTED:
        return PersonalSelectionProcessStatus.ADMITTED;

      case PrismaPersonalSelectionProcessStatus.EXCLUDED:
        return PersonalSelectionProcessStatus.EXCLUDED;

      case PrismaPersonalSelectionProcessStatus.EXAM_PENDING:
        return PersonalSelectionProcessStatus.EXAM_PENDING;

      case PrismaPersonalSelectionProcessStatus.EXAM_COMPLETED:
        return PersonalSelectionProcessStatus.EXAM_COMPLETED;

      case PrismaPersonalSelectionProcessStatus.COMPLETED:
        return PersonalSelectionProcessStatus.COMPLETED;
    }
  }

  private static toPrismaStatus(
    status: PersonalSelectionProcessStatus,
  ): PrismaPersonalSelectionProcessStatus {
    switch (status) {
      case PersonalSelectionProcessStatus.INTERESTED:
        return PrismaPersonalSelectionProcessStatus.INTERESTED;

      case PersonalSelectionProcessStatus.PREPARING_APPLICATION:
        return PrismaPersonalSelectionProcessStatus.PREPARING_APPLICATION;

      case PersonalSelectionProcessStatus.APPLICATION_SUBMITTED:
        return PrismaPersonalSelectionProcessStatus.APPLICATION_SUBMITTED;

      case PersonalSelectionProcessStatus.ADMITTED:
        return PrismaPersonalSelectionProcessStatus.ADMITTED;

      case PersonalSelectionProcessStatus.EXCLUDED:
        return PrismaPersonalSelectionProcessStatus.EXCLUDED;

      case PersonalSelectionProcessStatus.EXAM_PENDING:
        return PrismaPersonalSelectionProcessStatus.EXAM_PENDING;

      case PersonalSelectionProcessStatus.EXAM_COMPLETED:
        return PrismaPersonalSelectionProcessStatus.EXAM_COMPLETED;

      case PersonalSelectionProcessStatus.COMPLETED:
        return PrismaPersonalSelectionProcessStatus.COMPLETED;
    }
  }
}