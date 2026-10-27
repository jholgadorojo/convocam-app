
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import {
  changeUserProfilePersonalDataUseCase,
  changeUserProfileResidenceUseCase,
  ensureUserProfileUseCase,
  addUserAcademicQualificationUseCase,
  updateUserAcademicQualificationUseCase,
  deleteUserAcademicQualificationUseCase,
} from "@/composition/user-profile";

import {
  ACADEMIC_QUALIFICATION_TYPES,
  MAX_QUALIFICATION_NAME_LENGTH,
} from "@/modules/user-profile/domain/user-academic-qualification";
import {
  FIRST_NAME_TOO_LONG_MESSAGE,
  LAST_NAME_TOO_LONG_MESSAGE,
} from "@/modules/user-profile/domain/user-profile";
import { parsePositiveId } from "@/shared/presentation/parse-positive-id";

const QUALIFICATION_NAME_TOO_LONG_MESSAGE =
  `La denominación de la titulación no puede superar los ${MAX_QUALIFICATION_NAME_LENGTH} caracteres.`;
// ============================================================
// ESTADO DEL FORMULARIO
// ============================================================

export type SavePersonalDataState = {
  status: "idle" | "success" | "error";
  message: string;
};

// ============================================================
// GUARDAR DATOS PERSONALES
// ============================================================

export async function savePersonalDataAction(
  _previousState: SavePersonalDataState,
  formData: FormData,
): Promise<SavePersonalDataState> {
  // ----------------------------------------------------------
  // 1. COMPROBAR AUTENTICACIÓN
  // ----------------------------------------------------------

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/mi-perfil");
  }

  // ----------------------------------------------------------
  // 2. RECUPERAR DATOS DEL FORMULARIO
  // ----------------------------------------------------------

  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");

  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string"
  ) {
    return {
      status: "error",
      message: "Los datos introducidos no son válidos.",
    };
  }

  // ----------------------------------------------------------
  // 3. EJECUTAR CASO DE USO
  // ----------------------------------------------------------

  try {
    await changeUserProfilePersonalDataUseCase.execute({
      userId: session.user.id,
      firstName,
      lastName,
    });
  } catch (error) {
    // Errores de validación del dominio
    if (error instanceof Error) {
      if (
        error.message === "El nombre es obligatorio" ||
        error.message === "Los apellidos son obligatorios" ||
        error.message === FIRST_NAME_TOO_LONG_MESSAGE ||
        error.message === LAST_NAME_TOO_LONG_MESSAGE
      ) {
        return {
          status: "error",
          message: error.message,
        };
      }
    }

    // Errores inesperados
    console.error(
      "Error al guardar los datos personales:",
      error,
    );

    return {
      status: "error",
      message:
        "No se han podido guardar los datos. Inténtalo de nuevo.",
    };
  }

  // ----------------------------------------------------------
  // 4. ACTUALIZAR LA PÁGINA
  // ----------------------------------------------------------

  revalidatePath("/mi-perfil");

  return {
    status: "success",
    message: "Datos personales guardados correctamente.",
  };
}


/* ============================================================
   ESTADO DEL FORMULARIO DE RESIDENCIA
============================================================ */

export type SaveResidenceState = {
  status: "idle" | "success" | "error";
  message: string;
  residenceMunicipalityId?: number | null;
};

/* ============================================================
   GUARDAR RESIDENCIA
============================================================ */

export async function saveResidenceAction(
  _previousState: SaveResidenceState,
  formData: FormData,
): Promise<SaveResidenceState> {
  // 1. Comprobar autenticación
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/mi-perfil");
  }

  // 2. Recuperar municipio seleccionado
  const rawMunicipalityId = formData.get(
    "residenceMunicipalityId",
  );

  if (typeof rawMunicipalityId !== "string") {
    return {
      status: "error",
      message: "El municipio de residencia no es válido.",
    };
  }

  const value = rawMunicipalityId.trim();

  // Valor vacío = eliminar residencia
  let municipalityId: number | null = null;

  if (value !== "") {
    municipalityId = parsePositiveId(value);

    if (municipalityId === null) {
      return {
        status: "error",
        message: "El municipio de residencia no es válido.",
      };
    }
  }

  // 3. Ejecutar caso de uso
  try {

    await ensureUserProfileUseCase.execute({
      userId: session.user.id,
      registeredName: session.user.name,
    });

    await changeUserProfileResidenceUseCase.execute({
      userId: session.user.id,
      residenceMunicipalityId: municipalityId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "El municipio de residencia no existe" ||
        error.message ===
        "El municipio de residencia no es válido"
      ) {
        return {
          status: "error",
          message: error.message,
        };
      }

      if (
        error.message ===
        "El usuario no tiene un perfil"
      ) {
        return {
          status: "error",
          message:
            "Todavía no tienes un perfil personal creado.",
        };
      }
    }

    console.error(
      "Error al guardar la residencia:",
      error,
    );

    return {
      status: "error",
      message:
        "No se ha podido guardar la residencia. Inténtalo de nuevo.",
    };
  }

  // 4. Actualizar la página
  revalidatePath("/mi-perfil");

  return {
    status: "success",
    message:
      municipalityId === null
        ? "Residencia eliminada correctamente."
        : "Residencia guardada correctamente.",
    residenceMunicipalityId: municipalityId,
  };
}


// ============================================================
// RESULTADO: AÑADIR TITULACIÓN ACADÉMICA
// ============================================================

