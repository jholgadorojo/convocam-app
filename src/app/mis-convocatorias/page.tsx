import type { ReactNode } from "react";

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Building2,
  CalendarDays,
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

import {
  getPersonalSelectionProcessStatusLabel,
  PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS,
} from "@/modules/user-selection-process/presentation/personal-selection-process-status";

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
            {/* Cabecera de página */}
            <header>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                Mis convocatorias
              </h1>

              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Consulta y organiza las convocatorias
                que estás siguiendo.
              </p>
            </header>

            {/* Sin convocatorias */}
            {userSelectionProcesses.length === 0 ? (
              <section className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
                <h2 className="text-lg font-semibold text-[#131A2C]">
                  Todavía no sigues ninguna
                  convocatoria
                </h2>

                <p className="mx-auto mt-2 max-w-[520px] text-sm leading-relaxed text-[#69738A]">
                  Busca convocatorias y añade a
                  seguimiento las que te interesen.
                  Desde aquí podrás controlar su
                  estado y tus próximos pasos.
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
                {/* Esta cabecera está FUERA del grid */}
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

                {/* Solo las tarjetas están dentro del grid */}
                <div className="grid min-w-0 items-start gap-3 min-[1180px]:grid-cols-2">
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

                      return (
                        <article
                          key={item.id}
                          className="min-w-0 overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="p-4">
                            {/* ==================================================
                                BADGES
                            ================================================== */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${officialStatus.badgeClassName}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${officialStatus.dotClassName}`}
                                />

                                {
                                  officialStatus.label
                                }
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

                              <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-3 text-xs font-semibold text-[#3B45B5]">
                                {convocatoria.isJobPool
                                  ? "Bolsa de trabajo"
                                  : "Plaza de plantilla"}
                              </span>

                              {!convocatoria.sourceActive && (
                                <span className="inline-flex min-h-7 items-center rounded-full border border-[#F4D9A6] bg-[#FFF7E8] px-3 text-xs font-semibold text-[#9A6700]">
                                  Ya no activa en CIDO
                                </span>
                              )}
                            </div>

                            {/* ==================================================
                                TÍTULO / ORGANISMO
                            ================================================== */}
                            <div className="mt-4">
                              <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#131A2C]">
                                {formatSelectionProcessTitle(
                                  convocatoria.title,
                                )}
                              </h3>

                              <div className="mt-2 space-y-1.5 text-[13.5px] text-[#4E5870]">
                                <div className="flex items-start gap-2">
                                  <Building2
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[#7C859B]"
                                  />

                                  <span>
                                    {convocatoria
                                      .institution
                                      ?.name ??
                                      "Organismo no disponible"}
                                  </span>
                                </div>

                                <div className="flex items-start gap-2">
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
                            </div>

                            {/* ==================================================
                                INFORMACIÓN PRINCIPAL
                            ================================================== */}
                            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-lg border border-[#E7EAF0] sm:grid-cols-3">
                              <CompactInfo
                                label="N.º plazas"
                                value={formatNumberOfPositions(
                                  convocatoria.numberOfPositions,
                                  convocatoria.isJobPool,
                                )}
                              />

                              <CompactInfo
                                label="Grupo"
                                value={
                                  convocatoria.qualificationGroup ??
                                  "No especificado"
                                }
                              />

                              <CompactInfo
                                label="Personal"
                                value={
                                  convocatoria.personnelType ??
                                  "No especificado"
                                }
                              />

                              <CompactInfo
                                label="Sistema"
                                value={
                                  convocatoria.selectionSystem ??
                                  "No especificado"
                                }
                              />

                              <CompactInfo
                                label="Ámbito"
                                value={
                                  convocatoria.scope ??
                                  "No especificado"
                                }
                              />

                              <CompactInfo
                                label="Seguimiento"
                                value={formatDate(
                                  item.followedAt,
                                )}
                              />
                            </div>

                            {/* ==================================================
                                PLAZO
                            ================================================== */}
                            <div className="mt-3 rounded-lg bg-[#F7F8FA] px-3.5 py-3">
                              <div className="flex items-center gap-2">
                                <CalendarDays
                                  size={16}
                                  className="shrink-0 text-[#4F5BD5]"
                                />

                                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#69738A]">
                                  Plazo de solicitudes
                                </span>
                              </div>

                              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm">
                                <strong className="font-semibold text-[#131A2C]">
                                  {formatDate(
                                    convocatoria.applicationStartDate,
                                  )}
                                </strong>

                                <span className="text-[#A4ABBA]">
                                  →
                                </span>

                                <strong className="font-semibold text-[#131A2C]">
                                  {formatDate(
                                    convocatoria.applicationEndDate,
                                  )}
                                </strong>
                              </div>
                            </div>

                            {/* ==================================================
                                RESERVAS
                            ================================================== */}
                            {hasReservedPlaces(
                              convocatoria.reservedPlaces,
                            ) && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {(
                                  convocatoria
                                    .reservedPlaces
                                    .disability ?? 0
                                ) > 0 && (
                                  <SmallBadge>
                                    Discapacidad:{" "}
                                    {
                                      convocatoria
                                        .reservedPlaces
                                        .disability
                                    }
                                  </SmallBadge>
                                )}

                                {convocatoria
                                  .reservedPlaces
                                  .unemployed && (
                                  <SmallBadge>
                                    Reserva desempleados
                                  </SmallBadge>
                                )}

                                {convocatoria
                                  .reservedPlaces
                                  .youngPeople && (
                                  <SmallBadge>
                                    Reserva jóvenes
                                  </SmallBadge>
                                )}

                                {convocatoria
                                  .reservedPlaces
                                  .women && (
                                  <SmallBadge>
                                    Reserva mujeres
                                  </SmallBadge>
                                )}
                              </div>
                            )}

                            {/* ==================================================
                                MI ESTADO
                            ================================================== */}
                            <div className="mt-4 border-t border-[#EEF1F5] pt-3">
                              <form
                                action={
                                  changePersonalStatusFromMySelectionProcessesAction
                                }
                                className="flex flex-wrap items-end gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="selectionProcessId"
                                  value={
                                    convocatoria.id
                                  }
                                />

                                <label className="flex min-w-[190px] flex-1 flex-col gap-1">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
                                    Mi estado
                                  </span>

                                  <select
                                    key={
                                      item.personalStatus
                                    }
                                    name="personalStatus"
                                    defaultValue={
                                      item.personalStatus
                                    }
                                    className="h-9 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm font-medium text-[#131A2C] outline-none focus:border-[#4F5BD5]"
                                  >
                                    {PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS.map(
                                      (
                                        status,
                                      ) => (
                                        <option
                                          key={
                                            status
                                          }
                                          value={
                                            status
                                          }
                                        >
                                          {getPersonalSelectionProcessStatusLabel(
                                            status,
                                          )}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </label>

                                <button
                                  type="submit"
                                  className="h-9 shrink-0 rounded-lg bg-[#4F5BD5] px-3.5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                                >
                                  Actualizar
                                </button>
                              </form>
                            </div>

                            {/* ==================================================
                                ACCIONES
                            ================================================== */}
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <UnfollowSelectionProcessForm
                                selectionProcessId={
                                  convocatoria.id
                                }
                                action={
                                  unfollowFromMySelectionProcessesAction
                                }
                              />

                              <Link
                                href={`/convocatorias/${convocatoria.id}?returnTo=${encodeURIComponent(
                                  "/mis-convocatorias",
                                )}`}
                                className="text-sm font-semibold text-[#3B45B5] hover:underline"
                              >
                                Ver detalle →
                              </Link>
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

/* ============================================================
   COMPONENTES DE PRESENTACIÓN
============================================================ */

type CompactInfoProps = {
  label: string;
  value: string;
};

function CompactInfo({
  label,
  value,
}: CompactInfoProps) {
  return (
    <div className="min-w-0 border-b border-r border-[#E7EAF0] px-3 py-2.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
        {label}
      </p>

      <p className="mt-1 break-words text-[12.5px] font-medium leading-snug text-[#131A2C]">
        {value}
      </p>
    </div>
  );
}

function SmallBadge({
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

/* ============================================================
   HELPERS
============================================================ */

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

function formatNumberOfPositions(
  numberOfPositions: number | null,
  isJobPool: boolean,
): string {
  if (numberOfPositions !== null) {
    return String(numberOfPositions);
  }

  return isJobPool
    ? "No aplica"
    : "No especificadas";
}

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

function formatDate(
  date: Date | null,
): string {
  if (!date) {
    return "No especificada";
  }

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

function buildLocationText(
  institution: {
    municipality: string | null;
    county: string | null;
    province: string | null;
  } | null,
): string {
  if (!institution) {
    return "Ubicación no disponible";
  }

  const parts = [
    institution.municipality,
    institution.county,
    institution.province,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(" · ")
    : "Ubicación no disponible";
}