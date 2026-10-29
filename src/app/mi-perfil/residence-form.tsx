
"use client";

import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { Pencil } from "lucide-react";

import type { MunicipalityListItem } from "@/modules/user-profile/application/repositories/municipality-query.repository";

import {
  saveResidenceAction,
  type SaveResidenceState,
} from "./actions";
import { normalizeSearchText } from "@/shared/presentation/normalize-search-text";

type ResidenceFormProps = {
  municipalities: MunicipalityListItem[];
  residenceMunicipalityId: number | null;
};

export function ResidenceForm({
  municipalities,
  residenceMunicipalityId,
}: ResidenceFormProps) {
  const [savedId, setSavedId] = useState<number | null>(
    residenceMunicipalityId,
  );

  const [draftId, setDraftId] = useState<number | null>(
    residenceMunicipalityId,
  );

  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] =
    useState<SaveResidenceState | null>(null);

  const [isPending, startTransition] = useTransition();

  // Municipio guardado
  const savedMunicipality = municipalities.find(
    (municipality) => municipality.id === savedId,
  );

  // Municipio seleccionado durante la edición
  const selectedMunicipality = municipalities.find(
    (municipality) => municipality.id === draftId,
  );

  // Filtrar municipios por texto
  const filteredMunicipalities = useMemo(() => {
    const term = normalizeSearchText(search.trim());

    if (!term) {
      return municipalities;
    }

    return municipalities.filter((municipality) =>
      normalizeSearchText(municipality.name).includes(term),
    );
  }, [municipalities, search]);

  // Mantener visible el municipio seleccionado,
  // aunque no coincida con el filtro actual.
  const visibleMunicipalities =
    selectedMunicipality &&
    !filteredMunicipalities.some(
      (municipality) =>
        municipality.id === selectedMunicipality.id,
    )
      ? [selectedMunicipality, ...filteredMunicipalities]
      : filteredMunicipalities;

  // ==========================================================
  // EDITAR
  // ==========================================================

  function handleEdit() {
    setDraftId(savedId);
    setSearch("");
    setFeedback(null);
    setIsEditing(true);
  }

  // ==========================================================
  // CANCELAR
  // ==========================================================

  function handleCancel() {
    setDraftId(savedId);
    setSearch("");
    setFeedback(null);
    setIsEditing(false);
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveResidenceAction(
        { status: "idle", message: "" },
        formData,
      );

      setFeedback(result);

      if (result.status === "success") {
        const updatedId =
          result.residenceMunicipalityId ?? null;

        setSavedId(updatedId);
        setDraftId(updatedId);
        setSearch("");
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
        // MODO CONSULTA
        <div>
          {savedMunicipality ? (
            <dl className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-[#69738A]">
                  Municipio de residencia
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-[#131A2C]">
                  {savedMunicipality.name}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[#69738A]">
                  Comarca
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-[#131A2C]">
                  {savedMunicipality.countyName}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[#69738A]">
                  Provincia
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-[#131A2C]">
                  {savedMunicipality.provinceName}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[#69738A]">
              Todavía no has configurado tu municipio de
              residencia.
            </p>
          )}

          {feedback?.status === "success" && (
            <p
              role="status"
              className="mt-4 text-sm font-medium text-green-700"
            >
              {feedback.message}
            </p>
          )}

          <div className="mt-5 flex justify-end border-t border-[#EEF1F5] pt-4">
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
            >
              <Pencil size={15} />
              Editar
            </button>
          </div>
        </div>
      ) : (
        // MODO EDICIÓN
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* BUSCADOR */}
            <div>
              <label
                htmlFor="residence-search"
                className="block text-xs font-medium text-[#69738A]"
              >
                Buscar municipio
              </label>

              <input
                id="residence-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                disabled={isPending}
                placeholder="Escribe el nombre del municipio..."
                className="mt-2 h-11 w-full rounded-lg border border-[#D5DAE3] bg-white px-3.5 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/15 disabled:opacity-60"
              />

              <p className="mt-1.5 text-xs text-[#646E85]">
                {filteredMunicipalities.length} municipios
                encontrados
              </p>
            </div>

            {/* SELECTOR */}
            <div>
              <label
                htmlFor="residence-municipality"
                className="block text-xs font-medium text-[#69738A]"
              >
                Municipio de residencia
              </label>

              <select
                id="residence-municipality"
                name="residenceMunicipalityId"
                value={draftId ?? ""}
                onChange={(event) =>
                  setDraftId(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                disabled={isPending}
                className="mt-2 h-11 w-full rounded-lg border border-[#D5DAE3] bg-white px-3.5 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/15 disabled:opacity-60"
              >
                <option value="">
                  Sin municipio asignado
                </option>

                {visibleMunicipalities.map((municipality) => (
                  <option
                    key={municipality.id}
                    value={municipality.id}
                  >
                    {municipality.name}
                  </option>
                ))}
              </select>
            </div>

            {/* COMARCA Y PROVINCIA AUTOMÁTICAS */}
            {selectedMunicipality && (
              <div className="grid gap-4 rounded-lg bg-[#F7F8FB] p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-[#69738A]">
                    Comarca
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#131A2C]">
                    {selectedMunicipality.countyName}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#69738A]">
                    Provincia
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#131A2C]">
                    {selectedMunicipality.provinceName}
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-[#646E85]">
              Puedes dejar el municipio sin asignar si
              prefieres no indicar tu residencia.
            </p>
          </div>

          {/* ERROR */}
          {feedback?.status === "error" && (
            <p
              role="alert"
              className="mt-4 text-sm font-medium text-red-700"
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
    </div>
  );
}
