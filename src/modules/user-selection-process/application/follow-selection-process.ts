import type { UserSelectionProcessRepository } from "../domain/user-selection-process-repository";
import { UserSelectionProcess } from "../domain/user-selection-process";

import type {
  FollowSelectionProcessDto,
  UserSelectionProcessDto,
} from "./user-selection-process-dto";

import { toUserSelectionProcessDto } from "./user-selection-process-dto-mapper";

export class FollowSelectionProcess {
  constructor(
    private readonly repository:
      UserSelectionProcessRepository,
  ) {}

  async execute(
    input: FollowSelectionProcessDto,
  ): Promise<UserSelectionProcessDto> {
    const existing =
      await this.repository.findByUserAndSelectionProcess(
        input.userId,
        input.selectionProcessId,
      );

    if (existing) {
      return toUserSelectionProcessDto(
        existing,
      );
    }

    const userSelectionProcess =
      UserSelectionProcess.create({
        userId: input.userId,
        selectionProcessId:
          input.selectionProcessId,
      });

    try {
      const saved =
        await this.repository.save(
          userSelectionProcess,
        );

      return toUserSelectionProcessDto(
        saved,
      );
    } catch (error) {
      // Doble clic: otra petición simultánea puede haber creado
      // el seguimiento entre la búsqueda y el guardado.
      const concurrent =
        await this.repository.findByUserAndSelectionProcess(
          input.userId,
          input.selectionProcessId,
        );

      if (concurrent) {
        return toUserSelectionProcessDto(
          concurrent,
        );
      }

      throw error;
    }
  }
}