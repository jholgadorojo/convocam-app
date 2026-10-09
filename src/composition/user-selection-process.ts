import { prisma } from "@/shared/infrastructure/database/prisma";

import { ChangeSelectionProcessPersonalStatus } from "@/modules/user-selection-process/application/change-selection-process-personal-status";
import { FollowSelectionProcess } from "@/modules/user-selection-process/application/follow-selection-process";
import { GetUserSelectionProcess } from "@/modules/user-selection-process/application/get-user-selection-process";
import { UnfollowSelectionProcess } from "@/modules/user-selection-process/application/unfollow-selection-process";

import { PrismaUserSelectionProcessRepository } from "@/modules/user-selection-process/infrastructure/prisma/prisma-user-selection-process-repository";
import { ListUserSelectionProcesses } from "@/modules/user-selection-process/application/list-user-selection-processes";
import { PrismaUserSelectionProcessQueryRepository } from "@/modules/user-selection-process/infrastructure/prisma/prisma-user-selection-process-query-repository";

const userSelectionProcessRepository =
  new PrismaUserSelectionProcessRepository(
    prisma,
  );
const userSelectionProcessQueryRepository =
  new PrismaUserSelectionProcessQueryRepository(
    prisma,
  );
export const followSelectionProcessUseCase =
  new FollowSelectionProcess(
    userSelectionProcessRepository,
  );

export const unfollowSelectionProcessUseCase =
  new UnfollowSelectionProcess(
    userSelectionProcessRepository,
  );

export const changeSelectionProcessPersonalStatusUseCase =
  new ChangeSelectionProcessPersonalStatus(
    userSelectionProcessRepository,
  );

export const getUserSelectionProcessUseCase =
  new GetUserSelectionProcess(
    userSelectionProcessRepository,
  );
export const listUserSelectionProcessesUseCase =
  new ListUserSelectionProcesses(
    userSelectionProcessQueryRepository,
  );