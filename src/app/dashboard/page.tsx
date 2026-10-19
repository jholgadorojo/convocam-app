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
import { prisma } from "@/shared/infrastructure/database/prisma";
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
 * SPEC-009 - Ajustes previos a la validacion funcional.
 *
 * - Sin buscador duplicado (ya existe en el menu lateral).
 * - El seguimiento se inicia desde el detalle, no desde el dashboard.
 * - Los enlaces de detalle son botones destacados.
 * - Modo temporal para probar publicaciones de los ultimos dos meses.
 */

/**
 * SOLO PARA PRUEBAS.
 *
 * true: consulta hasta cinco documentos activos de los ultimos dos meses,
 *       aunque sean anteriores al inicio del seguimiento.
 * false: restaura el criterio definitivo de SPEC-009 mediante el caso de uso.
 *
 * No cambiar otras tablas, repositorios ni especificaciones por esta prueba.
 */
const TEST_RECENT_PUBLICATIONS = true;

const secondaryDetailButtonClasses =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg " +
  "border border-[#C9CEF5] bg-[#EEF0FC] px-3.5 py-2 text-sm " +
  "font-semibold text-[#3B45B5] transition-colors " +
  "hover:border-[#9FA8EC] hover:bg-[#E2E6FB] " +
  "focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]";

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
        TEST_RECENT_PUBLICATIONS
          ? loadRecentPublicationsForTest(session.user.id)
          : getDashboardLatestPublicationsUseCase
              .execute({ userId: session.user.id })
              .then((result) => result.publications),
      ])
    : null;

  const personalDeadlines = personalResults?.[0] ?? null;
  const forMeResult = personalResults?.[1] ?? null;
  const latestPublications = personalResults?.[2] ?? [];
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

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#F4F6F9] px-2.5 py-1.5 text-xs font-medium text-[#4E5870]">
                  Mi estado: {getPersonalStatusLabel(item.personalStatus)}
                </span>
              </div>

              <div className="mt-3 flex justify-end border-t border-[#EEF1F5] pt-3">
                <Link
                  href={dashboardDetailHref(item.selectionProcessId)}
                  className={secondaryDetailButtonClasses}
                >
                  Ver detalle
                  <ArrowRight size={16} aria-hidden="true" />
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

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="flex items-start gap-1.5 text-xs text-[#69738A]">
                    <CalendarDays size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {getOpportunityDateText(item)}
                  </span>
                </div>

                {/* Revisar antes de seguir: la decision se toma en el detalle. */}
                <div className="mt-3 flex justify-end border-t border-[#EEF1F5] pt-3">
                  <Link
                    href={dashboardDetailHref(item.id)}
                    className={secondaryDetailButtonClasses}
                  >
                    Ver detalle
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
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
      <div className="border-b border-[#EEF1F5] pb-4">
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
            {TEST_RECENT_PUBLICATIONS
              ? "Prueba temporal: hasta cinco documentos activos de los " +
                "últimos dos meses de convocatorias que sigues, aunque " +
                "se publicaran antes de empezar a seguirlas."
              : "Los cinco documentos más recientes publicados desde " +
                "el día en que empezaste a seguir cada convocatoria."}
          </p>
          {TEST_RECENT_PUBLICATIONS && (
            <span className="mt-2 inline-flex rounded-md bg-[#FFF2DF] px-2.5 py-1 text-xs font-semibold text-[#955000]">
              Prueba temporal: últimos dos meses
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-8">
          <p className="text-sm font-medium text-[#4E5870]">
            No hay publicaciones oficiales para mostrar.
          </p>
          <p className="mt-1 text-sm text-[#69738A]">
            {TEST_RECENT_PUBLICATIONS
              ? "No se han encontrado documentos activos publicados en los " +
                "últimos dos meses para las convocatorias que sigues."
              : "Aquí aparecerán los documentos activos publicados " +
                "desde el día en que comenzaste a seguir cada convocatoria."}
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
                  {/* Fecha y convocatoria en una misma fila en pantallas amplias. */}
                  <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
                    <div className="inline-flex shrink-0 items-center gap-2.5 self-start rounded-lg border border-[#BFC7F8] bg-[#EEF0FC] px-3 py-2 shadow-sm">
                      <CalendarDays
                        size={19}
                        className="shrink-0 text-[#3B45B5]"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#4E5870]">
                          Fecha de publicación
                        </span>
                        <time
                          dateTime={item.publicationDate.toISOString().slice(0, 10)}
                          className="mt-0.5 text-base font-bold leading-tight tabular-nums text-[#2D3699]"
                        >
                          {formatCalendarDate(item.publicationDate)}
                        </time>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#69738A]">
                        Convocatoria
                      </p>
                      <p className="mt-1 break-words text-[17px] font-bold leading-snug text-[#131A2C]">
                        {formatSelectionProcessTitle(item.selectionProcessTitle)}
                      </p>
                    </div>
                  </div>

                  {item.phase.trim() !== "" && (
                    <span className="mt-3 inline-flex max-w-full break-words rounded-md bg-[#EEF0FC] px-2.5 py-1.5 text-xs font-medium text-[#3B45B5]">
                      {item.phase}
                    </span>
                  )}

                  {/* El titulo del documento no cambia. */}
                  <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug text-[#131A2C]">
                    {item.summary.trim() || "Publicación oficial"}
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
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:flex-col sm:items-end">
                  <Link
                    href={dashboardDetailHref(item.selectionProcessId)}
                    className={secondaryDetailButtonClasses}
                  >
                    Ver detalle
                    <ArrowRight size={16} aria-hidden="true" />
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

/**
 * PRUEBA TEMPORAL DE PUBLICACIONES (SOLO EN ESTA PAGINA).
 *
 * Para comprobar la interfaz con datos reales, se consultan documentos
 * activos de los dos meses previos del calendario de Catalunya.
 *
 * IMPORTANTE: durante esta prueba NO se aplica la fecha followedAt.
 * La consulta sigue limitada a convocatorias que sigue el usuario.
 * La ruta definitiva permanece disponible al desactivar el indicador
 * TEST_RECENT_PUBLICATIONS y vuelve a usar Clean Architecture.
 */
async function loadRecentPublicationsForTest(
  userId: string,
): Promise<DashboardLatestPublicationItem[]> {
  const today = getCataloniaCalendarDate(new Date());
  const fromDate = subtractUtcCalendarMonths(today, 2);

  const documents = await prisma.selectionProcessDocument.findMany({
    where: {
      sourceActive: true,
      publicationDate: {
        gte: fromDate,
        lte: today,
      },
      selectionProcess: {
        is: {
          userSelectionProcesses: {
            some: { userId },
          },
        },
      },
    },
    orderBy: [
      { publicationDate: "desc" },
      { id: "desc" },
    ],
    take: 5,
    select: {
      id: true,
      selectionProcessId: true,
      publicationDate: true,
      summary: true,
      phase: true,
      documentUrl: true,
      selectionProcess: {
        select: {
          title: true,
          institution: {
            select: {
              municipality: true,
            },
          },
        },
      },
    },
  });

  return documents.map((document) => ({
    documentId: document.id,
    selectionProcessId: document.selectionProcessId,
    selectionProcessTitle: document.selectionProcess.title,
    municipality:
      document.selectionProcess.institution?.municipality ?? null,
    publicationDate: document.publicationDate,
    summary: document.summary,
    phase: document.phase,
    documentUrl: document.documentUrl,
  }));
}

/** Devuelve la fecha local de Catalunya como DATE a medianoche UTC. */
function getCataloniaCalendarDate(instant: Date): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

/** Restar meses naturales sin desbordar el ultimo dia del mes. */
function subtractUtcCalendarMonths(date: Date, months: number): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1),
  );

  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return result;
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
