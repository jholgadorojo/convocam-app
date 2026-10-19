import type { ReactNode } from "react";

import Link from "next/link";
import { headers } from "next/headers";

import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  FileText,
  ListChecks,
  MapPin,
  Search,
  Target,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { followFromDashboardAction } from "./actions";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

import {
  getDashboardLatestPublicationsUseCase,
  getPersonalDashboardDeadlinesUseCase,
  getPublicDashboardCountsUseCase,
} from "@/composition/dashboard";
import {
  listSelectionProcessesForMeUseCase,
} from "@/composition/selection-process";

import type { DashboardLatestPublicationItem } from
  "@/modules/dashboard/application/dashboard-query-repository";
import type { PersonalDashboardUpcomingDeadline } from
  "@/modules/dashboard/application/get-personal-dashboard-deadlines";
import type { SelectionProcessListItem } from
  "@/modules/selection-process/application/selection-process-list-item";
import { getOfficialStatusPresentation } from
  "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from
  "@/modules/selection-process/presentation/selection-process-title";

/**
 * SPEC-009 — PASO 6.4.5
 * Dashboard público y dashboard personal.
 *
 * Visitante: contadores públicos CIDO, buscador e invitación a registrarse.
 * Usuario autenticado: tres indicadores, dos paneles de convocatorias
 * y un panel de últimas publicaciones oficiales.
 *
 * Las oportunidades incluyen una acción para iniciar su seguimiento
 * sin abandonar el dashboard, reutilizando SPEC-006.
 */

const calendarDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = Boolean(session?.user);

  const publicCounts = session?.user
    ? null
    : await getPublicDashboardCountsUseCase.execute();

  const personalResults = session?.user
    ? await Promise.all([
        getPersonalDashboardDeadlinesUseCase.execute({
          userId: session.user.id,
        }),
        listSelectionProcessesForMeUseCase.execute({
          userId: session.user.id,
          page: 1,
          pageSize: 3,
          excludeFollowed: true,
        }),
        getDashboardLatestPublicationsUseCase.execute({
          userId: session.user.id,
        }),
      ])
    : null;

  const personalDeadlines = personalResults?.[0] ?? null;
  const forMeResult = personalResults?.[1] ?? null;
  const latestPublications = personalResults?.[2]?.publications ?? [];
  const forMeCount =
    forMeResult?.kind === "results"
      ? forMeResult.page.totalItems
      : null;
  const opportunities =
    forMeResult?.kind === "results"
      ? forMeResult.page.items
      : [];
  const preferencesNotConfigured =
    forMeResult?.kind === "preferences-not-configured";

  const firstName = session?.user.name?.trim().split(/\s+/)[0] || null;

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated={isAuthenticated}
        activeItem="dashboard"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Dashboard"
          user={
            session?.user
              ? {
                  name: session.user.name,
                  email: session.user.email,
                }
              : undefined
          }
        />

        <main className="flex-1 px-6 py-8 lg:px-10 lg:pb-12">
          <div className="flex flex-col gap-7">
            {/* Cabecera */}
            <header>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                {isAuthenticated
                  ? firstName
                    ? `Hola, ${firstName}`
                    : "Tu espacio personal"
                  : "Encuentra tu próxima convocatoria"}
              </h1>
              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                {isAuthenticated
                  ? "Consulta tus convocatorias seguidas, los plazos próximos y nuevas oportunidades para ti."
                  : "Busca procesos selectivos y bolsas de trabajo de acceso libre en Catalunya."}
              </p>
            </header>

            {/* Buscador disponible para visitantes y usuarios autenticados */}
            <section className="rounded-xl border border-[#E3E7EE] bg-white p-6 shadow-sm">
              <form
                action="/convocatorias"
                method="get"
                className="flex flex-col gap-3 md:flex-row"
              >
                <div className="relative flex-1">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C859B]"
                  />
                  <input
                    type="search"
                    name="q"
                    placeholder="Puesto, organismo, municipio..."
                    aria-label="Buscar convocatorias"
                    className="h-12 w-full rounded-[10px] border border-[#D5DAE3] bg-white pl-12 pr-4 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 rounded-[10px] bg-[#4F5BD5] px-6 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                >
                  Buscar convocatorias
                </button>
              </form>
            </section>

            {/* Dashboard autenticado: indicadores y paneles de detalle */}
            {personalDeadlines !== null && (
              <>
                <section
                  aria-labelledby="personal-summary-heading"
                  className="flex flex-col gap-4"
                >
                  <div>
                    <h2
                      id="personal-summary-heading"
                      className="text-lg font-semibold text-[#131A2C]"
                    >
                      Mi resumen
                    </h2>
                    <p className="mt-1 text-sm text-[#69738A]">
                      Una visión general de tus convocatorias y oportunidades.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <PersonalStatCard
                      icon={<Bookmark size={21} />}
                      title="En seguimiento"
                      count={personalDeadlines.followedCount}
                      description={
                        personalDeadlines.followedCount === 0
                          ? "Todavía no sigues ninguna convocatoria."
                          : "Convocatorias que estás siguiendo, independientemente de su estado."
                      }
                      href="/mis-convocatorias"
                      action="Mis convocatorias"
                    />

                    <PersonalStatCard
                      icon={<CalendarClock size={21} />}
                      title="Plazos próximos"
                      count={personalDeadlines.upcomingDeadlinesCount}
                      description={
                        personalDeadlines.upcomingDeadlinesCount === 0
                          ? "No tienes plazos de solicitud próximos en los siguientes 15 días."
                          : "Convocatorias seguidas cuyo plazo finaliza en los próximos 15 días."
                      }
                      href="/mis-convocatorias"
                      action="Ver mis convocatorias"
                    />

                    <PersonalStatCard
                      icon={<Target size={21} />}
                      title="Para mí"
                      count={forMeCount}
                      description={
                        preferencesNotConfigured
                          ? "Configura tus preferencias para descubrir oportunidades personalizadas."
                          : forMeCount === 0
                            ? "No hay oportunidades nuevas que coincidan con tus preferencias."
                            : "Oportunidades que encajan con tu perfil y que todavía no sigues."
                      }
                      href={
                        preferencesNotConfigured
                          ? "/mi-perfil"
                          : "/para-mi"
                      }
                      action={
                        preferencesNotConfigured
                          ? "Configurar mi perfil"
                          : "Ver todas mis coincidencias"
                      }
                    />
                  </div>
                </section>

                {/* Proporción 55 % / 45 % a partir de pantallas grandes */}
                <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:items-start">
                  <UpcomingDeadlinesPanel
                    items={personalDeadlines.upcomingDeadlines}
                  />
                  <NewOpportunitiesPanel
                    items={opportunities}
                    preferencesNotConfigured={preferencesNotConfigured}
                  />
                </div>

                {/* Publicaciones oficiales: ancho completo. */}
                <LatestOfficialPublicationsPanel
                  items={latestPublications}
                />
              </>
            )}

            {/* Contadores públicos: solo visitantes */}
            {publicCounts !== null && (
              <section
                aria-labelledby="public-dashboard-counts"
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <h2
                      id="public-dashboard-counts"
                      className="text-lg font-semibold text-[#131A2C]"
                    >
                      Convocatorias en Catalunya
                    </h2>
                    <p className="mt-1 text-sm text-[#69738A]">
                      Explora las convocatorias según su estado oficial en CIDO.
                    </p>
                  </div>
                  <Link
                    href="/convocatorias"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B45B5] hover:underline"
                  >
                    Ver todas las convocatorias
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <PublicCountCard
                    title="Plazo abierto"
                    count={publicCounts.openCount}
                    description="Convocatorias con el plazo de presentación de solicitudes abierto."
                    href="/convocatorias?statusId=3&statusFilterApplied=1"
                    action="Ver convocatorias abiertas"
                  />
                  <PublicCountCard
                    title="Pendiente de plazo"
                    count={publicCounts.pendingCount}
                    description="Convocatorias pendientes de la apertura del plazo de solicitudes."
                    href="/convocatorias?statusId=2&statusFilterApplied=1"
                    action="Ver convocatorias pendientes"
                  />
                </div>
              </section>
            )}

            {/* Accesos conservados para visitantes */}
            {!isAuthenticated && (
              <div className="grid gap-4 md:grid-cols-3">
                <DashboardCard
                  icon={<Search size={20} />}
                  title="Buscar"
                  description="Encuentra convocatorias por puesto, organismo o ubicación."
                  href="/convocatorias"
                  action="Buscar convocatorias"
                />
                <DashboardCard
                  icon={<Bookmark size={20} />}
                  title="Guardar"
                  description="Guarda las convocatorias que te interesan para consultarlas después."
                  href="/login?returnTo=/mis-convocatorias"
                  action="Iniciar sesión"
                />
                <DashboardCard
                  icon={<ListChecks size={20} />}
                  title="Seguir"
                  description="Controla el estado de cada proceso y sus próximas fechas."
                  href="/login?returnTo=/mis-convocatorias"
                  action="Iniciar sesión"
                />
              </div>
            )}

            {!isAuthenticated && (
              <section className="flex flex-col justify-between gap-5 rounded-xl border border-[#DDE1FA] bg-[#EEF0FC] p-6 md:flex-row md:items-center">
                <div>
                  <h2 className="text-base font-semibold text-[#131A2C]">
                    ¿Quieres guardar y seguir tus convocatorias?
                  </h2>
                  <p className="mt-1 text-sm text-[#4E5870]">
                    Crea una cuenta gratuita y tendrás tu espacio personal en
                    Convoca&apos;m.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/login?returnTo=/dashboard"
                    className="flex h-10 items-center rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#3B45B5]"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="flex h-10 items-center rounded-lg bg-[#4F5BD5] px-4 text-sm font-semibold text-white"
                  >
                    Crear cuenta
                  </Link>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/** Panel izquierdo: cinco plazos próximos de convocatorias seguidas. */
function UpcomingDeadlinesPanel({
  items,
}: {
  items: PersonalDashboardUpcomingDeadline[];
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF1F5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock size={19} className="text-[#4F5BD5]" />
            <h2 className="text-lg font-semibold text-[#131A2C]">
              Plazos próximos
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#69738A]">
            Los cinco vencimientos más cercanos en los próximos 15 días.
          </p>
        </div>
        <Link
          href="/mis-convocatorias"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#3B45B5] hover:underline"
        >
          Ver mis convocatorias
          <ArrowRight size={15} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-8">
          <p className="text-sm font-medium text-[#4E5870]">
            No tienes plazos de solicitud próximos.
          </p>
          <p className="mt-1 text-sm text-[#69738A]">
            Aquí aparecerán las convocatorias seguidas con estado
            «Me interesa» o «Preparando solicitud» cuyo plazo finalice
            dentro de los próximos 15 días.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEF1F5]">
          {items.map((item) => (
            <article
              key={item.selectionProcessId}
              className="min-w-0 py-4 first:pt-4 last:pb-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${deadlineBadgeClasses(item.daysRemaining)}`}
                >
                  {deadlineBadgeLabel(item.daysRemaining)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#69738A]">
                  <CalendarDays size={14} aria-hidden="true" />
                  Fin: {formatCalendarDate(item.applicationEndDate)}
                </span>
              </div>

              <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug text-[#131A2C]">
                {formatSelectionProcessTitle(item.title)}
              </h3>

              <p className="mt-2 flex items-start gap-1.5 text-sm text-[#4E5870]">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0 text-[#7C859B]"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">
                  {item.municipality || "Municipio no indicado"}
                </span>
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-[#F4F6F9] px-2.5 py-1.5 text-xs font-medium text-[#4E5870]">
                  Mi estado: {getPersonalStatusLabel(item.personalStatus)}
                </span>
                <Link
                  href={dashboardDetailHref(item.selectionProcessId)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#3B45B5] hover:underline"
                >
                  Ver detalle
                  <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/** Panel derecho: las tres mejores oportunidades aún no seguidas. */
function NewOpportunitiesPanel({
  items,
  preferencesNotConfigured,
}: {
  items: SelectionProcessListItem[];
  preferencesNotConfigured: boolean;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF1F5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target size={19} className="text-[#4F5BD5]" />
            <h2 className="text-lg font-semibold text-[#131A2C]">
              Oportunidades para mí
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#69738A]">
            Las tres primeras coincidencias con tu perfil que aún no sigues.
          </p>
        </div>
        <Link
          href={preferencesNotConfigured ? "/mi-perfil" : "/para-mi"}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#3B45B5] hover:underline"
        >
          {preferencesNotConfigured ? "Configurar perfil" : "Ir a Para mí"}
          <ArrowRight size={15} />
        </Link>
      </div>

      {preferencesNotConfigured ? (
        <div className="py-8">
          <p className="text-sm font-medium text-[#4E5870]">
            Aún no has configurado tus preferencias.
          </p>
          <p className="mt-1 text-sm text-[#69738A]">
            Completa tus preferencias territoriales o profesionales en Mi perfil
            para encontrar convocatorias para ti.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-8">
          <p className="text-sm font-medium text-[#4E5870]">
            No hay oportunidades nuevas en este momento.
          </p>
          <p className="mt-1 text-sm text-[#69738A]">
            Todas tus coincidencias están en seguimiento o no hay convocatorias
            activas que cumplan tus preferencias.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEF1F5]">
          {items.map((item) => {
            const officialStatus = getOfficialStatusPresentation(
              item.status,
              item.statusId,
            );

            return (
              <article
                key={item.id}
                className="min-w-0 py-4 first:pt-4 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${officialStatus.badgeClassName}`}
                  >
                    {officialStatus.label}
                  </span>
                  <span className="rounded-full bg-[#F4F6F9] px-2.5 py-1 text-xs font-medium text-[#4E5870]">
                    {item.isJobPool ? "Bolsa de trabajo" : "Plaza de plantilla"}
                  </span>
                </div>

                <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug text-[#131A2C]">
                  {formatSelectionProcessTitle(item.title)}
                </h3>

                <p className="mt-2 flex items-start gap-1.5 text-sm text-[#4E5870]">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-[#7C859B]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">
                    {item.institution?.municipality || "Municipio no indicado"}
                  </span>
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-start gap-1.5 text-xs text-[#69738A]">
                    <CalendarDays size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {getOpportunityDateText(item)}
                  </span>
                  <Link
                    href={dashboardDetailHref(item.id)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#3B45B5] hover:underline"
                  >
                    Ver detalle
                    <ArrowRight size={15} />
                  </Link>
                </div>

                {/* Seguir sin salir del dashboard. */}
                <div className="mt-3 flex justify-end border-t border-[#EEF1F5] pt-3">
                  <form action={followFromDashboardAction}>
                    <input
                      type="hidden"
                      name="selectionProcessId"
                      value={item.id}
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#4F5BD5] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3B45B5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]"
                    >
                      <Bookmark size={16} aria-hidden="true" />
                      Seguir convocatoria
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Panel completo: últimas cinco publicaciones oficiales seguidas. */
function LatestOfficialPublicationsPanel({
  items,
}: {
  items: DashboardLatestPublicationItem[];
}) {
  return (
    <section
      aria-labelledby="dashboard-publications-heading"
      className="min-w-0 rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF1F5] pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText size={19} className="shrink-0 text-[#4F5BD5]" />
            <h2
              id="dashboard-publications-heading"
              className="text-lg font-semibold text-[#131A2C]"
            >
              Últimas publicaciones oficiales
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#69738A]">
            Los cinco documentos más recientes publicados desde el día
            en que empezaste a seguir cada convocatoria.
          </p>
        </div>
        <Link
          href="/mis-convocatorias"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#3B45B5] hover:underline"
        >
          Ver mis convocatorias
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-8">
          <p className="text-sm font-medium text-[#4E5870]">
            No hay publicaciones oficiales para mostrar.
          </p>
          <p className="mt-1 text-sm text-[#69738A]">
            Aquí aparecerán los documentos activos publicados desde el día
            en que comenzaste a seguir cada convocatoria.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEF1F5]">
          {items.map((item) => (
            <article
              key={item.documentId}
              className="min-w-0 py-4 first:pt-4 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F4F6F9] px-2.5 py-1.5 text-xs font-medium text-[#4E5870]">
                      <CalendarDays size={14} aria-hidden="true" />
                      {formatCalendarDate(item.publicationDate)}
                    </span>
                    {item.phase.trim() !== "" && (
                      <span className="max-w-full break-words rounded-md bg-[#EEF0FC] px-2.5 py-1.5 text-xs font-medium text-[#3B45B5]">
                        {item.phase}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug text-[#131A2C]">
                    {item.summary.trim() || "Publicación oficial"}
                  </h3>

                  <p className="mt-2 break-words text-sm leading-relaxed text-[#4E5870]">
                    <span className="font-semibold">Convocatoria:</span>{" "}
                    {formatSelectionProcessTitle(item.selectionProcessTitle)}
                  </p>

                  <p className="mt-2 flex items-start gap-1.5 text-sm text-[#4E5870]">
                    <MapPin
                      size={15}
                      className="mt-0.5 shrink-0 text-[#7C859B]"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-words">
                      {item.municipality || "Municipio no indicado"}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:flex-col sm:items-end">
                  <Link
                    href={dashboardDetailHref(item.selectionProcessId)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#3B45B5] hover:underline"
                  >
                    Ver convocatoria
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                  {item.documentUrl.trim() !== "" ? (
                    <a
                      href={item.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#C9CEF5] bg-[#EEF0FC] px-3.5 py-2 text-sm font-semibold text-[#3B45B5] transition-colors hover:border-[#9FA8EC] hover:bg-[#E2E6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]"
                    >
                      Documento oficial
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#69738A]">
                      Enlace oficial no disponible
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function dashboardDetailHref(selectionProcessId: number): string {
  return `/convocatorias/${selectionProcessId}?returnTo=${encodeURIComponent("/dashboard")}`;
}

/** Las fechas DATE de PostgreSQL se representan a las 00:00 UTC. */
function formatCalendarDate(value: Date): string {
  return calendarDateFormatter.format(value);
}

function getOpportunityDateText(item: SelectionProcessListItem): string {
  if (item.statusId === 3) {
    return item.applicationEndDate
      ? `Fin del plazo: ${formatCalendarDate(item.applicationEndDate)}`
      : "Fin del plazo por confirmar";
  }
  if (item.statusId === 2) {
    return item.applicationStartDate
      ? `Inicio del plazo: ${formatCalendarDate(item.applicationStartDate)}`
      : "Inicio del plazo por confirmar";
  }
  return item.applicationEndDate
    ? `Fin del plazo: ${formatCalendarDate(item.applicationEndDate)}`
    : "Fechas por confirmar";
}

function deadlineBadgeClasses(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return "bg-[#FDEDEC] text-[#B42318]";
  }
  if (daysRemaining <= 3) {
    return "bg-[#FFF2DF] text-[#955000]";
  }
  return "bg-[#F0F2F5] text-[#4E5870]";
}

function deadlineBadgeLabel(daysRemaining: number): string {
  if (daysRemaining === 0) return "Finaliza hoy";
  if (daysRemaining === 1) return "Queda 1 día";
  return `Quedan ${daysRemaining} días`;
}

function getPersonalStatusLabel(status: string): string {
  switch (status) {
    case "INTERESTED":
      return "Me interesa";
    case "PREPARING_APPLICATION":
      return "Preparando solicitud";
    default:
      return "En seguimiento";
  }
}

type PersonalStatCardProps = {
  icon: ReactNode;
  title: string;
  count: number | null;
  description: string;
  href: string;
  action: string;
};

function PersonalStatCard({
  icon,
  title,
  count,
  description,
  href,
  action,
}: PersonalStatCardProps) {
  return (
    <section className="flex flex-col rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EEF0FC] text-[#3B45B5]">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#4E5870]">{title}</h3>
      <p className="mt-2 text-[36px] font-bold leading-tight tracking-tight text-[#131A2C]">
        {count === null ? "—" : new Intl.NumberFormat("es-ES").format(count)}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#69738A]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3B45B5] hover:underline"
      >
        {action}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

type PublicCountCardProps = {
  title: string;
  count: number;
  description: string;
  href: string;
  action: string;
};

function PublicCountCard({
  title,
  count,
  description,
  href,
  action,
}: PublicCountCardProps) {
  return (
    <section className="flex flex-col rounded-xl border border-[#E3E7EE] bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-[#4E5870]">{title}</h3>
      <p className="mt-3 text-4xl font-bold tracking-tight text-[#131A2C]">
        {new Intl.NumberFormat("es-ES").format(count)}
      </p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#69738A]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3B45B5] hover:underline"
      >
        {action}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

type DashboardCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
};

function DashboardCard({
  icon,
  title,
  description,
  href,
  action,
}: DashboardCardProps) {
  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EEF0FC] text-[#3B45B5]">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-[#131A2C]">{title}</h2>
      <p className="mt-1.5 min-h-[42px] text-sm leading-relaxed text-[#4E5870]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex text-sm font-semibold text-[#3B45B5] hover:underline"
      >
        {action}
      </Link>
    </section>
  );
}
