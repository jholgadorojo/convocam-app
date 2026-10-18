import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  ExternalLink,
  MapPin,
  BookmarkCheck,
  SlidersHorizontal,
  Target,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  listSelectionProcessesForMeUseCase,
} from "@/composition/selection-process";
import {
  getUserProfessionalPreferencesUseCase,
  getUserTerritorialPreferencesUseCase,
} from "@/composition/user-profile";
import {
  listUserSelectionProcessesUseCase,
} from "@/composition/user-selection-process";
import {
  getApplicationPeriodPresentation,
  getOfficialStatusPresentation,
} from "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";
import { followFromForMeAction } from "./actions";

type ForMePageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function ForMePage({ searchParams }: ForMePageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/para-mi");
  }

  const params = await searchParams;
  const requestedPage = parsePage(params.page);
  const userId = session.user.id;

  const [result, territorialPreferences, professionalPreferences, followed] =
    await Promise.all([
      listSelectionProcessesForMeUseCase.execute({
        userId,
        page: requestedPage,
      }),
      getUserTerritorialPreferencesUseCase.execute({ userId }),
      getUserProfessionalPreferencesUseCase.execute({ userId }),
      listUserSelectionProcessesUseCase.execute(userId),
    ]);

  const followedIds = new Set(
    followed.map((item) => item.selectionProcess.id),
  );

  const matchReasons: string[] = [];

  if (territorialPreferences?.scope === "SELECTED_TERRITORIES") {
    matchReasons.push("Ubicación del organismo");
  }

  if (professionalPreferences?.selectionProcessType === "POSITIONS") {
    matchReasons.push("Plazas de plantilla");
  } else if (
    professionalPreferences?.selectionProcessType === "JOB_POOLS"
  ) {
    matchReasons.push("Bolsas de trabajo");
  }

  if ((professionalPreferences?.subjectAreaIds.length ?? 0) > 0) {
    matchReasons.push("Materias profesionales");
  }

  if ((professionalPreferences?.qualificationGroups.length ?? 0) > 0) {
    matchReasons.push("Grupo de titulación");
  }

  const pageData = result.kind === "results" ? result.page : null;
  const currentPage = pageData?.page ?? 1;

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar isAuthenticated activeItem="para-mi" />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Para mí"
          user={{
            name: session.user.name,
            email: session.user.email,
          }}
        />

        <main className="flex-1 px-4 py-8 lg:px-6 lg:pb-12">
          <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Target size={23} className="text-[#4F5BD5]" />
                  <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                    Para mí
                  </h1>
                </div>
                <p className="mt-1.5 max-w-[720px] text-[15px] text-[#4E5870]">
                  Convocatorias que coinciden con las preferencias que has
                  guardado en tu perfil.
                </p>
              </div>

              <Link
                href="/mi-perfil"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
              >
                <SlidersHorizontal size={16} />
                Editar mis preferencias
              </Link>
            </header>

            {result.kind === "preferences-not-configured" ? (
              <section className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
                <Target size={32} className="mx-auto text-[#7C859B]" />
                <h2 className="mt-4 text-lg font-semibold text-[#131A2C]">
                  Configura tus preferencias
                </h2>
                <p className="mx-auto mt-2 max-w-[520px] text-sm leading-relaxed text-[#69738A]">
                  Selecciona tus preferencias territoriales o profesionales
                  para descubrir convocatorias relacionadas con tus intereses.
                </p>
                <Link
                  href="/mi-perfil"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#4F5BD5] px-5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                >
                  Ir a Mi perfil
                </Link>
              </section>
            ) : pageData && pageData.items.length === 0 ? (
              <section className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
                <h2 className="text-lg font-semibold text-[#131A2C]">
                  No hay convocatorias que coincidan
                </h2>
                <p className="mx-auto mt-2 max-w-[550px] text-sm leading-relaxed text-[#69738A]">
                  No hemos encontrado convocatorias en los estados oficiales
                  «Pendiente de plazo» o «Plazo abierto» que cumplan todas las
                  preferencias configuradas.
                </p>
                <Link
                  href="/mi-perfil"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#4F5BD5] px-5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                >
                  Revisar mis preferencias
                </Link>
              </section>
            ) : pageData ? (
              <section className="flex min-w-0 flex-col gap-4">
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

                <div className="grid min-w-0 items-stretch gap-3 min-[1180px]:grid-cols-2">
                  {pageData.items.map((item) => {
                    const officialStatus = getOfficialStatusPresentation(
                      item.status,
                      item.statusId,
                    );
                    const applicationPeriod = getApplicationPeriodPresentation(
                      item.applicationStartDate,
                      item.applicationEndDate,
                    );
                    const isFollowing = followedIds.has(item.id);
                    const returnTo = pageHref(currentPage);
                    const detailHref = `/convocatorias/${item.id}?returnTo=${encodeURIComponent(returnTo)}`;

                    return (
                      <article
                        key={item.id}
                        className={`flex h-full min-w-0 flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${
                          isFollowing
                            ? "border-[#D9DFF3] bg-[#F5F7FF]"
                            : "border-[#E3E7EE] bg-white"
                        }`}
                      >
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${officialStatus.badgeClassName}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${officialStatus.dotClassName}`} />
                              {officialStatus.label}
                            </span>
                            <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-3 text-xs font-semibold text-[#3B45B5]">
                              {item.isJobPool ? "Bolsa de trabajo" : "Plaza de plantilla"}
                            </span>
                          </div>

                          <h3 className="mt-4 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#131A2C]">
                            {formatSelectionProcessTitle(item.title)}
                          </h3>

                          <p className="mt-2 flex items-start gap-2 text-[13.5px] text-[#4E5870]">
                            <MapPin size={15} className="mt-0.5 shrink-0 text-[#7C859B]" />
                            <span>{locationText(item.institution)}</span>
                          </p>

                          <div className="mt-4 rounded-lg border border-[#E7EAF0] bg-[#F7F8FA] px-3.5 py-3">
                            <div className="flex items-start gap-2.5">
                              <CalendarClock size={17} className="mt-0.5 shrink-0 text-[#4F5BD5]" />
                              <div>
                                <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
                                  Plazo de solicitud
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#131A2C]">
                                  {applicationPeriod.label}
                                  {(applicationPeriod.state === "open" || applicationPeriod.state === "future") &&
                                    ` · ${applicationPeriod.detail}`}
                                </p>
                                <p className="mt-1 text-xs text-[#69738A]">
                                  Inicio: {formatDate(item.applicationStartDate)}
                                  {" · "}Fin: {formatDate(item.applicationEndDate)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex-1">
                            <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
                              ¿Por qué aparece para mí?
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(matchReasons.length > 0
                                ? matchReasons
                                : ["Preferencias generales de tu perfil"]
                              ).map((reason) => (
                                <span
                                  key={reason}
                                  className="inline-flex rounded-full border border-[#DDE1FA] bg-[#F7F7FF] px-2.5 py-1 text-[11px] font-medium text-[#3B45B5]"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                            {territorialPreferences?.scope === "SELECTED_TERRITORIES" && (
                              <p className="mt-1.5 text-[11px] text-[#7C859B]">
                                La coincidencia territorial se basa en la ubicación
                                del organismo convocante, no necesariamente del puesto.
                              </p>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#EEF1F5] pt-3">
                            {isFollowing && (
                              <Link
                                href="/mis-convocatorias"
                                className="mr-auto inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#C9CEF5] bg-[#EEF0FC] px-3 py-2 text-sm font-semibold text-[#3B45B5] transition-colors hover:border-[#9FA8EC] hover:bg-[#E2E6FB]"
                              >
                                <BookmarkCheck size={16} aria-hidden="true" />
                                Mi seguimiento
                              </Link>
                            )}
                            <a
                              href={item.cidoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                            >
                              Fuente oficial <ExternalLink size={13} />
                            </a>
                            <Link
                              href={detailHref}
                              className={isFollowing
                                ? "inline-flex items-center rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                                : "inline-flex items-center rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"}
                            >
                              Ver detalle
                            </Link>
                            {!isFollowing && (
                              <form action={followFromForMeAction}>
                                <input
                                  type="hidden"
                                  name="selectionProcessId"
                                  value={item.id}
                                />
                                <button
                                  type="submit"
                                  className="inline-flex items-center rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                                >
                                  Seguir convocatoria
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {pageData.totalPages > 1 && (
                  <nav
                    aria-label="Paginación de convocatorias para mí"
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#E3E7EE] bg-white px-4 py-3 text-sm"
                  >
                    {currentPage > 1 ? (
                      <Link href={pageHref(currentPage - 1)} className="font-semibold text-[#3B45B5] hover:underline">
                        ← Anterior
                      </Link>
                    ) : (
                      <span className="text-[#A4ADBE]">← Anterior</span>
                    )}
                    <span className="text-[#4E5870]">
                      {currentPage} / {pageData.totalPages}
                    </span>
                    {currentPage < pageData.totalPages ? (
                      <Link href={pageHref(currentPage + 1)} className="font-semibold text-[#3B45B5] hover:underline">
                        Siguiente →
                      </Link>
                    ) : (
                      <span className="text-[#A4ADBE]">Siguiente →</span>
                    )}
                  </nav>
                )}
              </section>
            ) : null}

            {result.kind === "results" && (
              <p className="text-xs leading-relaxed text-[#69738A]">
                Estas coincidencias se calculan con los datos publicados por CIDO
                y tus preferencias. No garantizan que cumplas todos los requisitos
                de participación; revisa siempre las bases oficiales.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return raw && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(page: number): string {
  return page <= 1 ? "/para-mi" : `/para-mi?page=${page}`;
}

function locationText(
  institution: {
    municipality: string | null;
    county: string | null;
  } | null,
): string {
  if (!institution) return "Ubicación del organismo no disponible";
  const parts = [institution.municipality, institution.county].filter(Boolean);
  return parts.length > 0
    ? parts.join(" · ")
    : "Ubicación del organismo no disponible";
}

function formatDate(date: Date | null): string {
  if (!date) return "No indicada";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
