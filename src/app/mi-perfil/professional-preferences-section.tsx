
"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import type {
  ProfessionalPreferenceOptionsDto,
} from "@/modules/user-profile/application/dto/professional-preference-options.dto";

import type {
  UserProfessionalPreferenceDto,
} from "@/modules/user-profile/application/dto/user-professional-preference.dto";

import type {
  PreferredSelectionProcessType,
  ProfessionalPreferenceSelection,
} from "@/modules/user-profile/domain/user-professional-preference";

import {
  deleteProfessionalPreferencesAction,
  saveProfessionalPreferencesAction,
} from "./professional-actions";

// ============================================================
// PROPIEDADES
// ============================================================

type Props = {
  preference: UserProfessionalPreferenceDto | null;
  options: ProfessionalPreferenceOptionsDto;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type SelectionTypeOption = {
  value: PreferredSelectionProcessType | null;
  label: string;
  description: string;
};

// ============================================================
// TIPOS DE CONVOCATORIA
// ============================================================

const SELECTION_TYPES: SelectionTypeOption[] = [
  {
    value: "POSITIONS",
    label: "Plazas",
    description: "Convocatorias de plazas.",
  },
  {
    value: "JOB_POOLS",
    label: "Bolsas de trabajo",
    description: "Constitución de bolsas.",
  },
  {
    value: "BOTH",
    label: "Ambas",
    description: "Plazas y bolsas de trabajo.",
  },
  {
    value: null,
    label: "Sin preferencia",
    description: "No indicar un tipo concreto.",
  },
];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function emptySelection(): ProfessionalPreferenceSelection {
  return {
    selectionProcessType: null,
    subjectAreaIds: [],
    qualificationGroups: [],
  };
}

function toSelection(
  preference: UserProfessionalPreferenceDto | null,
): ProfessionalPreferenceSelection {
  if (!preference) {
    return emptySelection();
  }

  return {
    selectionProcessType: preference.selectionProcessType,
    subjectAreaIds: [...preference.subjectAreaIds],
    qualificationGroups: [...preference.qualificationGroups],
  };
}

function sameValues<T extends string | number>(
  first: T[],
  second: T[],
): boolean {
  return (
    first.length === second.length &&
    first.every((value) => second.includes(value))
  );
}

function sameSelection(
  first: ProfessionalPreferenceSelection,
  second: ProfessionalPreferenceSelection,
): boolean {
  return (
    first.selectionProcessType ===
      second.selectionProcessType &&
    sameValues(first.subjectAreaIds, second.subjectAreaIds) &&
    sameValues(
      first.qualificationGroups,
      second.qualificationGroups,
    )
  );
}

function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ============================================================
// COMPONENTE
// ============================================================

export function ProfessionalPreferencesSection({
  preference,
  options,
}: Props) {
  // Configuración realmente guardada.
  const [savedPreference, setSavedPreference] =
    useState<UserProfessionalPreferenceDto | null>(
      preference,
    );

  // Configuración que el usuario está editando.
  const [selection, setSelection] =
    useState<ProfessionalPreferenceSelection>(
      () => toSelection(preference),
    );

  const [subjectSearch, setSubjectSearch] =
    useState("");

  const [isBusy, setIsBusy] = useState(false);

  const [confirmDelete, setConfirmDelete] =
    useState(false);

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  // ==========================================================
  // DETECTAR CAMBIOS
  // ==========================================================

  const savedSelection = toSelection(savedPreference);

  const hasChanges = !sameSelection(
    selection,
    savedSelection,
  );

  // Se permite guardar una configuración inicial
  // aunque todos sus criterios sean opcionales.
  const canSave =
    !isBusy &&
    (savedPreference === null || hasChanges);

  // ==========================================================
  // FILTRAR MATERIAS
  // ==========================================================

  const filteredSubjectAreas = useMemo(() => {
    const query = normalizeSearch(subjectSearch);

    if (!query) {
      return options.subjectAreas;
    }

    return options.subjectAreas.filter((area) =>
      normalizeSearch(area.name).includes(query),
    );
  }, [options.subjectAreas, subjectSearch]);

  // ==========================================================
  // CAMBIAR TIPO DE CONVOCATORIA
  // ==========================================================

  function changeSelectionType(
    value: PreferredSelectionProcessType | null,
  ) {
    setSelection((current) => ({
      ...current,
      selectionProcessType: value,
    }));

    setFeedback(null);
    setConfirmDelete(false);
  }

  // ==========================================================
  // SELECCIONAR O DESELECCIONAR MATERIA
  // ==========================================================

  function toggleSubjectArea(id: number) {
    setSelection((current) => {
      const selected =
        current.subjectAreaIds.includes(id);

      return {
        ...current,
        subjectAreaIds: selected
          ? current.subjectAreaIds.filter(
              (value) => value !== id,
            )
          : [...current.subjectAreaIds, id],
      };
    });

    setFeedback(null);
    setConfirmDelete(false);
  }

  // ==========================================================
  // SELECCIONAR O DESELECCIONAR GRUPO
  // ==========================================================

  function toggleQualificationGroup(group: string) {
    setSelection((current) => {
      const selected =
        current.qualificationGroups.includes(group);

      return {
        ...current,
        qualificationGroups: selected
          ? current.qualificationGroups.filter(
              (value) => value !== group,
            )
          : [...current.qualificationGroups, group],
      };
    });

    setFeedback(null);
    setConfirmDelete(false);
  }

  // ==========================================================
  // DESCARTAR CAMBIOS
  // ==========================================================

  function discardChanges() {
    setSelection(toSelection(savedPreference));
    setFeedback(null);
    setConfirmDelete(false);
  }

  // ==========================================================
  // GUARDAR PREFERENCIAS
  // ==========================================================

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);
    setConfirmDelete(false);

    try {
      const result =
        await saveProfessionalPreferencesAction({
          selectionProcessType:
            selection.selectionProcessType,

          subjectAreaIds:
            [...selection.subjectAreaIds],

          qualificationGroups:
            [...selection.qualificationGroups],
        });

      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.message,
        });
        return;
      }

      if (!result.preference) {
        setFeedback({
          type: "error",
          message:
            "No se ha podido recuperar la configuración guardada.",
        });
        return;
      }

      setSavedPreference(result.preference);
      setSelection(toSelection(result.preference));

      setFeedback({
        type: "success",
        message:
          "Preferencias profesionales guardadas correctamente.",
      });
    } catch {
      setFeedback({
        type: "error",
        message:
          "No se han podido guardar las preferencias profesionales.",
      });
    } finally {
      setIsBusy(false);
    }
  }

  // ==========================================================
  // ELIMINAR PREFERENCIAS
  // ==========================================================

  async function handleDelete() {
    if (isBusy || savedPreference === null) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const result =
        await deleteProfessionalPreferencesAction();

      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.message,
        });
        return;
      }

      setSavedPreference(null);
      setSelection(emptySelection());
      setSubjectSearch("");
      setConfirmDelete(false);

      setFeedback({
        type: "success",
        message:
          "Preferencias profesionales eliminadas correctamente.",
      });
    } catch {
      setFeedback({
        type: "error",
        message:
          "No se han podido eliminar las preferencias profesionales.",
      });
    } finally {
      setIsBusy(false);
    }
  }

  // ==========================================================
  // INTERFAZ
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* ESTADO ACTUAL */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#4E5870]">
          Selecciona las convocatorias, materias y
          grupos de titulación que te interesan.
        </p>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {savedPreference === null
            ? "Sin configurar"
            : "Configurado"}
        </span>
      </div>

      {/* TIPO DE CONVOCATORIA */}

      <fieldset
        disabled={isBusy}
        className="space-y-3"
      >
        <legend className="text-sm font-semibold text-[#131A2C]">
          Tipo de convocatoria
        </legend>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SELECTION_TYPES.map((option) => {
            const selected =
              selection.selectionProcessType ===
              option.value;

            return (
              <label
                key={option.value ?? "NONE"}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                  selected
                    ? "border-[#4F5BD5] bg-[#F5F6FF]"
                    : "border-[#D5DAE3] bg-white",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="professional-selection-process-type"
                  value={option.value ?? "NONE"}
                  checked={selected}
                  onChange={() =>
                    changeSelectionType(option.value)
                  }
                  className="mt-1 accent-[#4F5BD5]"
                />

                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-[#131A2C]">
                    {option.label}
                  </span>

                  <span className="text-xs text-[#4E5870]">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ÁREAS Y MATERIAS */}

      <fieldset
        disabled={isBusy}
        className="space-y-3"
      >
        <legend className="text-sm font-semibold text-[#131A2C]">
          Áreas y materias profesionales
        </legend>

        <p className="text-xs text-[#4E5870]">
          Puedes seleccionar varias materias.
        </p>

        {/* Buscador */}

        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7C859B]"
          />

          <input
            type="search"
            value={subjectSearch}
            onChange={(event) =>
              setSubjectSearch(event.target.value)
            }
            placeholder="Buscar materias..."
            aria-label="Buscar materias profesionales"
            className="w-full rounded-lg border border-[#D5DAE3] bg-white py-2.5 pl-10 pr-3 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]"
          />
        </div>

        {/* Materias seleccionadas */}

        {selection.subjectAreaIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selection.subjectAreaIds.map((id) => {
              const area = options.subjectAreas.find(
                (item) => item.id === id,
              );

              const name =
                area?.name ?? `Materia ${id}`;

              return (
                <button
                  key={id}
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    toggleSubjectArea(id)
                  }
                  aria-label={`Quitar ${name}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF0FF] px-3 py-1 text-xs font-medium text-[#3542A2] disabled:opacity-50"
                >
                  <span>{name}</span>
                  <X size={13} />
                </button>
              );
            })}
          </div>
        )}

        {/* Lista con selección múltiple */}

        <div className="max-h-64 overflow-y-auto rounded-lg border border-[#D5DAE3] bg-white">
          {filteredSubjectAreas.length === 0 ? (
            <p className="p-4 text-sm text-[#4E5870]">
              No hay materias que coincidan con la búsqueda.
            </p>
          ) : (
            filteredSubjectAreas.map((area) => {
              const selected =
                selection.subjectAreaIds.includes(
                  area.id,
                );

              return (
                <label
                  key={area.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-[#EDF0F4] px-4 py-2.5 last:border-b-0 hover:bg-[#F8F9FC]"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      toggleSubjectArea(area.id)
                    }
                    className="h-4 w-4 accent-[#4F5BD5]"
                  />

                  <span className="text-sm text-[#131A2C]">
                    {area.name}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <p className="text-xs text-[#4E5870]">
          {selection.subjectAreaIds.length} materias seleccionadas
        </p>
      </fieldset>

      {/* GRUPOS DE TITULACIÓN */}

      <fieldset
        disabled={isBusy}
        className="space-y-3"
      >
        <legend className="text-sm font-semibold text-[#131A2C]">
          Grupos de titulación
        </legend>

        <p className="text-xs text-[#4E5870]">
          Selecciona todos los grupos que te interesen.
        </p>

        {options.qualificationGroups.length === 0 ? (
          <p className="rounded-lg border border-[#D5DAE3] p-4 text-sm text-[#4E5870]">
            No hay grupos de titulación disponibles en CIDO.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {options.qualificationGroups.map(
              (group) => {
                const selected =
                  selection.qualificationGroups.includes(
                    group,
                  );

                return (
                  <label
                    key={group}
                    className={[
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-3",
                      selected
                        ? "border-[#4F5BD5] bg-[#F5F6FF]"
                        : "border-[#D5DAE3] bg-white",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleQualificationGroup(group)
                      }
                      className="h-4 w-4 accent-[#4F5BD5]"
                    />

                    <span className="text-sm text-[#131A2C]">
                      {group}
                    </span>
                  </label>
                );
              },
            )}
          </div>
        )}

        <p className="text-xs text-[#4E5870]">
          {selection.qualificationGroups.length} grupos seleccionados
        </p>
      </fieldset>

      {/* MENSAJES */}

      {feedback && (
        <div
          role={
            feedback.type === "error"
              ? "alert"
              : "status"
          }
          className={[
            "rounded-lg border px-4 py-3 text-sm",
            feedback.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#D5DAE3] bg-[#F8F9FC] text-[#131A2C]",
          ].join(" ")}
        >
          {feedback.message}
        </div>
      )}

      {/* CONFIRMACIÓN DE ELIMINACIÓN */}

      {confirmDelete && savedPreference !== null && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            ¿Eliminar tus preferencias profesionales?
          </p>

          <p className="text-sm text-red-700">
            Se eliminarán todas las preferencias
            profesionales guardadas. Tus datos personales,
            estudios y preferencias territoriales no cambiarán.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleDelete()}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Sí, eliminar
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                setConfirmDelete(false)
              }
              className="rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-medium text-[#131A2C]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* BOTONES */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E9F0] pt-5">
        <div>
          {savedPreference !== null && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setConfirmDelete(true);
                setFeedback(null);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Eliminar preferencias
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isBusy || !hasChanges}
            onClick={discardChanges}
            className="rounded-lg border border-[#D5DAE3] bg-white px-4 py-2.5 text-sm font-medium text-[#131A2C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Descartar cambios
          </button>

          <button
            type="button"
            disabled={!canSave}
            onClick={() => void handleSave()}
            className="rounded-lg bg-[#1B2A4D] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy
              ? "Procesando..."
              : savedPreference === null
                ? "Guardar preferencias"
                : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
