
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";

import {
  saveUserTerritorialPreferencesUseCase,
  deleteUserTerritorialPreferencesUseCase,
} from "@/composition/user-profile";

import type {
  SaveUserTerritorialPreferencesDto,
  UserTerritorialPreferenceDto,
} from "@/modules/user-profile/application/dto/user-territorial-preference.dto";

// ============================================================
// TIPOS
// ============================================================

type SaveTerritorialInput = Omit<
  SaveUserTerritorialPreferencesDto,
  "userId"
>;

export type TerritorialActionResult =
  | {
      success: true;
      preference: UserTerritorialPreferenceDto | null;
    }
  | {
      success: false;
      message: string;
    };

// ============================================================
// MENSAJES DE VALIDACIÓN QUE PODEMOS MOSTRAR
// ============================================================

const PUBLIC_ERRORS = new Set([
  "El usuario no tiene un perfil",
  "El ámbito territorial no es válido",
  "El identificador territorial no es válido",
  "Debes seleccionar al menos un territorio",
  "Toda Catalunya no puede tener territorios seleccionados",
  "Uno o varios territorios no existen en el catálogo",
]);

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    PUBLIC_ERRORS.has(error.message)
  ) {
    return error.message;
  }

  console.error("Error en preferencias territoriales:", error);

  return fallback;
}

// ============================================================
// GUARDAR PREFERENCIAS TERRITORIALES
// ============================================================

export async function saveTerritorialPreferencesAction(
  input: SaveTerritorialInput,
): Promise<TerritorialActionResult> {
  // ----------------------------------------------------------
  // 1. COMPROBAR AUTENTICACIÓN
  // ----------------------------------------------------------

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false,
      message: "Tu sesión ha caducado. Inicia sesión de nuevo.",
    };
  }

  // ----------------------------------------------------------
  // 2. VALIDAR LOS DATOS RECIBIDOS
  // ----------------------------------------------------------

  if (
    !input ||
    (
      input.scope !== "ALL_CATALONIA" &&
      input.scope !== "SELECTED_TERRITORIES"
    ) ||
    !Array.isArray(input.provinceIds) ||
    !Array.isArray(input.countyIds) ||
    !Array.isArray(input.municipalityIds)
  ) {
    return {
      success: false,
      message: "Los datos de las preferencias no son válidos.",
    };
  }

  const allIds = [
    ...input.provinceIds,
    ...input.countyIds,
    ...input.municipalityIds,
  ];

  if (
    allIds.length > 2000 ||
    allIds.some(
      (id) =>
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        id > 2147483647,
    )
  ) {
    return {
      success: false,
      message: "La selección de territorios no es válida.",
    };
  }

  // ----------------------------------------------------------
  // 3. GUARDAR MEDIANTE EL CASO DE USO
  // ----------------------------------------------------------

  try {
    const saved =
      await saveUserTerritorialPreferencesUseCase.execute({
        userId: session.user.id,
        scope: input.scope,
        provinceIds: input.provinceIds,
        countyIds: input.countyIds,
        municipalityIds: input.municipalityIds,
      });

    revalidatePath("/mi-perfil");

    return {
      success: true,
      preference: saved,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(
        error,
        "No se han podido guardar las preferencias.",
      ),
    };
  }
}

// ============================================================
// ELIMINAR PREFERENCIAS TERRITORIALES
// ============================================================

export async function deleteTerritorialPreferencesAction(): Promise<TerritorialActionResult> {
  // ----------------------------------------------------------
  // 1. COMPROBAR AUTENTICACIÓN
  // ----------------------------------------------------------

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false,
      message: "Tu sesión ha caducado. Inicia sesión de nuevo.",
    };
  }

  // ----------------------------------------------------------
  // 2. ELIMINAR MEDIANTE EL CASO DE USO
  // ----------------------------------------------------------

  try {
    await deleteUserTerritorialPreferencesUseCase.execute({
      userId: session.user.id,
    });

    revalidatePath("/mi-perfil");

    return {
      success: true,
      preference: null,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(
        error,
        "No se han podido eliminar las preferencias.",
      ),
    };
  }
}
