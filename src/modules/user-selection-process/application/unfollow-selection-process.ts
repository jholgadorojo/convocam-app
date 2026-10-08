import type { UserSelectionProcessRepository } from "../domain/user-selection-process-repository";

import type { UnfollowSelectionProcessDto } from "./user-selection-process-dto";

export class UnfollowSelectionProcess {
  constructor(
    private readonly repository:
      UserSelectionProcessRepository,
  ) {}

  async execute(
    input: UnfollowSelectionProcessDto,
  ): Promise<void> {
    const existing =
      await this.repository.findByUserAndSelectionProcess(
        input.userId,
        input.selectionProcessId,
      );

    if (!existing) {
      return;
    }

    await this.repository.deleteByUserAndSelectionProcess(
      input.userId,
      input.selectionProcessId,
    );
  }
}