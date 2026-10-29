import Link from "next/link";
import type { SelectionProcessMunicipalityMapPoint } from
  "@/modules/selection-process/application/selection-process-municipality-map-point";
import type { SelectionProcessPage } from
  "@/modules/selection-process/application/selection-process-page";
import { FollowedMunicipalitiesMap } from "@/modules/user-selection-process/presentation/followed-municipalities-map";
import { ForMeCard } from "./for-me-card";
import { ForMePagination } from "./for-me-pagination";
import { pageHref } from "./for-me-presentation";

/** Listado de convocatorias para el usuario, con su paginación y el mapa. */
export function ForMeResults({
  pageData,
  mapPoints,
  selectedMunicipality,
  selectedProvince,
  matchReasons,
  showTerritorialNote,
}: {
  pageData: SelectionProcessPage;
  mapPoints: SelectionProcessMunicipalityMapPoint[];
  selectedMunicipality: string | null;
  selectedProvince: string | null;
  matchReasons: string[];
  showTerritorialNote: boolean;
}) {
  const currentPage = pageData.page;
  const returnTo = pageHref(currentPage, selectedMunicipality, selectedProvince);

  return (
    <section className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-[#131A2C]">
              Convocatorias para ti
            </h2>
            <p className="mt-1 text-sm text-[#69738A]">
              {pageData.totalItems} {pageData.totalItems === 1
                ? "convocatoria encontrada"
                : "convocatorias encontradas"}
              {pageData.totalPages > 0 &&
                ` · Página ${currentPage} de ${pageData.totalPages}`}
            </p>
          </div>
          <p className="text-xs text-[#69738A]">
            Primero, plazos abiertos próximos a finalizar
          </p>
        </div>

        {selectedMunicipality && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#DDE1FA] bg-[#F7F7FF] px-4 py-3 text-sm text-[#4E5870]">
            <span>
              Municipio seleccionado: <strong className="font-semibold text-[#131A2C]">{selectedMunicipality}</strong>
              {selectedProvince && ` · ${selectedProvince}`}
            </span>
            <Link
              href="/para-mi"
              className="font-semibold text-[#3B45B5] hover:underline"
            >
              Quitar filtro
            </Link>
          </div>
        )}

        {pageData.items.length === 0 ? (
          <div className="rounded-xl border border-[#E3E7EE] bg-white p-6 shadow-sm">
            <h3 className="text-[17px] font-semibold text-[#131A2C]">
              No hay nuevas convocatorias en {selectedMunicipality}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#69738A]">
              No quedan convocatorias pendientes de seguir en este
              municipio que encajen con tus preferencias. Puedes
              seleccionar otro marcador o quitar el filtro territorial.
            </p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            {pageData.items.map((item) => (
              <ForMeCard
                key={item.id}
                item={item}
                returnTo={returnTo}
                matchReasons={matchReasons}
                showTerritorialNote={showTerritorialNote}
              />
            ))}
          </div>
        )}

        {pageData.totalPages > 1 && (
          <ForMePagination
            currentPage={currentPage}
            totalPages={pageData.totalPages}
            municipality={selectedMunicipality}
            province={selectedProvince}
          />
        )}
      </div>
      <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
        <FollowedMunicipalitiesMap
          mode="for-me"
          mapPoints={mapPoints}
          selectedMunicipality={selectedMunicipality}
          selectedProvince={selectedProvince}
        />
      </aside>
    </section>
  );
}
