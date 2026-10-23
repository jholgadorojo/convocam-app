import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  ExternalLink,
  FileText,
  MapPin,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { listUserSelectionProcessesUseCase } from "@/composition/user-selection-process";
import {
  getApplicationPeriodPresentation,
  getOfficialStatusPresentation,
} from "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";
import type { PersonalSelectionProcessStatus } from "@/modules/user-selection-process/domain/personal-selection-process-status";
import { PersonalSelectionProcessStatusIndicators } from "@/modules/user-selection-process/presentation/personal-selection-process-status-indicators";
import { PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS } from "@/modules/user-selection-process/presentation/personal-selection-process-status-options";
import { PersonalSelectionProcessStatusPicker } from "@/modules/user-selection-process/presentation/personal-selection-process-status-picker";
import { UnfollowSelectionProcessForm } from "@/modules/user-selection-process/presentation/unfollow-selection-process-form";
import { FollowedMunicipalitiesMap } from "@/modules/user-selection-process/presentation/followed-municipalities-map";
import {
  changePersonalStatusFromMySelectionProcessesAction,
  unfollowFromMySelectionProcessesAction,
} from "./actions";
type MySelectionProcessesPageProps = {
  searchParams: Promise<{
    municipality?: string | string[];
    province?: string | string[];
    personalStatus?: string | string[];
    upcomingDeadlines?: string | string[];
  }>;
};
export default async function MySelectionProcessesPage({
  searchParams,
}: MySelectionProcessesPageProps) {
  const session =
    await auth.api.getSession({
      headers: await headers(),
    });
  if (!session?.user) {
    redirect(
      "/login?returnTo=/mis-convocatorias",
    );
  }
  const userSelectionProcesses =
    await listUserSelectionProcessesUseCase.execute(
      session.user.id,
    );
  // Todas las vistas se calculan exclusivamente con las convocatorias
  // del usuario autenticado. Cada filtro condiciona las otras vistas.
  const params = await searchParams;
  // Vista especial enlazada desde "Plazos próximos" del Dashboard.
  // Los demás accesos conservan el comportamiento actual.
  const showUpcomingDeadlines = params.upcomingDeadlines === "1";
  const upcomingFromDate = getCataloniaTodayUtc();
  const upcomingToDate = new Date(upcomingFromDate);
  upcomingToDate.setUTCDate(upcomingToDate.getUTCDate() + 15);

  const matchesUpcomingDeadline = (
    item: (typeof userSelectionProcesses)[number],
  ): boolean => {
    if (!showUpcomingDeadlines) return true;
    if (
      item.personalStatus !== "INTERESTED" &&
      item.personalStatus !== "PREPARING_APPLICATION"
    ) return false;

    const endDate = item.selectionProcess.applicationEndDate;
    return (
      endDate !== null &&
      endDate.getTime() >= upcomingFromDate.getTime() &&
      endDate.getTime() <= upcomingToDate.getTime()
    );
  };

  const selectedMunicipality =
    typeof params.municipality === "string"
      ? params.municipality.trim() || null
      : null;
  const selectedProvince =
    selectedMunicipality && typeof params.province === "string"
      ? params.province.trim() || null
      : null;

  // personalStatus aparece repetido en la URL cuando se seleccionan
  // varios estados. Solo aceptamos los ocho estados definidos en el dominio.
  const rawStatuses =
    typeof params.personalStatus === "string"
      ? [params.personalStatus]
      : Array.isArray(params.personalStatus)
        ? params.personalStatus
        : [];
  const selectedStatuses: PersonalSelectionProcessStatus[] =
    PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS
      .map((option) => option.value)
      .filter((status) => rawStatuses.includes(status));
  const selectedStatusSet = new Set<PersonalSelectionProcessStatus>(
    selectedStatuses,
  );
  const hasSelectedStatuses = selectedStatuses.length > 0;
  const hasActiveFilters =
    selectedMunicipality !== null || hasSelectedStatuses || showUpcomingDeadlines;

  // El municipio limita los contadores de los estados personales.
  // El filtro de estados no se aplica aqui para permitir seleccionar
  // varios estados sin ocultar las demas opciones.
  const matchesSelectedMunicipality = (
    item: (typeof userSelectionProcesses)[number],
  ): boolean => {
    if (!selectedMunicipality) return true;
    const institution = item.selectionProcess.institution;
    if (!institution?.municipality) return false;
    return (
      normalizeLocation(institution.municipality) ===
        normalizeLocation(selectedMunicipality) &&
      (selectedProvince === null ||
        normalizeLocation(institution.province ?? "") ===
          normalizeLocation(selectedProvince))
    );
  };
  const itemsForStatusIndicators = userSelectionProcesses.filter(
    matchesSelectedMunicipality,
  );

  // Filtrado por plazo antes de construir el mapa, las tarjetas y el contador.
  // El mapa debe utilizar todos los municipios con vencimientos próximos.
  const itemsWithinDeadline = userSelectionProcesses.filter(
    matchesUpcomingDeadline,
  );

  // Los estados seleccionados limitan los municipios y sus contadores.
  // El municipio seleccionado no se aplica al mapa: asi se puede
  // cambiar a otro municipio sin quitar previamente ese filtro.
  const itemsForMap = hasSelectedStatuses
    ? itemsWithinDeadline.filter((item) =>
        selectedStatusSet.has(item.personalStatus),
      )
    : itemsWithinDeadline;

  // En el listado se cruzan todos los criterios.
  const filteredSelectionProcesses = itemsForMap.filter(
    matchesSelectedMunicipality,
  );

  // Cuando venimos del indicador de plazos, primero vencen los más urgentes.
  if (showUpcomingDeadlines) {
    filteredSelectionProcesses.sort(
      (a, b) =>
        (a.selectionProcess.applicationEndDate?.getTime() ?? Infinity) -
        (b.selectionProcess.applicationEndDate?.getTime() ?? Infinity),
    );
  }

// Volver desde el detalle conserva todos los filtros activos.
  const returnToParams = new URLSearchParams();
  if (showUpcomingDeadlines) {
    returnToParams.set("upcomingDeadlines", "1");
  }
  if (selectedMunicipality) {
    returnToParams.set("municipality", selectedMunicipality);
    if (selectedProvince) {
      returnToParams.set("province", selectedProvince);
    }
  }
  for (const status of selectedStatuses) {
    returnToParams.append("personalStatus", status);
  }
  const returnToQuery = returnToParams.toString();
  const returnTo = returnToQuery
    ? `/mis-convocatorias?${returnToQuery}`
    : "/mis-convocatorias";
// Quitar el municipio no elimina los estados personales seleccionados.
  const statusOnlyParams = new URLSearchParams();
  if (showUpcomingDeadlines) {
    statusOnlyParams.set("upcomingDeadlines", "1");
  }
  for (const status of selectedStatuses) {
    statusOnlyParams.append("personalStatus", status);
  }
  const statusOnlyQuery = statusOnlyParams.toString();
  const statusOnlyHref = statusOnlyQuery
    ? `/mis-convocatorias?${statusOnlyQuery}`
    : "/mis-convocatorias";

  const noDeadlineParams = new URLSearchParams(returnToParams);
  noDeadlineParams.delete("upcomingDeadlines");
  const noDeadlineQuery = noDeadlineParams.toString();
  const noDeadlineHref = noDeadlineQuery
    ? `/mis-convocatorias?${noDeadlineQuery}`
    : "/mis-convocatorias";

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated
        activeItem="mis-convocatorias"
      />
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
            {/* CABECERA */}
            <header>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                Mis convocatorias
              </h1>
              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Consulta rápidamente el estado y los
                plazos de las convocatorias que estás
                siguiendo.
              </p>
            </header>
            {/* ESTADOS PERSONALES EN LA CABECERA, A TODO EL ANCHO */}
            {userSelectionProcesses.length > 0 && (
              <PersonalSelectionProcessStatusIndicators
                layout="horizontal"
                items={itemsForStatusIndicators}
                selectedMunicipality={selectedMunicipality}
                selectedProvince={selectedProvince}
                selectedStatuses={selectedStatuses}
              />
            )}
            {/* SIN CONVOCATORIAS */}
            {userSelectionProcesses.length === 0 ? (
              <section className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
                <h2 className="text-lg font-semibold text-[#131A2C]">
                  Todavía no sigues ninguna convocatoria
                </h2>
                <p className="mx-auto mt-2 max-w-[520px] text-sm leading-relaxed text-[#69738A]">
                  Busca convocatorias y añade a
                  seguimiento las que te interesen.
                </p>
                <Link
                  href="/convocatorias"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#4F5BD5] px-5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                >
                  Buscar convocatorias
                </Link>
              </section>
            ) : (
              <section className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
                <div className="flex min-w-0 flex-col gap-4">
                  {/* CONTADOR */}
                  {/* RESUMEN DE FILTROS ACTIVOS */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#DDE1FA] bg-[#EEF0FC] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#4E5870]">
                          Mostrando {filteredSelectionProcesses.length} de{" "}
                          {userSelectionProcesses.length}{" "}
                          {userSelectionProcesses.length === 1
                            ? "convocatoria"
                            : "convocatorias"}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[#131A2C]">
                          {selectedMunicipality && (
                            <span>
                              Municipio: {selectedMunicipality}
                              {selectedProvince ? ` · ${selectedProvince}` : ""}
                            </span>
                          )}
                          {showUpcomingDeadlines && (
                            <span>
                              {selectedMunicipality ? " · " : ""}
                              Plazos próximos (hoy y 15 días siguientes)
                              {" · "}Me interesa o Preparando solicitud
                            </span>
                          )}
                          {hasSelectedStatuses && (
                            <span>
                              {selectedMunicipality || showUpcomingDeadlines ? " · " : ""}
                              {selectedStatuses.length}{" "}
                              {selectedStatuses.length === 1
                                ? "estado seleccionado"
                                : "estados seleccionados"}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {showUpcomingDeadlines && (
                          <Link
                            href={noDeadlineHref}
                            className="rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-xs font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                          >
                            Quitar filtro de plazos
                          </Link>
                        )}
                        {selectedMunicipality && (
                          <Link
                            href={statusOnlyHref}
                            className="rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-xs font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                          >
                            Quitar municipio
                          </Link>
                        )}
                        <Link
                          href="/mis-convocatorias"
                          className="rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-xs font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                        >
                          Limpiar filtros
                        </Link>
                      </div>
                    </div>
                  )}
                  {/* GRID */}
                  <div className="grid min-w-0 grid-cols-1 items-stretch gap-3">
                    {filteredSelectionProcesses.length === 0 ? (
                      <div className="rounded-xl border border-[#E3E7EE] bg-white p-6 text-sm text-[#4E5870]">
                        {showUpcomingDeadlines
                          ? "No tienes solicitudes que venzan en los próximos 15 días con estado «Me interesa» o «Preparando solicitud»."
                          : "No hay convocatorias que coincidan con los filtros seleccionados."}
                      </div>
                    ) : (
                      filteredSelectionProcesses.map(
                        (item) => {
                          const convocatoria =
                            item.selectionProcess;
                          const officialStatus =
                            getOfficialStatusPresentation(
                              convocatoria.status,
                              convocatoria.statusId,
                            );
                          const applicationPeriod =
                            getApplicationPeriodPresentation(
                              convocatoria.applicationStartDate,
                              convocatoria.applicationEndDate,
                            );
                          const hasReservations =
                            hasReservedPlaces(
                              convocatoria.reservedPlaces,
                            );
                          const applicationSummary =
                            buildApplicationSummary(
                              applicationPeriod,
                              convocatoria.applicationStartDate,
                              convocatoria.applicationEndDate,
                            );
                          return (
                            <article
                              key={item.id}
                              className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="flex flex-1 flex-col p-4">
                                {/* ESTADO / TIPO / PLAZO */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${officialStatus.badgeClassName}`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${officialStatus.dotClassName}`}
                                    />
                                    {officialStatus.label}
                                  </span>
                                  <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-3 text-xs font-semibold text-[#3B45B5]">
                                    {convocatoria.isJobPool
                                      ? "Bolsa de trabajo"
                                      : "Plaza de plantilla"}
                                  </span>
                                  <span
                                    className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${applicationPeriod.badgeClassName}`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${applicationPeriod.dotClassName}`}
                                    />
                                    {buildApplicationPeriodBadgeText(
                                      applicationPeriod,
                                    )}
                                  </span>
                                </div>
                                {/* TÍTULO / UBICACIÓN */}
                                <div className="mt-4">
                                  <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#131A2C]">
                                    {formatSelectionProcessTitle(
                                      convocatoria.title,
                                    )}
                                  </h3>
                                  <div className="mt-2 flex items-start gap-2 text-[13.5px] text-[#4E5870]">
                                    <MapPin
                                      size={15}
                                      className="mt-0.5 shrink-0 text-[#7C859B]"
                                    />
                                    <span>
                                      {buildLocationText(
                                        convocatoria.institution,
                                      )}
                                    </span>
                                  </div>
                                </div>
                                {/* SOLICITUD */}
                                <div className="mt-4 rounded-lg border border-[#E7EAF0] bg-[#F7F8FA] px-3.5 py-3">
                                  <div className="flex items-start gap-2.5">
                                    <CalendarClock
                                      size={17}
                                      className="mt-0.5 shrink-0 text-[#4F5BD5]"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
                                        Solicitud
                                      </p>
                                      <p className="mt-1 text-sm font-semibold leading-snug text-[#131A2C]">
                                        {applicationSummary}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {/* RESERVAS */}
                                {hasReservations && (
                                  <div className="mt-3">
                                    <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
                                      Reservas
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(
                                        convocatoria
                                          .reservedPlaces
                                          .disability ?? 0
                                      ) > 0 && (
                                          <ReservationBadge>
                                            Discapacidad:{" "}
                                            {
                                              convocatoria
                                                .reservedPlaces
                                                .disability
                                            }
                                          </ReservationBadge>
                                        )}
                                      {convocatoria
                                        .reservedPlaces
                                        .unemployed && (
                                          <ReservationBadge>
                                            Personas desempleadas
                                          </ReservationBadge>
                                        )}
                                      {convocatoria
                                        .reservedPlaces
                                        .youngPeople && (
                                          <ReservationBadge>
                                            Jóvenes
                                          </ReservationBadge>
                                        )}
                                      {convocatoria
                                        .reservedPlaces
                                        .women && (
                                          <ReservationBadge>
                                            Mujeres
                                          </ReservationBadge>
                                        )}
                                    </div>
                                  </div>
                                )}
                                {/* ÚLTIMO DOCUMENTO */}
                                <div className="mt-4 border-t border-[#EEF1F5] pt-3">
                                  {convocatoria.latestDocument ? (
                                    <a
                                      href={
                                        convocatoria
                                          .latestDocument
                                          .documentUrl
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-start justify-between gap-3 rounded-lg px-1 py-1.5 text-[#3B45B5] hover:text-[#2E3794]"
                                    >
                                      <span className="flex min-w-0 items-start gap-2">
                                        <FileText
                                          size={16}
                                          className="mt-0.5 shrink-0"
                                        />
                                        <span className="min-w-0">
                                          <span className="block text-sm font-semibold">
                                            Último documento
                                            oficial
                                          </span>
                                          <span className="mt-0.5 block text-xs font-medium text-[#7C859B]">
                                            Publicado el{" "}
                                            {formatDate(
                                              convocatoria
                                                .latestDocument
                                                .publicationDate,
                                            )}
                                          </span>
                                        </span>
                                      </span>
                                      <ExternalLink
                                        size={15}
                                        className="mt-0.5 shrink-0"
                                      />
                                    </a>
                                  ) : (
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-sm text-[#7C859B]">
                                      <FileText
                                        size={16}
                                        className="shrink-0"
                                      />
                                      <span>
                                        Sin documentos oficiales
                                        disponibles
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {/* MI ESTADO */}
                                <div className="mt-3">
                                  <PersonalSelectionProcessStatusPicker
                                    selectionProcessId={
                                      convocatoria.id
                                    }
                                    currentStatus={
                                      item.personalStatus
                                    }
                                    action={
                                      changePersonalStatusFromMySelectionProcessesAction
                                    }
                                  />
                                </div>
                                {/* INFORMACIÓN PERSONAL */}
                                <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-[#FAFBFC] px-3.5 py-2.5">
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#8A93A7]">
                                      Siguiendo desde
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-[#4E5870]">
                                      {formatDate(
                                        item.followedAt,
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#8A93A7]">
                                      Último cambio de
                                      estado
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-[#4E5870]">
                                      {formatDate(
                                        item.personalStatusUpdatedAt,
                                      )}
                                    </p>
                                  </div>
                                </div>
                                {/* ACCIONES */}
                                <div className="mt-3 flex-1" aria-hidden="true" />
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1F5] pt-3">
                                  <UnfollowSelectionProcessForm
                                    selectionProcessId={
                                      convocatoria.id
                                    }
                                    action={
                                      unfollowFromMySelectionProcessesAction
                                    }
                                  />
                                  <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                                    <Link
                                      href={`/convocatorias/${convocatoria.id}?returnTo=${encodeURIComponent(
                                        returnTo,
                                      )}`}
                                      className="inline-flex items-center justify-center rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                                    >
                                      Ver detalle
                                    </Link>
                                    <a
                                      href={
                                        convocatoria.cidoUrl
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                                    >
                                      Ver convocatoria
                                      oficial
                                      <ExternalLink
                                        size={14}
                                      />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        },
                      )
                    )}
                  </div>
                  <div>
                    <p className="mt-1 text-sm text-[#69738A]">
                      {showUpcomingDeadlines
                        ? filteredSelectionProcesses.length
                        : userSelectionProcesses.length}{" "}
                      {(showUpcomingDeadlines
                        ? filteredSelectionProcesses.length
                        : userSelectionProcesses.length) === 1
                        ? "convocatoria"
                        : "convocatorias"}
                    </p>
                  </div>
                </div>
                <aside className="flex min-w-0 flex-col gap-4">
                  <FollowedMunicipalitiesMap
                    items={itemsForMap}
                    selectedMunicipality={selectedMunicipality}
                    selectedProvince={selectedProvince}
                    selectedStatuses={selectedStatuses}
                  />
                </aside>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
/* COMPONENTES */
function ReservationBadge({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex min-h-6 items-center rounded-full border border-[#DDE1E8] bg-[#F4F6F9] px-2.5 text-[11px] font-medium text-[#4E5870]">
      {children}
    </span>
  );
}
/* PLAZO DE SOLICITUD */
function buildApplicationPeriodBadgeText(
  period: ReturnType<
    typeof getApplicationPeriodPresentation
  >,
): string {
  if (
    period.state === "open" ||
    period.state === "future"
  ) {
    if (
      period.label === "Finaliza hoy"
    ) {
      return period.label;
    }
    return `${period.label} · ${period.detail}`;
  }
  return period.label;
}
function buildApplicationSummary(
  period: ReturnType<
    typeof getApplicationPeriodPresentation
  >,
  applicationStartDate: Date | null,
  applicationEndDate: Date | null,
): string {
  const today =
    getCataloniaTodayUtc();
  if (
    period.state === "open" &&
    applicationEndDate
  ) {
    const days =
      differenceInDays(
        today,
        applicationEndDate,
      );
    if (days === 0) {
      return "El plazo para presentar la solicitud finaliza hoy.";
    }
    if (days === 1) {
      return "Queda 1 día para presentar la solicitud.";
    }
    return `Quedan ${days} días para presentar la solicitud.`;
  }
  if (
    period.state === "future" &&
    applicationStartDate
  ) {
    const days =
      differenceInDays(
        today,
        applicationStartDate,
      );
    if (days === 1) {
      return "El plazo de solicitud comienza mañana.";
    }
    return `El plazo de solicitud comienza en ${days} días.`;
  }
  if (
    period.state === "closed"
  ) {
    return "El plazo para presentar la solicitud ha finalizado.";
  }
  return "No hay fechas de solicitud disponibles.";
}
function differenceInDays(
  from: Date,
  to: Date,
): number {
  const millisecondsPerDay =
    24 * 60 * 60 * 1000;
  return Math.max(
    0,
    Math.round(
      (
        to.getTime() -
        from.getTime()
      ) /
      millisecondsPerDay,
    ),
  );
}
function getCataloniaTodayUtc(): Date {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Europe/Madrid",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      new Date(),
    );
  const year =
    Number(
      parts.find(
        (part) =>
          part.type === "year",
      )?.value,
    );
  const month =
    Number(
      parts.find(
        (part) =>
          part.type === "month",
      )?.value,
    );
  const day =
    Number(
      parts.find(
        (part) =>
          part.type === "day",
      )?.value,
    );
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );
}
/* OTROS HELPERS */
function hasReservedPlaces(
  reservedPlaces: {
    disability: number | null;
    unemployed: boolean;
    youngPeople: boolean;
    women: boolean;
  },
): boolean {
  return (
    (reservedPlaces.disability ?? 0) >
    0 ||
    reservedPlaces.unemployed ||
    reservedPlaces.youngPeople ||
    reservedPlaces.women
  );
}
function buildLocationText(
  institution: {
    municipality: string | null;
    county: string | null;
  } | null,
): string {
  if (!institution) {
    return "Ubicación no disponible";
  }
  const parts = [
    institution.municipality,
    institution.county,
  ].filter(Boolean);
  return parts.length > 0
    ? parts.join(" · ")
    : "Ubicación no disponible";
}
function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "es-ES",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(date);
}
function normalizeLocation(value: string): string {
  return value.trim().toLocaleLowerCase("ca-ES");
}
