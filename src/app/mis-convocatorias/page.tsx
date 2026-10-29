import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { listUserSelectionProcessesUseCase } from "@/composition/user-selection-process";
import { FollowedMunicipalitiesMap } from "@/modules/user-selection-process/presentation/followed-municipalities-map";
import { PersonalSelectionProcessStatusIndicators } from "@/modules/user-selection-process/presentation/personal-selection-process-status-indicators";
import { getCataloniaCalendarDate } from "@/shared/utils/catalonia-calendar-date";
import { ActiveFiltersBar } from "./active-filters-bar";
import { MySelectionProcessCard } from "./my-selection-process-card";
import { MySelectionProcessesEmptyState } from "./my-selection-processes-empty-state";
import {
  applyFilters,
  getEmptyListMessage,
  hasActiveFilters,
  myProcessesHref,
  parseFilters,
  type MySelectionProcessesSearchParams,
} from "./my-selection-processes-presentation";
import { MySelectionProcessesSummary } from "./my-selection-processes-summary";

type MySelectionProcessesPageProps = {
  searchParams: Promise<MySelectionProcessesSearchParams>;
};

export default async function MySelectionProcessesPage({
  searchParams,
}: MySelectionProcessesPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/login?returnTo=/mis-convocatorias");
  }

  const userSelectionProcesses =
    await listUserSelectionProcessesUseCase.execute(session.user.id);

  // Todas las vistas se calculan exclusivamente con las convocatorias
  // del usuario autenticado. Cada filtro condiciona las otras vistas.
  const filters = parseFilters(await searchParams);
  const isFiltered = hasActiveFilters(filters);
  const today = getCataloniaCalendarDate();
  const { itemsForStatusIndicators, itemsForMap, listedItems, counts } =
    applyFilters(userSelectionProcesses, filters, today);
  // Volver desde el detalle conserva todos los filtros activos.
  const returnTo = myProcessesHref(filters);
  const activeSummaryView = !isFiltered
    ? "all"
    : filters.deadlineFilter === "open" || filters.deadlineFilter === "expired"
      ? filters.deadlineFilter
      : null;

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar isAuthenticated activeItem="mis-convocatorias" />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Mis convocatorias"
          user={{
            name: session.user.name,
            email: session.user.email,
          }}
        />
        <main className="flex-1 px-4 py-8 lg:px-6 lg:pb-12">
          <div className="flex flex-col gap-7">
            <header>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                Mis convocatorias
              </h1>
              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Consulta rápidamente el estado y los plazos de las convocatorias
                que estás siguiendo.
              </p>
            </header>

            {userSelectionProcesses.length === 0 ? (
              <MySelectionProcessesEmptyState />
            ) : (
              <>
                <PersonalSelectionProcessStatusIndicators
                  layout="horizontal"
                  items={itemsForStatusIndicators}
                  selectedMunicipality={filters.municipality}
                  selectedProvince={filters.province}
                  selectedStatuses={filters.statuses}
                />
                <section className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
                  <div className="flex min-w-0 flex-col gap-4">
                    {isFiltered && (
                      <ActiveFiltersBar
                        filters={filters}
                        shownCount={listedItems.length}
                        totalCount={userSelectionProcesses.length}
                      />
                    )}
                    <div className="grid min-w-0 grid-cols-1 items-stretch gap-3">
                      {listedItems.length === 0 ? (
                        <div className="rounded-xl border border-[#E3E7EE] bg-white p-6 text-sm text-[#4E5870]">
                          {getEmptyListMessage(filters.deadlineFilter)}
                        </div>
                      ) : (
                        listedItems.map((item) => (
                          <MySelectionProcessCard
                            key={item.id}
                            item={item}
                            returnTo={returnTo}
                            today={today}
                          />
                        ))
                      )}
                    </div>
                    <div>
                      <p className="mt-1 text-sm text-[#69738A]">
                        {listedItems.length}{" "}
                        {listedItems.length === 1 ? "convocatoria" : "convocatorias"}
                      </p>
                    </div>
                  </div>
                  <aside className="flex min-w-0 flex-col gap-4">
                    <FollowedMunicipalitiesMap
                      items={itemsForMap}
                      selectedMunicipality={filters.municipality}
                      selectedProvince={filters.province}
                      selectedStatuses={filters.statuses}
                      deadlineFilter={filters.deadlineFilter ?? undefined}
                    />
                    <MySelectionProcessesSummary
                      counts={counts}
                      activeView={activeSummaryView}
                    />
                  </aside>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
