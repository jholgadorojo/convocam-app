
"use client";

import {
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import {
  ACADEMIC_QUALIFICATION_TYPES,
  MAX_QUALIFICATION_NAME_LENGTH,
} from "@/modules/user-profile/domain/user-academic-qualification";

import { ACADEMIC_QUALIFICATION_LABELS } from "@/modules/user-profile/presentation/academic-qualification-labels";

import {
  addAcademicQualificationAction,
  type AddAcademicQualificationState,
} from "./actions";

// ============================================================
// FORMULARIO PARA AÑADIR TITULACIONES
// ============================================================

export function AddAcademicQualificationForm() {
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);

  const [feedback, setFeedback] =
    useState<AddAcademicQualificationState | null>(null);

  const [isPending, startTransition] = useTransition();

  // ==========================================================
  // ABRIR FORMULARIO
  // ==========================================================

  function handleAdd() {
    setFeedback(null);
    setIsAdding(true);
  }

  // ==========================================================
  // CANCELAR
  // ==========================================================

  function handleCancel() {
    setFeedback(null);
    setIsAdding(false);
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result =
          await addAcademicQualificationAction(formData);

        setFeedback(result);

        if (result.status === "success") {
          setIsAdding(false);

          // Recuperar nuevamente las titulaciones
          // desde el Server Component.
          router.refresh();
        }
      } catch {
        setFeedback({
          status: "error",
          message:
            "No se ha podido completar la operación. Inténtalo de nuevo.",
        });
      }
    });
  }

  // ==========================================================
  // RENDERIZADO
  // ==========================================================

  return (
    <div className="mt-5 border-t border-[#EEF1F5] pt-4">
      {!isAdding ? (
        // ====================================================
        // MODO CONSULTA
        // ====================================================

        <div>
          {/* MENSAJE DE CONFIRMACIÓN */}
          {feedback?.status === "success" && (
            <p
              role="status"
              className="mb-4 text-sm font-medium text-green-700"
            >
              {feedback.message}
            </p>
          )}

          {/* BOTÓN AÑADIR */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
            >
              <Plus size={16} />
              Añadir titulación
            </button>
          </div>
        </div>
      ) : (
        // ====================================================
        // MODO AÑADIR TITULACIÓN
        // ====================================================

        <form onSubmit={handleSubmit}>
          <h3 className="text-sm font-semibold text-[#131A2C]">
            Añadir titulación académica
          </h3>

          <div className="mt-5 space-y-5">
            {/* TIPO DE TITULACIÓN */}
            <div>
              <label
                htmlFor="academic-qualification-type"
                className="block text-xs font-medium text-[#69738A]"
              >
                Tipo de titulación
              </label>

              <select
                id="academic-qualification-type"
                name="qualificationType"
                defaultValue=""
                required
                disabled={isPending}
                className="mt-2 h-11 w-full rounded-lg border border-[#D5DAE3] bg-white px-3.5 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/15 disabled:opacity-60"
              >
                <option value="" disabled>
                  Selecciona el tipo de titulación
                </option>

                {ACADEMIC_QUALIFICATION_TYPES.map(
                  (type) => (
                    <option key={type} value={type}>
                      {ACADEMIC_QUALIFICATION_LABELS[type]}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* DENOMINACIÓN */}
            <div>
              <label
                htmlFor="academic-qualification-name"
                className="block text-xs font-medium text-[#69738A]"
              >
                Denominación de la titulación
              </label>

              <input
                id="academic-qualification-name"
                name="name"
                type="text"
                required
                maxLength={MAX_QUALIFICATION_NAME_LENGTH}
                disabled={isPending}
                placeholder="Ej. Ingeniería Informática"
                className="mt-2 h-11 w-full rounded-lg border border-[#D5DAE3] bg-white px-3.5 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/15 disabled:opacity-60"
              />

              <p className="mt-1.5 text-xs text-[#646E85]">
                Indica la denominación de la titulación
                que has obtenido.
              </p>
            </div>
          </div>

          {/* ERROR */}
          {feedback?.status === "error" && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
            >
              {feedback.message}
            </p>
          )}

          {/* BOTONES */}
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#EEF1F5] pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="h-10 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#4E5870] hover:bg-[#F4F6F9] disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="h-10 rounded-lg bg-[#4F5BD5] px-5 text-sm font-semibold text-white hover:bg-[#3B45B5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Guardando..."
                : "Guardar titulación"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
