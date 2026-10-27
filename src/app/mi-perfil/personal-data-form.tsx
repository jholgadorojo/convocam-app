
"use client";

import {
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { Pencil } from "lucide-react";

import {
  MAX_FIRST_NAME_LENGTH,
  MAX_LAST_NAME_LENGTH,
} from "@/modules/user-profile/domain/user-profile";

import {
  savePersonalDataAction,
  type SavePersonalDataState,
} from "./actions";

type PersonalDataFormProps = {
  firstName: string;
  lastName: string;
  email: string;
};

export function PersonalDataForm({
  firstName,
  lastName,
  email,
}: PersonalDataFormProps) {
  // Datos actualmente guardados
  const [savedData, setSavedData] = useState({
    firstName,
    lastName,
  });

  // Campos del formulario
  const [draftFirstName, setDraftFirstName] =
    useState(firstName);

  const [draftLastName, setDraftLastName] =
    useState(lastName);

  // Estado de edición
  const [isEditing, setIsEditing] = useState(false);

  // Resultado del guardado
  const [feedback, setFeedback] =
    useState<SavePersonalDataState | null>(null);

  const [isPending, startTransition] = useTransition();

  // ==========================================================
  // EDITAR
  // ==========================================================

  function handleEdit() {
    setDraftFirstName(savedData.firstName);
    setDraftLastName(savedData.lastName);

    setFeedback(null);
    setIsEditing(true);
  }

  // ==========================================================
  // CANCELAR
  // ==========================================================

  function handleCancel() {
    setDraftFirstName(savedData.firstName);
    setDraftLastName(savedData.lastName);

    setFeedback(null);
    setIsEditing(false);
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const newFirstName = String(
      formData.get("firstName") ?? "",
    ).trim();

    const newLastName = String(
      formData.get("lastName") ?? "",
    ).trim();

    startTransition(async () => {
      const result = await savePersonalDataAction(
        {
          status: "idle",
          message: "",
        },
        formData,
      );

      setFeedback(result);

      if (result.status === "success") {
        const updatedData = {
          firstName: newFirstName,
          lastName: newLastName,
        };

        setSavedData(updatedData);

        setDraftFirstName(updatedData.firstName);
        setDraftLastName(updatedData.lastName);

        setIsEditing(false);
      }
    });
  }

  // ==========================================================
  // RENDERIZADO
  // ==========================================================

  return (
    <div className="mt-5 border-t border-[#EEF1F5] pt-5">
      {!isEditing ? (
        // ====================================================
        // MODO CONSULTA
        // ====================================================

        <div>
          {/* DATOS PERSONALES */}
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-[#69738A]">
                Nombre
              </dt>

              <dd className="mt-1.5 text-sm font-semibold text-[#131A2C]">
                {savedData.firstName || "Sin configurar"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-[#69738A]">
                Apellidos
              </dt>

              <dd className="mt-1.5 text-sm font-semibold text-[#131A2C]">
                {savedData.lastName || "Sin configurar"}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-[#69738A]">
                Correo electrónico
              </dt>

              <dd className="mt-1.5 break-all text-sm font-semibold text-[#131A2C]">
                {email}
              </dd>

              <p className="mt-1.5 text-xs text-[#8A93A7]">
                El correo electrónico está asociado a tu
                cuenta.
              </p>
            </div>
          </dl>

          {/* MENSAJE DE CONFIRMACIÓN */}
          {feedback?.status === "success" && (
            <p
              role="status"
              className="mt-4 text-sm font-medium text-green-700"
            >
              {feedback.message}
            </p>
          )}

          {/* BOTÓN EDITAR */}
          <div className="mt-5 flex justify-end border-t border-[#EEF1F5] pt-4">
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#3B45B5] transition-colors hover:bg-[#F4F6F9]"
            >
              <Pencil size={15} />
              Editar
            </button>
          </div>
        </div>
      ) : (
        // ====================================================
        // MODO EDICIÓN
        // ====================================================

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            {/* NOMBRE */}
            <div>
              <label
                htmlFor="profile-first-name"
                className="block text-xs font-medium text-[#69738A]"
              >
                Nombre
              </label>

              <input
                id="profile-first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                maxLength={MAX_FIRST_NAME_LENGTH}
                value={draftFirstName}
                onChange={(event) =>
                  setDraftFirstName(event.target.value)
                }
                disabled={isPending}
                className="mt-2 h-11 w-full rounded-lg border border-[#D5DAE3] bg-white px-3.5 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/15 disabled:opacity-60"
              />
            </div>

            {/* APELLIDOS */}
            <div>
              <label
                htmlFor="profile-last-name"
                className="block text-xs font-medium text-[#69738A]"
              >
                Apellidos
              </label>

              <input
                id="profile-last-name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                maxLength={MAX_LAST_NAME_LENGTH}
                value={draftLastName}
                onChange={(event) =>
                  setDraftLastName(event.target.value)
                }
                disabled={isPending}
                className="mt-2 h-11 w-full rounded-lg border border-[#D5DAE3] bg-white px-3.5 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/15 disabled:opacity-60"
              />
            </div>

            {/* CORREO ELECTRÓNICO */}
            <div className="sm:col-span-2">
              <label
                htmlFor="profile-email"
                className="block text-xs font-medium text-[#69738A]"
              >
                Correo electrónico
              </label>

              <input
                id="profile-email"
                type="email"
                value={email}
                readOnly
                className="mt-2 h-11 w-full cursor-not-allowed rounded-lg border border-[#E3E7EE] bg-[#F7F8FA] px-3.5 text-sm text-[#69738A] outline-none"
              />

              <p className="mt-1.5 text-xs text-[#8A93A7]">
                El correo electrónico no se puede
                modificar desde este apartado.
              </p>
            </div>
          </div>

          {/* MENSAJE DE ERROR */}
          {feedback?.status === "error" && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
            >
              {feedback.message}
            </p>
          )}

          {/* ACCIONES */}
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#EEF1F5] pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#4E5870] hover:bg-[#F4F6F9] disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#4F5BD5] px-5 text-sm font-semibold text-white hover:bg-[#3B45B5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
