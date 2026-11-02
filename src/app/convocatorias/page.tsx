import { headers } from "next/headers";
import { Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  getSelectionProcessFilterOptionsUseCase,
  listActiveSelectionProcessesUseCase,
  listSelectionProcessMunicipalityMapPointsUseCase,
} from "@/composition/selection-process";
import { ActiveSearchFilters } from "./active-search-filters";
import { FILTER_FORM_ID, SearchFiltersPanel } from "./search-filters-panel";
import { SearchFiltersSheet, SearchFiltersSheetPanel } from "./search-filters-sheet";
import { SearchPagination } from "./search-pagination";
import {
  buildFilterFormKey,
  buildMapMarkers,
  buildPageHref,
  getActiveFilterChips,
  parseSearchParams,
  toSearchFilters,
  type SearchParams,
} from "./search-presentation";
import { SearchResultCard } from "./search-result-card";
import { SearchResultsHeader } from "./search-results-header";
import { SearchResultsMap } from "./search-results-map";

const PAGE_SIZE = 20;

type ConvocatoriasPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ConvocatoriasPage({
  searchParams,
}: ConvocatoriasPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const filterOptions = await getSelectionProcessFilterOptionsUseCase.execute();
  const { query, view, page, filters } = parseSearchParams(
    await searchParams,
    filterOptions.statuses,
  );
  const filterFormKey = buildFilterFormKey(query, page, filters);
  const activeFilterChips = getActiveFilterChips(query, filters, filterOptions, view);

  const searchFilters = toSearchFilters(query, filters);
  const result = await listActiveSelectionProcessesUseCase.execute({
    page,
    pageSize: PAGE_SIZE,
    filters: searchFilters,
  });

  // La consulta municipal es independiente de la paginación.
  // No se realiza al navegar por el listado para evitar trabajo adicional.
  const mapMarkers =
    view === "map"
      ? buildMapMarkers(
        await listSelectionProcessMunicipalityMapPointsUseCase.execute(searchFilters),
        query,
        filters,
      )
      : [];

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar isAuthenticated={Boolean(session?.user)} activeItem="convocatorias" />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Buscar convocatorias"
          user={
            session?.user
              ? { name: session.user.name, email: session.user.email }
              : undefined
          }
        />
        <main className="flex-1 px-4 py-6 sm:py-8 lg:px-6 lg:pb-12">
          <div className="flex flex-col gap-5 sm:gap-6">
            <header>
              <h1 className="text-2xl font-semibold sm:text-[28px] tracking-tight text-[#131A2C]">
                Buscar convocatorias
              </h1>
              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Procesos selectivos, oposiciones y bolsas de trabajo de acceso
                libre en Catalunya.
              </p>
            </header>

            {/* Buscador: se envía con el formulario de filtros. */}
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#646E85]"
                />
                <input
                  key={`search-${filterFormKey}`}
                  form={FILTER_FORM_ID}
                  type="search"
                  name="q"
                  maxLength={100}
                  defaultValue={query}
                  placeholder="Busca por puesto, organismo, municipio..."
                  aria-label="Buscar convocatorias"
                  className="h-[52px] w-full min-w-0 rounded-lg border border-[#D5DAE3] bg-white pl-12 pr-4 text-[15px] outline-none focus:border-[#4F5BD5]"
                />
              </div>
              <button
                form={FILTER_FORM_ID}
                type="submit"
                className="h-[52px] w-full shrink-0 rounded-[10px] bg-[#4F5BD5] px-7 text-[15px] font-semibold text-white hover:bg-[#3B45B5] sm:w-auto"
              >
                Buscar
              </button>
            </div>

            {/* En móvil el panel es una hoja inferior que abre el botón «Filtros». */}
            <SearchFiltersSheet>
              <div className="grid items-start gap-7 lg:grid-cols-[300px_minmax(0,1fr)]">
                <SearchFiltersSheetPanel>
                  <SearchFiltersPanel
                    formKey={filterFormKey}
                    view={view}
                    filters={filters}
                    filterOptions={filterOptions}
                  />
                </SearchFiltersSheetPanel>

                <section className="flex min-w-0 flex-col gap-4">
                  <SearchResultsHeader
                    totalItems={result.totalItems}
                    view={view}
                    listHref={buildPageHref(page, query, filters, "list")}
                    mapHref={buildPageHref(page, query, filters, "map")}
                    sort={filters.sort}
                    activeFilterCount={activeFilterChips.length}
                  />

                  <ActiveSearchFilters chips={activeFilterChips} view={view} />

                  {view === "map" ? (
                    <SearchResultsMap markers={mapMarkers} totalItems={result.totalItems} />
                  ) : result.items.length === 0 ? (
                    <div className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
                      <Search size={30} className="mx-auto text-[#646E85]" />
                      <h2 className="mt-4 text-lg font-semibold text-[#131A2C]">
                        No se han encontrado convocatorias
                      </h2>
                      <p className="mx-auto mt-2 max-w-[480px] text-sm leading-relaxed text-[#4E5870]">
                        Prueba con otros criterios de búsqueda.
                      </p>
                    </div>
                  ) : (
                    result.items.map((item) => (
                      <SearchResultCard
                        key={item.id}
                        item={item}
                        returnTo={buildPageHref(page, query, filters, view)}
                      />
                    ))
                  )}

                  {/* Paginación: solo en el listado, también con una página fuera de rango. */}
                  {view === "list" && (
                    <SearchPagination
                      page={result.page}
                      totalPages={result.totalPages}
                      pageHref={(targetPage) => buildPageHref(targetPage, query, filters)}
                    />
                  )}
                </section>
              </div>
            </SearchFiltersSheet>
          </div>
        </main>
      </div>
    </div>
  );
}
