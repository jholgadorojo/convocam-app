import Link from "next/link";
import {
  getActiveFilterLabels,
  getRemoveDeadlineFilterLabel,
  myProcessesHref,
  type MySelectionProcessesFilters,
} from "./my-selection-processes-presentation";

const buttonClassName =
  "rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-xs font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]";

/** Resumen de los filtros activos con enlaces para quitarlos. */
export function ActiveFiltersBar({
  filters,
  shownCount,
  totalCount,
}: {
  filters: MySelectionProcessesFilters;
  shownCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#DDE1FA] bg-[#EEF0FC] px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#4E5870]">
          Mostrando {shownCount} de {totalCount}{" "}
          {totalCount === 1 ? "convocatoria" : "convocatorias"}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#131A2C]">
          {getActiveFilterLabels(filters).join(" · ")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.deadlineFilter && (
          <Link
            href={myProcessesHref({ ...filters, deadlineFilter: null })}
            className={buttonClassName}
          >
            {getRemoveDeadlineFilterLabel(filters.deadlineFilter)}
          </Link>
        )}
        {filters.municipality && (
          // Quitar el municipio no elimina los estados personales seleccionados.
          <Link
            href={myProcessesHref({ ...filters, municipality: null, province: null })}
            className={buttonClassName}
          >
            Quitar municipio
          </Link>
        )}
        <Link href="/mis-convocatorias" className={buttonClassName}>
          Limpiar filtros
        </Link>
      </div>
    </div>
  );
}
