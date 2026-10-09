"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  changeSelectionProcessPersonalStatusUseCase,
  unfollowSelectionProcessUseCase,
} from "@/composition/user-selection-process";

import { PersonalSelectionProcessStatus } from "@/modules/user-selection-process/domain/personal-selection-process-status";

export async function unfollowFromMySelectionProcessesAction(
  formData: FormData,
): Promise<void> {
  const selectionProcessId = Number(
    formData.get("selectionProcessId"),
  );

  if (
    !Number.isInteger(selectionProcessId) ||
    selectionProcessId <= 0
  ) {
    throw new Error(
      "El identificador de la convocatoria no es válido.",
    );
  }

  const session =
    await auth.api.getSession({
      headers: await headers(),
    });

  if (!session?.user) {
    redirect(
      "/login?returnTo=/mis-convocatorias",
    );
  }

  await unfollowSelectionProcessUseCase.execute({
    userId: session.user.id,
    selectionProcessId,
  });

  revalidatePath("/mis-convocatorias");

  revalidatePath(
    `/convocatorias/${selectionProcessId}`,
  );
}
export async function changePersonalStatusFromMySelectionProcessesAction(
  formData: FormData,
): Promise<void> {
  const selectionProcessId = Number(
    formData.get("selectionProcessId"),
  );

  const personalStatus =
    formData.get("personalStatus");

    console.log(
  "[Mis convocatorias] cambio de estado:",
  {
    selectionProcessId,
    personalStatus,
  },
);

  if (
    !Number.isInteger(selectionProcessId) ||
    selectionProcessId <= 0
  ) {
    throw new Error(
      "El identificador de la convocatoria no es válido.",
    );
  }

  if (
    typeof personalStatus !== "string" ||
    !Object.values(
      PersonalSelectionProcessStatus,
    ).includes(
      personalStatus as PersonalSelectionProcessStatus,
    )
  ) {
    throw new Error(
      "El estado personal no es válido.",
    );
  }

  const session =
    await auth.api.getSession({
      headers: await headers(),
    });

  if (!session?.user) {
    redirect(
      "/login?returnTo=/mis-convocatorias",
    );
  }

  await changeSelectionProcessPersonalStatusUseCase.execute({
    userId: session.user.id,
    selectionProcessId,
    personalStatus:
      personalStatus as PersonalSelectionProcessStatus,
  });

  revalidatePath(
    "/mis-convocatorias",
  );

  revalidatePath(
    `/convocatorias/${selectionProcessId}`,
  );
}