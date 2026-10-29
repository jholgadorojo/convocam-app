import type { ReactNode } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import type { SelectionProcessFilterOptions } from
  "@/modules/selection-process/application/selection-process-filter-options";
import type { SelectionProcessResultsView } from
  "@/modules/selection-process/presentation/selection-process-results-view-toggle";
import {
  RADIUS_KM_OPTIONS,
  type CurrentFilterState,
} from "./search-presentation";
import { TerritoryFilters } from "./territory-filters";

/**
 * Id del formulario de filtros. El buscador y la ordenación,
 * fuera del panel, se envían con él mediante `form={...}`.
 */
export const FILTER_FORM_ID = "convocatorias-filter-form";

const APPLICATION_PERIOD_OPTIONS = [
  { value: "open", label: "Abierto ahora" },
  { value: "future", label: "Próximo a abrir" },
  { value: "closed", label: "Finalizado" },
  { value: "unknown", label: "Sin fechas disponibles" },
];

/** Panel lateral con el formulario de filtros del buscador. */
export function SearchFiltersPanel({
  formKey,
  view,
  filters,
  filterOptions,
}: {
  /** Cambia con la búsqueda para volver a montar el formulario. */
  formKey: string;
  view: SelectionProcessResultsView;
  filters: CurrentFilterState;
  filterOptions: SelectionProcessFilterOptions;
}) {
  return (
    <aside className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#EEF1F5] px-5 py-4">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <SlidersHorizontal size={16} className="text-[#4E5870]" />
          Filtros
        </h2>
        <Link
          href={view === "map" ? "/convocatorias?view=map" : "/convocatorias"}
          className="text-[13.5px] font-semibold text-[#3B45B5] hover:text-[#2E3794]"
        >
          Limpiar
        </Link>
      </div>

      <form key={formKey} id={FILTER_FORM_ID} action="/convocatorias">
        {/* El formulario mantiene la vista al buscar o aplicar filtros. */}
        {view === "map" && (
          <>
            <input type="hidden" name="view" value="map" />
            {/* En el mapa no se muestra el selector de ordenacion. */}
            <input type="hidden" name="sort" value={filters.sort} />
          </>
        )}

        <FilterSection title="Tipo de convocatoria">
          <FilterCheckLabel
            name="isJobPool"
            value="false"
            label="Plazas de plantilla"
            checked={filters.jobPoolValues.includes("false")}
          />
          <FilterCheckLabel
            name="isJobPool"
            value="true"
            label="Bolsa de trabajo"
            checked={filters.jobPoolValues.includes("true")}
          />
        </FilterSection>

        <FilterSection title="Estado oficial CIDO">
          <input type="hidden" name="statusFilterApplied" value="1" />
          {filterOptions.statuses.map((status) => (
            <FilterCheckLabel
              key={status.id}
              name="statusId"
              value={String(status.id)}
              label={status.name}
              checked={filters.statusIds.includes(status.id)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Plazo de solicitud">
          <FilterSelect
            name="applicationPeriod"
            defaultValue={filters.applicationPeriod ?? ""}
            emptyLabel="Todos los plazos"
            options={APPLICATION_PERIOD_OPTIONS}
          />
        </FilterSection>

        <FilterSection title="Ubicación">
          <TerritoryFilters
            key={`territory-${formKey}`}
            territories={filterOptions.territories}
            initialProvince={filters.province}
            initialCounty={filters.county}
            initialMunicipality={filters.municipality}
          />
          <label className="mt-2 flex flex-col gap-1.5 text-sm text-[#131A2C]">
            <span className="text-xs font-medium text-[#69738A]">
              Distancia desde el municipio
            </span>
            <select
              name="radiusKm"
              defaultValue={filters.radiusKm !== undefined ? String(filters.radiusKm) : ""}
              className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]"
            >
              <option value="">Sin límite</option>
              {RADIUS_KM_OPTIONS.map((radius) => (
                <option key={radius} value={radius}>
                  Hasta {radius} km
                </option>
              ))}
            </select>
            <span className="text-xs leading-relaxed text-[#646E85]">
              Se calcula en línea recta desde el municipio seleccionado.
            </span>
          </label>
        </FilterSection>

        <FilterSection title="Grupo de titulación">
          {filterOptions.qualificationGroups.length === 0 ? (
            <p className="text-sm text-[#69738A]">No hay grupos disponibles.</p>
          ) : (
            filterOptions.qualificationGroups.map((group) => (
              <FilterCheckLabel
                key={group}
                name="qualificationGroup"
                value={group}
                label={group}
                checked={filters.qualificationGroups.includes(group)}
              />
            ))
          )}
        </FilterSection>

        <FilterSection title="Ámbito">
          <FilterSelect
            name="scopeId"
            defaultValue={optionalId(filters.scopeId)}
            emptyLabel="Todos los ámbitos"
            options={toSelectOptions(filterOptions.scopes)}
          />
        </FilterSection>

        <FilterSection title="Sistema de selección">
          <FilterSelect
            name="selectionSystemId"
            defaultValue={optionalId(filters.selectionSystemId)}
            emptyLabel="Todos los sistemas"
            options={toSelectOptions(filterOptions.selectionSystems)}
          />
        </FilterSection>

        <FilterSection title="Tipo de personal">
          <FilterSelect
            name="personnelTypeId"
            defaultValue={optionalId(filters.personnelTypeId)}
            emptyLabel="Todos los tipos"
            options={toSelectOptions(filterOptions.personnelTypes)}
          />
        </FilterSection>

        <FilterSection title="Fin del plazo de solicitud">
          <FilterDate
            name="applicationEndDateFrom"
            label="Desde"
            defaultValue={filters.applicationEndDateFrom}
          />
          <FilterDate
            name="applicationEndDateTo"
            label="Hasta"
            defaultValue={filters.applicationEndDateTo}
          />
        </FilterSection>

        <FilterSection title="Reservas">
          <FilterCheckLabel
            name="reservedDisability"
            value="true"
            label="Personas con discapacidad"
            checked={filters.reservedDisability}
          />
          <FilterCheckLabel
            name="reservedUnemployed"
            value="true"
            label="Personas desempleadas"
            checked={filters.reservedUnemployed}
          />
          <FilterCheckLabel
            name="reservedYoung"
            value="true"
            label="Jóvenes"
            checked={filters.reservedYoung}
          />
          <FilterCheckLabel
            name="reservedWomen"
            value="true"
            label="Mujeres"
            checked={filters.reservedWomen}
          />
        </FilterSection>

        <div className="p-5">
          <button
            type="submit"
            className="w-full rounded-lg bg-[#4F5BD5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
          >
            Aplicar filtros
          </button>
        </div>
      </form>
    </aside>
  );
}

function optionalId(value: number | undefined): string {
  return value !== undefined ? String(value) : "";
}

function toSelectOptions(
  options: SelectionProcessFilterOptions["scopes"],
): FilterSelectOption[] {
  return options.map((option) => ({
    value: String(option.id),
    label: option.name,
  }));
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-b border-[#EEF1F5] px-5 py-4">
      <legend className="mb-3 text-[13.5px] font-semibold text-[#131A2C]">
        {title}
      </legend>
      <div className="flex flex-col gap-2.5">{children}</div>
    </fieldset>
  );
}

function FilterCheckLabel({
  name,
  value,
  label,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex min-h-[30px] cursor-pointer items-start gap-2.5 text-sm text-[#131A2C]">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-[#D5DAE3]"
      />
      <span>{label}</span>
    </label>
  );
}

type FilterSelectOption = {
  value: string;
  label: string;
};

function FilterSelect({
  name,
  defaultValue,
  emptyLabel,
  options,
}: {
  name: string;
  defaultValue: string;
  emptyLabel: string;
  options: FilterSelectOption[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]"
    >
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function FilterDate({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string | undefined;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-[#131A2C]">
      <span className="text-xs font-medium text-[#69738A]">{label}</span>
      <input
        type="date"
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm outline-none focus:border-[#4F5BD5]"
      />
    </label>
  );
}
