
"use client";

import {
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import {
  ACADEMIC_QUALIFICATION_TYPES,
  MAX_QUALIFICATION_NAME_LENGTH,
  type AcademicQualificationType,
} from "@/modules/user-profile/domain/user-academic-qualification";

import type { UserAcademicQualificationDto } from "@/modules/user-profile/application/dto/user-academic-qualification.dto";

import { ACADEMIC_QUALIFICATION_LABELS } from "@/modules/user-profile/presentation/academic-qualification-labels";

import {
  updateAcademicQualificationAction,
  deleteAcademicQualificationAction,
  type AcademicQualificationMutationState,
} from "./actions";

import { AddAcademicQualificationForm } from "./add-academic-qualification-form";

type QualificationItemProps = {
  qualification: UserAcademicQualificationDto;
  onDeleted: (id: number) => void;
};

type AcademicQualificationsSectionProps = {
  qualifications: UserAcademicQualificationDto[];
};

type ItemMode = "view" | "edit" | "confirm-delete";

// ============================================================
// UNA TITULACIÓN ACADÉMICA
// ============================================================

function QualificationItem({
  qualification,
  onDeleted,
}: QualificationItemProps) {
  const router = useRouter();

  const [current, setCurrent] = useState(qualification);

  const [mode, setMode] = useState<ItemMode>("view");

  const [draftType, setDraftType] =
    useState<AcademicQualificationType>(
      qualification.qualificationType,
    );

  const [draftName, setDraftName] = useState(
    qualification.name,
  );

  const [feedback, setFeedback] =
    useState<AcademicQualificationMutationState | null>(
      null,
    );

  const [isPending, startTransition] = useTransition();

  // ==========================================================
  // EDITAR
  // ==========================================================

  function handleEdit() {
    setDraftType(current.qualificationType);
    setDraftName(current.name);
    setFeedback(null);
    setMode("edit");
  }

  // ==========================================================
  // SOLICITAR ELIMINACIÓN
  // ==========================================================

  function handleAskDelete() {
    setFeedback(null);
    setMode("confirm-delete");
  }

  // ==========================================================
  // CANCELAR
  // ==========================================================

  function handleCancel() {
    setDraftType(current.qualificationType);
    setDraftName(current.name);
    setFeedback(null);
    setMode("view");
  }

  // ==========================================================
  // GUARDAR MODIFICACIÓN
  // ==========================================================

  function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result =
          await updateAcademicQualificationAction(
            formData,
          );

        setFeedback(result);

        if (result.status === "success") {
          setCurrent({
            ...current,
            qualificationType: draftType,
            name: draftName.trim(),
          });

          setMode("view");
          router.refresh();
        }
      } catch {
        setFeedback({
          status: "error",
          message:
            "No se ha podido completar la operación.",
        });
      }
    });
  }

  // ==========================================================
  // CONFIRMAR ELIMINACIÓN
  // ==========================================================

  function handleDelete() {
    const formData = new FormData();

    formData.set(
      "qualificationId",
      String(current.id),
    );

    startTransition(async () => {
      try {
        const result =
          await deleteAcademicQualificationAction(
            formData,
          );

        setFeedback(result);

        if (result.status === "success") {
          onDeleted(current.id);
          router.refresh();
        }
      } catch {
        setFeedback({
          status: "error",
          message:
            "No se ha podido completar la eliminación.",
        });
      }
    });
  }

  // ==========================================================
  // RENDERIZADO
  // ==========================================================

  return (
    <li className="rounded-lg border border-[#E3E7EE] bg-[#FAFBFD] p-4">
      {/* ====================================================
          MODO CONSULTA
      ==================================================== */}

      {mode === "view" && (
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#69738A]">
                {
                  ACADEMIC_QUALIFICATION_LABELS[
                    current.qualificationType
                  ]
                }
              </p>

              <p className="mt-1.5 text-sm font-semibold text-[#131A2C]">
                {current.name}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 text-xs font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
              >
                <Pencil size={14} />
                Editar
              </button>

              <button
                type="button"
                onClick={handleAskDelete}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </div>

          {feedback?.status === "success" && (
            <p
              role="status"
              className="mt-3 text-sm font-medium text-green-700"
            >
              {feedback.message}
            </p>
          )}
        </div>
      )}

      {/* ====================================================
          MODO EDICIÓN
      ==================================================== */}

      {mode === "edit" && (
        <form onSubmit={handleUpdate}>
          <h3 className="text-sm font-semibold text-[#131A2C]">
            Editar titulación académica
          </h3>

          <input
            type="hidden"
            name="qualificationId"
            value={current.id}
          />

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor={`qualification-type-${current.id}`}
                className="block text-xs font-medium text-[#69738A]"
              >
                Tipo de titulación
              </label>

              <select
                id={`qualification-type-${current.id}`}
                name="qualificationType"
                value={draftType}
                onChange={(event) =>
                  setDraftType(
                    event.target.value as AcademicQualificationType,
                  )
                }
                disabled={isPending}
                required
                className="mt-2 h-11 w-full rounded-lg border border-[#D5DAE3] bg-white px-3.5 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/15 disabled:opacity-60"
              >
                {ACADEMIC_QUALIFICATION_TYPES.map(
                  (type) => (
                    <option key={type} value={type}>
                      {ACADEMIC_QUALIFICATION_LABELS[type]}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor={`qualification-name-${current.id}`}
                className="block text-xs font-medium text-[#69738A]"
              >
                Denominación de la titulación
              </label>

              <input
                id={`qualification-name-${current.id}`}
                name="name"
                type="text"
                maxLength={MAX_QUALIFICATION_NAME_LENGTH}
                value={draftName}
                onChange={(event) =>
                  setDraftName(event.target.value)
                }
                required
                disabled={isPending}
                className="mt-2 h-11 w-full rounded-lg border border-[#D5DAE3] bg-white px-3.5 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/15 disabled:opacity-60"
              />
            </div>
          </div>

          {feedback?.status === "error" && (
            <p
              role="alert"
              className="mt-4 text-sm font-medium text-red-700"
            >
              {feedback.message}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2 border-t border-[#E3E7EE] pt-4">
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
              className="h-10 rounded-lg bg-[#4F5BD5] px-5 text-sm font-semibold text-white hover:bg-[#3B45B5] disabled:opacity-60"
            >
              {isPending
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      )}

      {/* ====================================================
          CONFIRMACIÓN DE ELIMINACIÓN
      ==================================================== */}

      {mode === "confirm-delete" && (
        <div>
          <h3 className="text-sm font-semibold text-[#131A2C]">
            ¿Eliminar esta titulación?
          </h3>

          <p className="mt-2 text-sm text-[#4E5870]">
            Vas a eliminar la titulación
            {" "}
            <strong>{current.name}</strong>.
            Esta acción no se puede deshacer.
          </p>

          {feedback?.status === "error" && (
            <p
              role="alert"
              className="mt-4 text-sm font-medium text-red-700"
            >
              {feedback.message}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2 border-t border-[#E3E7EE] pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="h-10 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#4E5870] hover:bg-[#F4F6F9] disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isPending
                ? "Eliminando..."
                : "Eliminar definitivamente"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

// ============================================================
// SECCIÓN COMPLETA DE FORMACIÓN ACADÉMICA
// ============================================================

export function AcademicQualificationsSection({
  qualifications,
}: AcademicQualificationsSectionProps) {
  const [removedIds, setRemovedIds] = useState<number[]>(
    [],
  );

  const [deleteMessage, setDeleteMessage] = useState("");

  const visibleQualifications = qualifications.filter(
    (qualification) =>
      !removedIds.includes(qualification.id),
  );

  function handleDeleted(id: number) {
    setRemovedIds((previous) => [...previous, id]);
    setDeleteMessage(
      "Titulación eliminada correctamente.",
    );
  }

  return (
    <div className="mt-5 border-t border-[#EEF1F5] pt-5">
      {visibleQualifications.length === 0 ? (
        <p className="text-sm text-[#69738A]">
          Todavía no has añadido ninguna titulación
          académica.
        </p>
      ) : (
        <ul className="space-y-3">
          {visibleQualifications.map((qualification) => (
            <QualificationItem
              key={qualification.id}
              qualification={qualification}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}

      {deleteMessage && (
        <p
          role="status"
          className="mt-4 text-sm font-medium text-green-700"
        >
          {deleteMessage}
        </p>
      )}

      <AddAcademicQualificationForm />
    </div>
  );
}