export type AddAcademicQualificationState = {
  status: "success" | "error";
  message: string;
};

// ============================================================
// SERVER ACTION: AÑADIR TITULACIÓN
// ============================================================

export async function addAcademicQualificationAction(
  formData: FormData,
): Promise<AddAcademicQualificationState> {
  // 1. Comprobar autenticación
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/mi-perfil");
  }

  // 2. Recuperar datos
  const rawType = formData.get("qualificationType");
  const rawName = formData.get("name");

  if (
    typeof rawType !== "string" ||
    typeof rawName !== "string"
  ) {
    return {
      status: "error",
      message: "Los datos introducidos no son válidos.",
    };
  }

  // 3. Comprobar tipo académico
  const qualificationType =
    ACADEMIC_QUALIFICATION_TYPES.find(
      (type) => type === rawType,
    );

  if (!qualificationType) {
    return {
      status: "error",
      message: "Selecciona un tipo de titulación válido.",
    };
  }

  if (!rawName.trim()) {
    return {
      status: "error",
      message: "La denominación de la titulación es obligatoria.",
    };
  }

  if (rawName.trim().length > MAX_QUALIFICATION_NAME_LENGTH) {
    return {
      status: "error",
      message: QUALIFICATION_NAME_TOO_LONG_MESSAGE,
    };
  }

  // 4. Ejecutar caso de uso
  try {
    // Garantiza que existe UserProfile,
    // también para cuentas antiguas.
    await ensureUserProfileUseCase.execute({
      userId: session.user.id,
      registeredName: session.user.name,
    });

    await addUserAcademicQualificationUseCase.execute({
      userId: session.user.id,
      qualificationType,
      name: rawName,
    });
  } catch (error) {
    console.error(
      "Error al añadir la titulación académica:",
      error,
    );

    return {
      status: "error",
      message:
        "No se ha podido guardar la titulación. Inténtalo de nuevo.",
    };
  }

  // 5. Actualizar Mi perfil
  revalidatePath("/mi-perfil");

  return {
    status: "success",
    message: "Titulación académica añadida correctamente.",
  };
}

/* ============================================================
   RESULTADO DE EDITAR O ELIMINAR UNA TITULACIÓN
============================================================ */

export type AcademicQualificationMutationState = {
  status: "success" | "error";
  message: string;
};

/* ============================================================
   VALIDAR IDENTIFICADOR
============================================================ */

function parseQualificationId(
  value: FormDataEntryValue | null,
): number | null {
  return parsePositiveId(value);
}

/* ============================================================
   EDITAR TITULACIÓN ACADÉMICA
============================================================ */

export async function updateAcademicQualificationAction(
  formData: FormData,
): Promise<AcademicQualificationMutationState> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/mi-perfil");
  }

  const qualificationId = parseQualificationId(
    formData.get("qualificationId"),
  );

  const rawType = formData.get("qualificationType");
  const rawName = formData.get("name");

  if (qualificationId === null) {
    return {
      status: "error",
      message: "La titulación seleccionada no es válida.",
    };
  }

  if (
    typeof rawType !== "string" ||
    typeof rawName !== "string"
  ) {
    return {
      status: "error",
      message: "Los datos introducidos no son válidos.",
    };
  }

  const qualificationType =
    ACADEMIC_QUALIFICATION_TYPES.find(
      (type) => type === rawType,
    );

  if (!qualificationType) {
    return {
      status: "error",
      message: "Selecciona un tipo de titulación válido.",
    };
  }

  if (!rawName.trim()) {
    return {
      status: "error",
      message:
        "La denominación de la titulación es obligatoria.",
    };
  }

  if (rawName.trim().length > MAX_QUALIFICATION_NAME_LENGTH) {
    return {
      status: "error",
      message: QUALIFICATION_NAME_TOO_LONG_MESSAGE,
    };
  }

  try {
    await updateUserAcademicQualificationUseCase.execute({
      userId: session.user.id,
      qualificationId,
      qualificationType,
      name: rawName,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "La titulación académica no existe"
    ) {
      return {
        status: "error",
        message:
          "La titulación no existe o no pertenece a tu perfil.",
      };
    }

    console.error(
      "Error al modificar la titulación:",
      error,
    );

    return {
      status: "error",
      message:
        "No se ha podido modificar la titulación.",
    };
  }

  revalidatePath("/mi-perfil");

  return {
    status: "success",
    message: "Titulación modificada correctamente.",
  };
}

/* ============================================================
   ELIMINAR TITULACIÓN ACADÉMICA
============================================================ */

export async function deleteAcademicQualificationAction(
  formData: FormData,
): Promise<AcademicQualificationMutationState> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/mi-perfil");
  }

  const qualificationId = parseQualificationId(
    formData.get("qualificationId"),
  );

  if (qualificationId === null) {
    return {
      status: "error",
      message: "La titulación seleccionada no es válida.",
    };
  }

  try {
    await deleteUserAcademicQualificationUseCase.execute({
      userId: session.user.id,
      qualificationId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "La titulación académica no existe"
    ) {
      return {
        status: "error",
        message:
          "La titulación no existe o no pertenece a tu perfil.",
      };
    }

    console.error(
      "Error al eliminar la titulación:",
      error,
    );

    return {
      status: "error",
      message:
        "No se ha podido eliminar la titulación.",
    };
  }

  revalidatePath("/mi-perfil");

  return {
    status: "success",
    message: "Titulación eliminada correctamente.",
  };
}
