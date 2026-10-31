import type { SelectionProcessSort } from
  "@/modules/selection-process/application/selection-process-search-filters";
import {
  SelectionProcessResultsViewToggle,
  type SelectionProcessResultsView,
} from "@/modules/selection-process/presentation/selection-process-results-view-toggle";
import { FILTER_FORM_ID } from "./search-filters-panel";
import { SearchFiltersSheetTrigger } from "./search-filters-sheet";

const SORT_OPTIONS: { value: SelectionProcessSort; label: string }[] = [
  { value: "relevance", label: "Relevancia" },
  { value: "publication-desc", label: "Última publicación oficial" },
  { value: "deadline-asc", label: "Plazo: finaliza antes" },
  { value: "deadline-desc", label: "Plazo: finaliza después" },
  { value: "municipality-asc", label: "Municipio: A → Z" },
];

/**
 * Total de resultados, botón de filtros (solo en móvil), selector
 * lista/mapa y, en el listado, la ordenación (se envía con el
 * formulario de filtros).
 */
export function SearchResultsHeader({
  totalItems,
  view,
  listHref,
  mapHref,
  sort,
  activeFilterCount,
}: {
  totalItems: number;
  view: SelectionProcessResultsView;
  listHref: string;
  mapHref: string;
  sort: SelectionProcessSort;
  activeFilterCount: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-[17px] font-semibold text-[#131A2C]">Convocatorias</h2>
        <p className="mt-1 text-sm text-[#69738A]">
          {totalItems} convocatorias encontradas
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2">
        <div className="flex items-center justify-between gap-2">
          <SearchFiltersSheetTrigger activeFilterCount={activeFilterCount} />
          <SelectionProcessResultsViewToggle
            activeView={view}
            listHref={listHref}
            mapHref={mapHref}
          />
        </div>
        {view === "list" && (
          <div className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm text-[#131A2C] sm:min-w-[230px] sm:flex-none">
              <span className="text-xs font-medium text-[#69738A]">Ordenar por</span>
              <select
                form={FILTER_FORM_ID}
                name="sort"
                defaultValue={sort}
                className="h-10 rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              form={FILTER_FORM_ID}
              type="submit"
              className="h-10 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
            >
              Ordenar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
