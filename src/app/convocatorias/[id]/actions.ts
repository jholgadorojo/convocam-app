"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  followSelectionProcessUseCase,
  unfollowSelectionProcessUseCase,
} from "@/composition/user-selection-process";
import { auth } from "@/lib/auth";

export async function followSelectionProcessAction(
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
      `/login?returnTo=${encodeURIComponent(
        `/convocatorias/${selectionProcessId}`,
      )}`,
    );
  }

  await followSelectionProcessUseCase.execute({
    userId: session.user.id,
    selectionProcessId,
  });

  revalidatePath(
    `/convocatorias/${selectionProcessId}`,
  );
}
export async function unfollowSelectionProcessAction(
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
      `/login?returnTo=${encodeURIComponent(
        `/convocatorias/${selectionProcessId}`,
      )}`,
    );
  }

  await unfollowSelectionProcessUseCase.execute({
    userId: session.user.id,
    selectionProcessId,
  });

  revalidatePath(
    `/convocatorias/${selectionProcessId}`,
  );
}