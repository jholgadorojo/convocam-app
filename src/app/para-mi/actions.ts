
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import {
  followSelectionProcessUseCase,
} from "@/composition/user-selection-process";
import { SelectionProcessNotFoundError } from "@/modules/user-selection-process/domain/selection-process-not-found-error";
import { parsePositiveId } from "@/shared/presentation/parse-positive-id";

/**
 * SPEC-008 — Para mí
 *
 * Permite seguir una convocatoria directamente
 * desde la tarjeta de resultados personalizados.
 */
export async function followFromForMeAction(
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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(
      `/login?returnTo=${encodeURIComponent("/para-mi")}`,
    );
  }

  // Reutilizamos el caso de uso existente de SPEC-006.
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

  // Actualizamos las pantallas que muestran el seguimiento.
  revalidatePath("/para-mi");
  revalidatePath("/mis-convocatorias");
  revalidatePath(
    `/convocatorias/${selectionProcessId}`,
  );
}
