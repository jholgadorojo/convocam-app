import type { UserSelectionProcessListItem } from "./user-selection-process-list-item";
import type { UserSelectionProcessQueryRepository } from "./user-selection-process-query-repository";

export class ListUserSelectionProcesses {
  constructor(
    private readonly repository:
      UserSelectionProcessQueryRepository,
  ) {}

  async execute(
    userId: string,
  ): Promise<UserSelectionProcessListItem[]> {
    return this.repository.findByUser(
      userId,
    );
  }
}