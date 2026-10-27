
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import {
  followSelectionProcessUseCase,
} from "@/composition/user-selection-process";
import { parsePositiveId } from "@/shared/presentation/parse-positive-id";

/**
 * ============================================================
 * SPEC-009 — DASHBOARD DEL OPOSITOR
 * ============================================================
 *
 * PASO 6.4.4.1
 *
 * Acción para seguir una convocatoria
 * directamente desde el dashboard.
 *
 * Reutiliza el caso de uso desarrollado
 * en SPEC-006.
 */

/**
 * Sigue una convocatoria desde
 * el panel "Oportunidades para mí".
 *
 * El identificador del usuario se obtiene
 * siempre de la sesión autenticada.
 */
export async function followFromDashboardAction(
  formData: FormData,
): Promise<void> {
  /**
   * 1. Validar la convocatoria.
   */
  const selectionProcessId = parsePositiveId(
    formData.get("selectionProcessId"),
  );

  if (selectionProcessId === null) {
    throw new Error(
      "selectionProcessId must be a positive integer",
    );
  }

  /**
   * 2. Comprobar la sesión.
   */
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/dashboard");
  }

  /**
   * 3. Guardar el seguimiento.
   *
   * Reutilizamos el caso de uso existente.
   *
   * El userId no procede del formulario,
   * sino de la sesión autenticada.
   */
  await followSelectionProcessUseCase.execute({
    userId: session.user.id,
    selectionProcessId,
  });

  /**
   * 4. Actualizar las páginas relacionadas.
   *
   * Dashboard:
   * - Aumenta "En seguimiento".
   * - Actualiza "Plazos próximos".
   * - Disminuye "Para mí".
   * - Renueva las tres oportunidades.
   *
   * Otras páginas:
   * - Refresca los seguimientos.
   * - Actualiza la marca de seguimiento
   *   en las coincidencias personalizadas.
   * - Actualiza el detalle de la convocatoria.
   */
  revalidatePath("/dashboard");

  revalidatePath("/mis-convocatorias");

  revalidatePath("/para-mi");

  revalidatePath(
    `/convocatorias/${selectionProcessId}`,
  );
}
