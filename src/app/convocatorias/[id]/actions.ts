"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  changeSelectionProcessPersonalStatusUseCase,
  followSelectionProcessUseCase,
  unfollowSelectionProcessUseCase,
} from "@/composition/user-selection-process";import { auth } from "@/lib/auth";

import { PersonalSelectionProcessStatus } from "@/modules/user-selection-process/domain/personal-selection-process-status";
import { SelectionProcessNotFoundError } from "@/modules/user-selection-process/domain/selection-process-not-found-error";
import { parsePositiveId } from "@/shared/presentation/parse-positive-id";

export async function followSelectionProcessAction(
  formData: FormData,
): Promise<void> {
  const selectionProcessId = parsePositiveId(
    formData.get("selectionProcessId"),
  );

  if (selectionProcessId === null) {
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
      `/login?returnTo=${encodeURIComponent(
        `/convocatorias/${selectionProcessId}`,
      )}`,
    );
  }

  try {
    await followSelectionProcessUseCase.execute({
      userId: session.user.id,
      selectionProcessId,
    });
  } catch (error) {
    if (error instanceof SelectionProcessNotFoundError) {
      notFound();
    }

    throw error;
  }

  revalidateFollowedSelectionProcessPaths(
    selectionProcessId,
  );
}
export async function unfollowSelectionProcessAction(
  formData: FormData,
): Promise<void> {
  const selectionProcessId = parsePositiveId(
    formData.get("selectionProcessId"),
  );

  if (selectionProcessId === null) {
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
      `/login?returnTo=${encodeURIComponent(
        `/convocatorias/${selectionProcessId}`,
      )}`,
    );
  }

  await unfollowSelectionProcessUseCase.execute({
    userId: session.user.id,
    selectionProcessId,
  });

  revalidateFollowedSelectionProcessPaths(
    selectionProcessId,
  );
}
export async function changePersonalStatusAction(
  formData: FormData,
): Promise<void> {
  const selectionProcessId = parsePositiveId(
    formData.get("selectionProcessId"),
  );

  const personalStatus =
    formData.get("personalStatus");

  if (selectionProcessId === null) {
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
      `/login?returnTo=${encodeURIComponent(
        `/convocatorias/${selectionProcessId}`,
      )}`,
    );
  }

  await changeSelectionProcessPersonalStatusUseCase.execute({
    userId: session.user.id,
    selectionProcessId,
    personalStatus:
      personalStatus as PersonalSelectionProcessStatus,
  });

  revalidateFollowedSelectionProcessPaths(
    selectionProcessId,
  );
}
/**
 * Pantallas que muestran el seguimiento o el estado
 * personal de una convocatoria.
 */
function revalidateFollowedSelectionProcessPaths(
  selectionProcessId: number,
): void {
  revalidatePath(`/convocatorias/${selectionProcessId}`);
  revalidatePath("/mis-convocatorias");
  revalidatePath("/para-mi");
  revalidatePath("/dashboard");
}
