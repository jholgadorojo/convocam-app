import type { UserSelectionProcessRepository } from "../domain/user-selection-process-repository";

import type {
  ChangeSelectionProcessPersonalStatusDto,
  UserSelectionProcessDto,
} from "./user-selection-process-dto";

import { toUserSelectionProcessDto } from "./user-selection-process-dto-mapper";

export class ChangeSelectionProcessPersonalStatus {
  constructor(
    private readonly repository:
      UserSelectionProcessRepository,
    private readonly now: () => Date = () =>
      new Date(),
  ) {}

  async execute(
    input: ChangeSelectionProcessPersonalStatusDto,
  ): Promise<UserSelectionProcessDto> {
    const existing =
      await this.repository.findByUserAndSelectionProcess(
        input.userId,
        input.selectionProcessId,
      );

    if (!existing) {
      throw new Error(
        "La convocatoria no está en seguimiento.",
      );
    }

    if (
      existing.personalStatus ===
      input.personalStatus
    ) {
      return toUserSelectionProcessDto(
        existing,
      );
    }

    existing.changePersonalStatus(
      input.personalStatus,
      this.now(),
    );

    const saved =
      await this.repository.save(existing);

    return toUserSelectionProcessDto(
      saved,
    );
  }
}