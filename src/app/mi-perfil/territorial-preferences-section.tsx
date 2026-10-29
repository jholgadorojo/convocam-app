"use client";
import {
  useId,
  useMemo,
  useState,
} from "react";
import type {
  TerritorialPreferenceOptionsDto,
} from "@/modules/user-profile/application/dto/territorial-preference-options.dto";
import type {
  UserTerritorialPreferenceDto,
} from "@/modules/user-profile/application/dto/user-territorial-preference.dto";
import {
  saveTerritorialPreferencesAction,
  deleteTerritorialPreferencesAction,
} from "./territorial-actions";
import { normalizeSearchText } from "@/shared/presentation/normalize-search-text";
// ============================================================
// TIPOS
// ============================================================
type Scope = UserTerritorialPreferenceDto["scope"];
type Selection = {
  provinceIds: number[];
  countyIds: number[];
  municipalityIds: number[];
};
type Draft = Selection & {
  scope: Scope | null;
};
type TerritoryOption = {
  id: number;
  name: string;
  detail?: string;
};
type Props = {
  preference: UserTerritorialPreferenceDto | null;
  options: TerritorialPreferenceOptionsDto;
};
type Feedback = {
  type: "success" | "error";
  message: string;
};
// ============================================================
// FUNCIONES AUXILIARES
// ============================================================
function createDraft(
  preference: UserTerritorialPreferenceDto | null,
): Draft {
  return {
    scope: preference?.scope ?? null,
    provinceIds: [...(preference?.provinceIds ?? [])],
    countyIds: [...(preference?.countyIds ?? [])],
    municipalityIds: [
      ...(preference?.municipalityIds ?? []),
    ],
  };
}
// ============================================================
// SELECTOR MÚLTIPLE
// ============================================================
type TerritoryMultiSelectProps = {
  title: string;
  options: TerritoryOption[];
  selectedIds: number[];
  disabled?: boolean;
  onChange: (ids: number[]) => void;
};
function TerritoryMultiSelect({
  title,
  options,
  selectedIds,
  disabled = false,
  onChange,
}: TerritoryMultiSelectProps) {
  const searchId = useId();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const selectedSet = new Set(selectedIds);
  const selectedOptions = options.filter(
    (option) => selectedSet.has(option.id),
  );
  // Buscamos por el nombre del territorio. En municipios, incluir la
  // comarca o la provincia provocaba coincidencias que ocultaban el
  // municipio buscado entre los primeros 12 resultados.
  const normalizedSearch = normalizeSearchText(search);

  const filteredOptions = options.filter((option) =>
    normalizeSearchText(option.name).includes(normalizedSearch),
  );
  const visibleOptions = filteredOptions.slice(0, 12);
  function toggleTerritory(id: number) {
    if (disabled) return;
    if (selectedSet.has(id)) {
      onChange(
        selectedIds.filter((value) => value !== id),
      );
    } else {
      onChange([...selectedIds, id]);
    }
  }
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} seleccionados
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          {expanded ? "Ocultar" : "Buscar y seleccionar"}
        </button>
      </div>
      {/* ELEMENTOS SELECCIONADOS */}
      {selectedOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm text-secondary-foreground"
            >
              {option.name}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Quitar ${option.name}`}
                onClick={() => toggleTerritory(option.id)}
                className="font-bold hover:text-destructive disabled:opacity-50"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {/* BUSCADOR */}
      {expanded && (
        <div className="mt-4 space-y-3">
          <label htmlFor={searchId} className="sr-only">
            Buscar {title.toLowerCase()}
          </label>
          <input
            id={searchId}
            type="search"
            value={search}
            disabled={disabled}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={`Buscar ${title.toLowerCase()}...`}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <div className="max-h-64 overflow-y-auto rounded-md border border-border">
            {visibleOptions.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                No se han encontrado territorios.
              </p>
            ) : (
              visibleOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 border-b border-border p-3 last:border-b-0 hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={selectedSet.has(option.id)}
                    disabled={disabled}
                    onChange={() =>
                      toggleTerritory(option.id)
                    }
                    className="mt-1 h-4 w-4"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {option.name}
                    </span>
                    {option.detail && (
                      <span className="block text-xs text-muted-foreground">
                        {option.detail}
                      </span>
                    )}
                  </span>
                </label>
              ))
            )}
          </div>
          {filteredOptions.length > 12 && (
            <p className="text-xs text-muted-foreground">
              Mostrando 12 de {filteredOptions.length} resultados.
              Escribe para concretar la búsqueda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
// ============================================================
// SECCIÓN DE PREFERENCIAS TERRITORIALES
// ============================================================
export function TerritorialPreferencesSection({
  preference,
  options,
}: Props) {
// Preferencias confirmadas en la base de datos.
  const [savedPreference, setSavedPreference] =
    useState<UserTerritorialPreferenceDto | null>(
      preference,
    );
// Cambios realizados en el formulario.
  const [draft, setDraft] = useState<Draft>(
    () => createDraft(preference),
  );
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] =
    useState<Feedback | null>(null);
  const [
    showDeleteConfirmation,
    setShowDeleteConfirmation,
  ] = useState(false);
// ==========================================================
// OPCIONES DE MUNICIPIOS
// ==========================================================
  const municipalityOptions = useMemo(() => {
    const counties = new Map(
      options.counties.map((county) => [
        county.id,
        county.name,
      ]),
    );
    const provinces = new Map(
      options.provinces.map((province) => [
        province.id,
        province.name,
      ]),
    );
    return options.municipalities.map((municipality) => ({
      id: municipality.id,
      name: municipality.name,
      detail: [
        counties.get(municipality.countyId),
        provinces.get(municipality.provinceId),
      ]
        .filter(Boolean)
        .join(" · "),
    }));
  }, [options]);
// ==========================================================
// CAMBIAR ÁMBITO
// ==========================================================
  function changeScope(scope: Scope) {
    setFeedback(null);
    setShowDeleteConfirmation(false);
    if (scope === "ALL_CATALONIA") {
      setDraft({
        scope,
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      });
      return;
    }
    setDraft((current) => ({
      ...current,
      scope,
    }));
  }
// ==========================================================
// MODIFICAR SELECCIÓN
// ==========================================================
  function updateSelection(
    field: keyof Selection,
    ids: number[],
  ) {
    setFeedback(null);
    setDraft((current) => ({
      ...current,
      [field]: ids,
    }));
  }
// ==========================================================
// RESTABLECER CAMBIOS NO GUARDADOS
// ==========================================================
  function resetDraft() {
    setDraft(createDraft(savedPreference));
    setFeedback(null);
    setShowDeleteConfirmation(false);
  }
// ==========================================================
// GUARDAR CAMBIOS
// ==========================================================
  async function handleSave() {
    if (isBusy) return;
    if (draft.scope === null) {
      setFeedback({
        type: "error",
        message: "Selecciona un ámbito territorial.",
      });
      return;
    }
    if (
      draft.scope === "SELECTED_TERRITORIES" &&
      selectedCount === 0
    ) {
      setFeedback({
        type: "error",
        message: "Selecciona al menos un territorio.",
      });
      return;
    }
    setIsBusy(true);
    setFeedback(null);
    setShowDeleteConfirmation(false);
    try {
      const result =
        await saveTerritorialPreferencesAction({
          scope: draft.scope,
          provinceIds: draft.provinceIds,
          countyIds: draft.countyIds,
          municipalityIds: draft.municipalityIds,
        });
      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.message,
        });
        return;
      }
      setSavedPreference(result.preference);
      setDraft(createDraft(result.preference));
      setFeedback({
        type: "success",
        message: "Preferencias territoriales guardadas correctamente.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Ha ocurrido un error al guardar las preferencias.",
      });
    } finally {
      setIsBusy(false);
    }
  }
// ==========================================================
// ELIMINAR PREFERENCIAS
// ==========================================================
  async function handleDelete() {
    if (isBusy) return;
    setIsBusy(true);
    setFeedback(null);
    try {
      const result =
        await deleteTerritorialPreferencesAction();
      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.message,
        });
        return;
      }
      setSavedPreference(null);
      setDraft(createDraft(null));
      setShowDeleteConfirmation(false);
      setFeedback({
        type: "success",
        message: "Preferencias eliminadas. El perfil vuelve a estar sin configurar.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Ha ocurrido un error al eliminar las preferencias.",
      });
    } finally {
      setIsBusy(false);
    }
  }
// ==========================================================
// RESUMEN Y VALIDACIÓN
// ==========================================================
  const selectedCount =
    draft.provinceIds.length +
    draft.countyIds.length +
    draft.municipalityIds.length;
  const canSave =
    !isBusy &&
    draft.scope !== null &&
    (
      draft.scope === "ALL_CATALONIA" ||
      selectedCount > 0
    );
// ==========================================================
// INTERFAZ
// ==========================================================
  return (
    <section className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      {/* CABECERA */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold">
          Preferencias territoriales
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Indica en qué zonas de Catalunya te interesan las
          convocatorias.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Estado guardado:{" "}
          <span className="font-medium text-foreground">
            {savedPreference === null
              ? "Sin configurar"
              : savedPreference.scope === "ALL_CATALONIA"
                ? "Toda Catalunya"
                : "Territorios seleccionados"}
          </span>
        </p>
      </div>
      {/* ÁMBITO TERRITORIAL */}
      <fieldset
        disabled={isBusy}
        className="space-y-3"
      >
        <legend className="mb-3 font-medium">
          Ámbito de interés
        </legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
          <input
            type="radio"
            name="territorial-preference-scope"
            checked={draft.scope === "ALL_CATALONIA"}
            onChange={() =>
              changeScope("ALL_CATALONIA")
            }
            className="mt-1"
          />
          <span>
            <span className="block font-medium">
              Toda Catalunya
            </span>
            <span className="block text-sm text-muted-foreground">
              Me interesan las convocatorias de cualquier
              municipio de Catalunya.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
          <input
            type="radio"
            name="territorial-preference-scope"
            checked={
              draft.scope === "SELECTED_TERRITORIES"
            }
            onChange={() =>
              changeScope("SELECTED_TERRITORIES")
            }
            className="mt-1"
          />
          <span>
            <span className="block font-medium">
              Seleccionar territorios
            </span>
            <span className="block text-sm text-muted-foreground">
              Quiero elegir provincias, comarcas o
              municipios concretos.
            </span>
          </span>
        </label>
      </fieldset>
      {/* SELECTORES DE TERRITORIOS */}
      {draft.scope === "SELECTED_TERRITORIES" && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Puedes combinar libremente provincias,
            comarcas y municipios. Cada territorio
            seleccionado se considera de forma independiente.
          </p>
          <TerritoryMultiSelect
            title="Provincias"
            options={options.provinces}
            selectedIds={draft.provinceIds}
            disabled={isBusy}
            onChange={(ids) =>
              updateSelection("provinceIds", ids)
            }
          />
          <TerritoryMultiSelect
            title="Comarcas"
            options={options.counties}
            selectedIds={draft.countyIds}
            disabled={isBusy}
            onChange={(ids) =>
              updateSelection("countyIds", ids)
            }
          />
          <TerritoryMultiSelect
            title="Municipios"
            options={municipalityOptions}
            selectedIds={draft.municipalityIds}
            disabled={isBusy}
            onChange={(ids) =>
              updateSelection("municipalityIds", ids)
            }
          />
          {selectedCount === 0 && (
            <p
              role="status"
              className="text-sm text-amber-700"
            >
              Selecciona al menos un territorio.
            </p>
          )}
        </div>
      )}
      {/* RESUMEN DE LA SELECCIÓN */}
      <div className="mt-5 rounded-lg bg-muted p-4">
        <p className="font-medium">
          Selección actual
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {draft.scope === null
            ? "Todavía no has elegido un ámbito."
            : draft.scope === "ALL_CATALONIA"
              ? "Toda Catalunya."
              : `${draft.provinceIds.length} provincias, ${draft.countyIds.length} comarcas y ${draft.municipalityIds.length} municipios.`}
        </p>
      </div>
      {/* MENSAJES DE RESULTADO */}
      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`mt-4 rounded-lg border p-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}
      {/* CONFIRMACIÓN DE ELIMINACIÓN */}
      {showDeleteConfirmation && savedPreference && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">
            ¿Eliminar las preferencias territoriales?
          </p>
          <p className="mt-1 text-sm text-red-700">
            Se eliminará tu configuración guardada.
            Podrás volver a establecerla cuando quieras.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isBusy ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                setShowDeleteConfirmation(false)
              }
              className="rounded-md border border-input bg-white px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {/* BOTONES PRINCIPALES */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          {savedPreference && !showDeleteConfirmation && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setFeedback(null);
                setShowDeleteConfirmation(true);
              }}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Eliminar preferencias
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={resetDraft}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            Restablecer selección
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="rounded-md bg-[#4F5BD5] px-4 py-2 text-sm font-medium text-white hover:bg-[#404BC0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </section>
  );
}
