import Link from "next/link";
import type { UserSelectionProcessListItem } from "../application/user-selection-process-list-item";
import type { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";
import { PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS } from "./personal-selection-process-status-options";

type Props = {
  /** Lista completa de convocatorias seguidas, sin aplicar filtros. */
  items: readonly UserSelectionProcessListItem[];
  selectedStatuses?: readonly PersonalSelectionProcessStatus[];
  selectedMunicipality?: string | null;
  selectedProvince?: string | null;
  /** Distribucion: panel lateral actual u ocho indicadores en una franja superior. */
  layout?: "sidebar" | "horizontal";
};

/**
 * Panel de indicadores de los ocho estados personales.
 *
 * - Los contadores siempre se calculan sobre el total de convocatorias seguidas.
 * - La seleccion multiple utiliza parametros de URL repetidos: personalStatus.
 * - Conserva el municipio y la provincia al activar o desactivar un estado.
 * - layout="horizontal" organiza los ocho estados a lo ancho de la cabecera.
 * - Es un componente de servidor: no cambia ningun estado en la base de datos.
 */
export function PersonalSelectionProcessStatusIndicators({
  items,
  selectedStatuses = [],
  selectedMunicipality = null,
  selectedProvince = null,
  layout = "sidebar",
}: Props) {
  const isHorizontal = layout === "horizontal";
  const counts = new Map<PersonalSelectionProcessStatus, number>();

  for (const item of items) {
    counts.set(item.personalStatus, (counts.get(item.personalStatus) ?? 0) + 1);
  }

  const selectedSet = new Set<PersonalSelectionProcessStatus>(selectedStatuses);
  const activeStatuses = PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS
    .map((option) => option.value)
    .filter((status) => selectedSet.has(status));

  const clearHref = buildFilterHref(
    [],
    selectedMunicipality,
    selectedProvince,
  );

  return (
    <section
      aria-labelledby="personal-status-indicators-title"
      className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm"
    >
      <div className="border-b border-[#EEF1F5] px-5 py-4">
        <h2
          id="personal-status-indicators-title"
          className="text-[17px] font-semibold text-[#131A2C]"
        >
          Mis estados personales
        </h2>
        <p className="mt-1 text-sm text-[#69738A]">
          Selecciona uno o varios estados para filtrar.
        </p>
      </div>

      <div className="p-4">
        <div
          className={
            isHorizontal
              ? "grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8"
              : "grid grid-cols-2 gap-2"
          }
        >
          {PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const count = counts.get(option.value) ?? 0;
            const isSelected = selectedSet.has(option.value);
            const nextStatuses = isSelected
              ? activeStatuses.filter((status) => status !== option.value)
              : [...activeStatuses, option.value];
            const href = buildFilterHref(
              nextStatuses,
              selectedMunicipality,
              selectedProvince,
            );

            return (
              <Link
                key={option.value}
                href={href}
                scroll={false}
                aria-label={`${isSelected ? "Quitar filtro" : "Añadir filtro"}: ${option.label}. ${count} ${count === 1 ? "convocatoria" : "convocatorias"}.`}
                className={`flex min-w-0 flex-col gap-2 rounded-xl border p-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5] ${
                  isHorizontal ? "min-h-[112px]" : ""
                } ${
                  isSelected
                    ? "border-[#4F5BD5] bg-[#EEF0FC]"
                    : "border-[#E3E7EE] bg-white hover:border-[#BFC5F4] hover:bg-[#F7F8FF]"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-[#4F5BD5] text-white"
                        : "bg-[#F1F3F7] text-[#4E5870]"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      isSelected ? "text-[#3B45B5]" : "text-[#131A2C]"
                    }`}
                  >
                    {count}
                  </span>
                </span>
                <span className="text-[13px] font-semibold leading-snug text-[#131A2C]">
                  {option.label}
                </span>
                {isSelected && (
                  <span className="text-[11px] font-semibold text-[#4F5BD5]">
                    Seleccionado
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[#69738A]">
            {activeStatuses.length === 0
              ? "Mostrando todos los estados"
              : `${activeStatuses.length} ${
                  activeStatuses.length === 1
                    ? "estado seleccionado"
                    : "estados seleccionados"
                }`}
          </p>

          {activeStatuses.length > 0 && (
            <Link
              href={clearHref}
              scroll={false}
              className="rounded-lg border border-[#D5DAE3] bg-white px-3 py-1.5 text-xs font-semibold text-[#3B45B5] hover:bg-[#F4F6F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]"
            >
              Limpiar estados
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function buildFilterHref(
  statuses: readonly PersonalSelectionProcessStatus[],
  municipality: string | null,
  province: string | null,
): string {
  const params = new URLSearchParams();

  if (municipality?.trim()) {
    params.set("municipality", municipality.trim());
    if (province?.trim()) {
      params.set("province", province.trim());
    }
  }

  for (const status of statuses) {
    params.append("personalStatus", status);
  }

  const query = params.toString();
  return query ? `/mis-convocatorias?${query}` : "/mis-convocatorias";
}
