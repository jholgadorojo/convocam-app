
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { changeUserProfilePersonalDataUseCase } from "@/composition/user-profile";

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
