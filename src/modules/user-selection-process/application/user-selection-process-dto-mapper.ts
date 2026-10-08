import type { UserSelectionProcess } from "../domain/user-selection-process";
import type { UserSelectionProcessDto } from "./user-selection-process-dto";

export function toUserSelectionProcessDto(
  entity: UserSelectionProcess,
): UserSelectionProcessDto {
  if (entity.id === undefined) {
    throw new Error(
      "El seguimiento debe estar persistido.",
    );
  }

  return {
    id: entity.id,
    userId: entity.userId,
    selectionProcessId:
      entity.selectionProcessId,
    personalStatus:
      entity.personalStatus,
    followedAt: entity.followedAt,
    personalStatusUpdatedAt:
      entity.personalStatusUpdatedAt,
    updatedAt: entity.updatedAt,
  };
}