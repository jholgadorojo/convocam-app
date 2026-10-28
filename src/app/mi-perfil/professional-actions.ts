
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import {
  saveUserProfessionalPreferencesUseCase,
  deleteUserProfessionalPreferencesUseCase,
} from "@/composition/user-profile";

import type {
  UserProfessionalPreferenceDto,
} from "@/modules/user-profile/application/dto/user-professional-preference.dto";

import type {
  ProfessionalPreferenceSelection,
} from "@/modules/user-profile/domain/user-professional-preference";

import {
  UserProfileNotFoundError,
  UserProfileValidationError,
} from "@/modules/user-profile/domain/user-profile-errors";

import { isPositiveId } from "@/shared/presentation/parse-positive-id";

// ============================================================
// RESULTADO DE LAS ACCIONES
// ============================================================

export type ProfessionalPreferenceActionResult =
  | {
      success: true;
      preference: UserProfessionalPreferenceDto | null;
    }
  | {
      success: false;
      message: string;
    };

// ============================================================
// VALIDAR LOS DATOS RECIBIDOS
// ============================================================

function isValidSelection(
  input: unknown,
): input is ProfessionalPreferenceSelection {
  if (
    input === null ||
    typeof input !== "object"
  ) {
    return false;
  }

  const value = input as Record<string, unknown>;

  const validSelectionTypes = [
    "POSITIONS",
    "JOB_POOLS",
    "BOTH",
  ];

  const validType =
    value.selectionProcessType === null ||
    (
      typeof value.selectionProcessType === "string" &&
      validSelectionTypes.includes(
        value.selectionProcessType,
      )
    );

  const validSubjectAreas =
    Array.isArray(value.subjectAreaIds) &&
    value.subjectAreaIds.every(isPositiveId);

  const validQualificationGroups =
    Array.isArray(value.qualificationGroups) &&
    value.qualificationGroups.every(
      (group: unknown) =>
        typeof group === "string" &&
        group.trim().length > 0,
    );

  return (
    validType &&
    validSubjectAreas &&
    validQualificationGroups
  );
}

// ============================================================
// OBTENER USUARIO AUTENTICADO
// ============================================================

async function getAuthenticatedUserId():
  Promise<string | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.id ?? null;
}

// ============================================================
// GUARDAR PREFERENCIAS PROFESIONALES
// ============================================================

export async function saveProfessionalPreferencesAction(
  input: ProfessionalPreferenceSelection,
): Promise<ProfessionalPreferenceActionResult> {
  // ----------------------------------------------------------
  // 1. COMPROBAR AUTENTICACIÓN
  // ----------------------------------------------------------

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return {
      success: false,
      message:
        "Debes iniciar sesión para guardar tus preferencias profesionales.",
    };
  }

  // ----------------------------------------------------------
  // 2. VALIDAR DATOS RECIBIDOS
  // ----------------------------------------------------------

  if (!isValidSelection(input)) {
    return {
      success: false,
      message:
        "Los datos de las preferencias profesionales no son válidos.",
    };
  }

  // ----------------------------------------------------------
  // 3. GUARDAR MEDIANTE EL CASO DE USO
  // ----------------------------------------------------------

  try {
    const preference =
      await saveUserProfessionalPreferencesUseCase.execute({
        userId,

        selectionProcessType:
          input.selectionProcessType,

        subjectAreaIds:
          input.subjectAreaIds,

        qualificationGroups:
          input.qualificationGroups,
      });

    // --------------------------------------------------------
    // 4. ACTUALIZAR LOS DATOS DE MI PERFIL
    // --------------------------------------------------------

    revalidatePath("/mi-perfil");

    // --------------------------------------------------------
    // 5. DEVOLVER RESULTADO
    // --------------------------------------------------------

    return {
      success: true,
      preference,
    };
  } catch (error) {
    // Los errores de validación conocidos pueden
    // mostrarse al usuario. No exponemos mensajes
    // internos de PostgreSQL o Prisma.

    if (
      error instanceof UserProfileValidationError ||
      error instanceof UserProfileNotFoundError
    ) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message:
        "No se han podido guardar las preferencias profesionales. Inténtalo de nuevo.",
    };
  }
}

// ============================================================
// ELIMINAR PREFERENCIAS PROFESIONALES
// ============================================================

export async function deleteProfessionalPreferencesAction():
  Promise<ProfessionalPreferenceActionResult> {
  // ----------------------------------------------------------
  // 1. COMPROBAR AUTENTICACIÓN
  // ----------------------------------------------------------

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return {
      success: false,
      message:
        "Debes iniciar sesión para eliminar tus preferencias profesionales.",
    };
  }

  // ----------------------------------------------------------
  // 2. ELIMINAR MEDIANTE EL CASO DE USO
  // ----------------------------------------------------------

  try {
    await deleteUserProfessionalPreferencesUseCase.execute({
      userId,
    });

    // --------------------------------------------------------
    // 3. ACTUALIZAR MI PERFIL
    // --------------------------------------------------------

    revalidatePath("/mi-perfil");

    // --------------------------------------------------------
    // 4. DEVOLVER RESULTADO
    // --------------------------------------------------------

    return {
      success: true,
      preference: null,
    };
  } catch {
    return {
      success: false,
      message:
        "No se han podido eliminar las preferencias profesionales. Inténtalo de nuevo.",
    };
  }
}
