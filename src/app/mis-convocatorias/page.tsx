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
import { PersonalSelectionProcessStatusPicker } from "@/modules/user-selection-process/presentation/personal-selection-process-status-picker";
import { UnfollowSelectionProcessForm } from "@/modules/user-selection-process/presentation/unfollow-selection-process-form";
import {
  changePersonalStatusFromMySelectionProcessesAction,
  unfollowFromMySelectionProcessesAction,
} from "./actions";
export default async function MySelectionProcessesPage() {
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
            {/* ==================================================*
*                CABECERA*
*            ================================================== */}
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
            {/* ==================================================*
*                SIN CONVOCATORIAS*
*            ================================================== */}
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
              <section className="flex min-w-0 flex-col gap-4">
                {/* ==================================================*
*                    CONTADOR*
*                ================================================== */}
                <div>
                  <h2 className="text-[17px] font-semibold text-[#131A2C]">
                    Convocatorias en seguimiento
                  </h2>
                  <p className="mt-1 text-sm text-[#69738A]">
                    {userSelectionProcesses.length}{" "}
                    {userSelectionProcesses.length === 1
                      ? "convocatoria"
                      : "convocatorias"}
                  </p>
                </div>
                {/* ==================================================*
*                    GRID*
*                ================================================== */}
                <div className="grid min-w-0 items-stretch gap-3 min-[1180px]:grid-cols-2">
                  {userSelectionProcesses.map(
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
                            {/* ======================================*
*                                ESTADO / TIPO / PLAZO*
*                            ====================================== */}
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
                            {/* ======================================*
*                                TÍTULO / UBICACIÓN*
*                            ====================================== */}
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
                            {/* ======================================*
*                                SOLICITUD*
*                            ====================================== */}
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
                            {/* ======================================*
*                                RESERVAS*
*                            ====================================== */}
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
                            {/* ======================================*
*                                ÚLTIMO DOCUMENTO*
*                            ====================================== */}
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
                            {/* ======================================*
*                                MI ESTADO*
*                            ====================================== */}
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
                            {/* ======================================*
*                                INFORMACIÓN PERSONAL*
*                            ====================================== */}
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
                            {/* ======================================*
*                                ACCIONES*
*                            ====================================== */}
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
                                    "/mis-convocatorias",
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
                  )}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
/* ============================================================*
*   COMPONENTES*
*============================================================ */
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
/* ============================================================*
*   PLAZO DE SOLICITUD*
*============================================================ */
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
/* ============================================================*
*   OTROS HELPERS*
*============================================================ */
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
