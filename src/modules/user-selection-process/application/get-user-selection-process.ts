import type { UserSelectionProcessRepository } from "../domain/user-selection-process-repository";

import type {
  GetUserSelectionProcessDto,
  UserSelectionProcessDto,
} from "./user-selection-process-dto";

import { toUserSelectionProcessDto } from "./user-selection-process-dto-mapper";

export class GetUserSelectionProcess {
  constructor(
    private readonly repository:
      UserSelectionProcessRepository,
  ) {}

  async execute(
    input: GetUserSelectionProcessDto,
  ): Promise<UserSelectionProcessDto | null> {
    const userSelectionProcess =
      await this.repository.findByUserAndSelectionProcess(
        input.userId,
        input.selectionProcessId,
      );

    if (!userSelectionProcess) {
      return null;
    }

    return toUserSelectionProcessDto(
      userSelectionProcess,
    );
  }
}