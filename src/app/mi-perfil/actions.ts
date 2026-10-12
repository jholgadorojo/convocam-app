
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import {
  changeUserProfilePersonalDataUseCase,
  changeUserProfileResidenceUseCase,
} from "@/composition/user-profile";

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
        error.message === "Los apellidos son obligatorios"
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
    if (!/^[1-9]\d*$/.test(value)) {
      return {
        status: "error",
        message: "El municipio de residencia no es válido.",
      };
    }

    municipalityId = Number(value);

    if (!Number.isSafeInteger(municipalityId)) {
      return {
        status: "error",
        message: "El municipio de residencia no es válido.",
      };
    }
  }

  // 3. Ejecutar caso de uso
  try {
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

