import Link from "next/link";
import { X } from "lucide-react";
import type { SelectionProcessResultsView } from
  "@/modules/selection-process/presentation/selection-process-results-view-toggle";
import type { ActiveFilterChip } from "./search-presentation";

/**
 * Filtros aplicados como chips. Cada chip es un enlace que quita
 * ese filtro, así que funciona también sin JavaScript.
 */
export function ActiveSearchFilters({
  chips,
  view,
}: {
  chips: ActiveFilterChip[];
  view: SelectionProcessResultsView;
}) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.removeHref}
          prefetch={false}
          aria-label={`Quitar filtro: ${chip.label}`}
          className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-[#DDE1FA] bg-[#EEF0FC] py-1 pl-3 pr-2 text-xs font-semibold text-[#3B45B5] hover:border-[#C5CBF5] hover:bg-[#E3E6FA]"
        >
          <span className="truncate">{chip.label}</span>
          <X size={14} aria-hidden="true" className="shrink-0" />
        </Link>
      ))}
      <Link
        href={view === "map" ? "/convocatorias?view=map" : "/convocatorias"}
        prefetch={false}
        className="px-1 text-xs font-semibold text-[#4E5870] underline-offset-2 hover:text-[#131A2C] hover:underline"
      >
        Limpiar todo
      </Link>
    </div>
  );
}
