import type { ReactNode } from "react";

import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  BookmarkPlus,
  BriefcaseBusiness,
  Building2,
  Check,
  ExternalLink,
  FileText,
  GraduationCap,
  Info,
  Lock,
  MapPin,
  Scale,
  Users,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

import { getSelectionProcessDetailUseCase } from "@/composition/selection-process";

import { auth } from "@/lib/auth";

import type { SelectionProcessDetailDto } from "@/modules/selection-process/application/dto/selection-process-detail.dto";

import {
  getApplicationPeriodPresentation,
  getOfficialStatusPresentation,
} from "@/modules/selection-process/presentation/selection-process-status";

import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";

import {
  getUserSelectionProcessUseCase,
} from "@/composition/user-selection-process";

import {
  getPersonalSelectionProcessStatusLabel,
  PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS,
} from "@/modules/user-selection-process/presentation/personal-selection-process-status";

import {
  changePersonalStatusAction,
  followSelectionProcessAction,
  unfollowSelectionProcessAction,
} from "./actions";

type SelectionProcessDetailPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
};

type ProcessTimelineState =
  | "completed"
  | "current"
  | "current-known"
  | "future"
  | "unknown";

type ProcessTimelineStep = {
  key: string;
  title: string;
  detail: string | null;
  date: Date | null;
  state: ProcessTimelineState;
};

type OfficialSourceType =
  | "institution"
  | "application"
  | "cido"
  | "publication";

type OfficialSource = {
  type: OfficialSourceType;
  title: string;
  url: string;
  host: string;
};

type ImportantDate = {
  label: string;
  value: string;
  state:
  | "past"
  | "today"
  | "future"
  | "unknown";
};

export default async function SelectionProcessDetailPage({
  params,
  searchParams,
}: SelectionProcessDetailPageProps) {
  const session =
    await auth.api.getSession({
      headers: await headers(),
    });

  const isAuthenticated =
    Boolean(session?.user);

  const { id: idParam } =
    await params;

  const detailSearchParams =
    await searchParams;

  const rawReturnTo =
    Array.isArray(
      detailSearchParams.returnTo,
    )
      ? detailSearchParams.returnTo[0]
      : detailSearchParams.returnTo;

  const resultsHref =
    getSafeResultsHref(
      rawReturnTo,
    );

  const id =
    Number(idParam);

  if (
    !Number.isInteger(id) ||
    id < 1
  ) {
    notFound();
  }

  const selectionProcess =
    await getSelectionProcessDetailUseCase.execute(
      {
        id,
      },
    );

  if (!selectionProcess) {
    notFound();
  }
  const userSelectionProcess =
    session?.user
      ? await getUserSelectionProcessUseCase.execute({
        userId: session.user.id,
        selectionProcessId:
          selectionProcess.id,
      })
      : null;

  const processType =
    selectionProcess.isJobPool
      ? "Bolsa de trabajo"
      : "Plaza de plantilla";

  const officialStatus =
    getOfficialStatusPresentation(
      selectionProcess.status,
    );

  const applicationPeriod =
    getApplicationPeriodPresentation(
      selectionProcess.applicationStartDate,
      selectionProcess.applicationEndDate,
    );

  const processTimeline =
    buildProcessTimeline(
      selectionProcess,
    );

  const informationText =
    buildInformationText(
      selectionProcess,
    );

  const requirements =
    buildRequirements(
      selectionProcess,
    );

  const importantDates =
    buildImportantDates(
      selectionProcess,
    );

  const baseDocument =
    findBaseDocument(
      selectionProcess.documents,
    );

  const officialSources =
    buildOfficialSources(
      selectionProcess,
    );

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated={
          isAuthenticated
        }
        activeItem="convocatorias"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Detalle de convocatoria"
          user={
            session?.user
              ? {
                name:
                  session.user.name,

                email:
                  session.user.email,
              }
              : undefined
          }
        />

        <main className="flex-1 px-6 py-8 lg:px-10 lg:pb-12">
          <div className="grid w-full items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-w-0 flex-col gap-5">
              {/* Cabecera */}
              <section className="flex flex-col gap-4 pb-1">
                <Link
                  href={
                    resultsHref
                  }
                  className="inline-flex w-fit items-center gap-1.5 text-[13.5px] font-semibold text-[#4E5870] hover:text-[#3B45B5]"
                >
                  <ArrowLeft
                    size={15}
                  />

                  Volver a los
                  resultados
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Tipo de convocatoria */}
                  <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-3 text-xs font-semibold text-[#3B45B5]">
                    {
                      processType
                    }
                  </span>

                  {/* Reserva discapacidad */}
                  {selectionProcess
                    .reservedPlaces
                    .disability !==
                    null &&
                    selectionProcess
                      .reservedPlaces
                      .disability >
                    0 && (
                      <ReservationBadge>
                        Reserva
                        discapacidad ·{" "}
                        {
                          selectionProcess
                            .reservedPlaces
                            .disability
                        }{" "}
                        {selectionProcess
                          .reservedPlaces
                          .disability ===
                          1
                          ? "plaza"
                          : "plazas"}
                      </ReservationBadge>
                    )}

                  {/* Reserva personas desempleadas */}
                  {selectionProcess
                    .reservedPlaces
                    .unemployed && (
                      <ReservationBadge>
                        Reserva personas
                        desempleadas
                      </ReservationBadge>
                    )}

                  {/* Reserva jóvenes */}
                  {selectionProcess
                    .reservedPlaces
                    .youngPeople && (
                      <ReservationBadge>
                        Reserva jóvenes
                      </ReservationBadge>
                    )}

                  {/* Reserva mujeres */}
                  {selectionProcess
                    .reservedPlaces
                    .women && (
                      <ReservationBadge>
                        Reserva mujeres
                      </ReservationBadge>
                    )}

                  {/* Estado oficial */}
                  <OfficialStatusBadge
                    label={
                      officialStatus.label
                    }
                    badgeClassName={
                      officialStatus.badgeClassName
                    }
                    dotClassName={
                      officialStatus.dotClassName
                    }
                  />

                  {selectionProcess.lastDocumentPublicationDate && (
                    <span className="text-xs text-[#7C859B]">
                      Última
                      publicación:{" "}
                      {formatDate(
                        selectionProcess.lastDocumentPublicationDate,
                      )}
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="max-w-[920px] text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-[#131A2C]">
                    {formatSelectionProcessTitle(
                      selectionProcess.title,
                    )}
                  </h1>

                  <div className="mt-3 flex flex-col gap-1.5 text-[14.5px] text-[#4E5870]">
                    <div className="flex items-start gap-2">
                      <Building2
                        size={17}
                        className="mt-0.5 shrink-0 text-[#7C859B]"
                      />

                      <span>
                        {selectionProcess
                          .institution
                          ?.name ??
                          "Organismo no disponible"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin
                        size={17}
                        className="mt-0.5 shrink-0 text-[#7C859B]"
                      />

                      <span>
                        {formatLocation(
                          selectionProcess
                            .institution
                            ?.municipality,

                          selectionProcess
                            .institution
                            ?.county,

                          selectionProcess
                            .institution
                            ?.province,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Resumen */}
              <section className="grid overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-3">
                <SummaryItem
                  icon={
                    <BriefcaseBusiness
                      size={18}
                    />
                  }
                  label="Tipo"
                  value={
                    processType
                  }
                />

                <SummaryItem
                  icon={
                    <Users
                      size={18}
                    />
                  }
                  label="Plazas"
                  value={
                    selectionProcess.isJobPool
                      ? "—"
                      : selectionProcess.numberOfPositions !== null &&
                        selectionProcess.numberOfPositions > 0
                        ? String(
                          selectionProcess.numberOfPositions,
                        )
                        : "Sin definir"
                  }
                />

                <SummaryItem
                  icon={
                    <GraduationCap
                      size={18}
                    />
                  }
                  label="Grupo"
                  value={
                    selectionProcess.qualificationGroup ??
                    "No especificado"
                  }
                />

                <SummaryItem
                  icon={
                    <Building2
                      size={18}
                    />
                  }
                  label="Personal"
                  value={
                    selectionProcess.personnelType ??
                    "No especificado"
                  }
                />

                <SummaryItem
                  icon={
                    <Scale
                      size={18}
                    />
                  }
                  label="Sistema"
                  value={
                    selectionProcess.selectionSystem ??
                    "No especificado"
                  }
                />

                <SummaryItem
                  icon={
                    <MapPin
                      size={18}
                    />
                  }
                  label="Municipio"
                  value={
                    selectionProcess
                      .institution
                      ?.municipality ??
                    "No especificado"
                  }
                />
              </section>

              {/* Información */}
              <ContentSection title="Información">
                <p className="text-[14.5px] leading-7 text-[#4E5870]">
                  {
                    informationText
                  }
                </p>

                {selectionProcess.observations && (
                  <div className="mt-4 flex gap-3 rounded-lg bg-[#F4F6F9] px-4 py-3 text-sm leading-6 text-[#4E5870]">
                    <Info
                      size={17}
                      className="mt-0.5 shrink-0 text-[#7C859B]"
                    />

                    <span>
                      {
                        selectionProcess.observations
                      }
                    </span>
                  </div>
                )}
              </ContentSection>

              {/* Requisitos */}
              <ContentSection title="Requisitos">
                {requirements.length >
                  0 ? (
                  <ul className="flex flex-col gap-3">
                    {requirements.map(
                      (
                        requirement,
                        index,
                      ) => (
                        <li
                          key={`${requirement}-${index}`}
                          className="flex gap-3 text-[14.5px] leading-6 text-[#131A2C]"
                        >
                          <span className="mt-0.5 inline-flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] text-[#4F5BD5]">
                            <Check
                              size={12}
                              strokeWidth={
                                2
                              }
                            />
                          </span>

                          <span>
                            {
                              requirement
                            }
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-[#69738A]">
                    No hay información
                    estructurada de
                    requisitos.
                    Consulta las bases
                    oficiales.
                  </p>
                )}
              </ContentSection>

              {/* Cronología */}
              <ContentSection title="Cronología del proceso">
                {processTimeline.length >
                  0 ? (
                  <ol className="flex flex-col">
                    {processTimeline.map(
                      (
                        step,
                        index,
                      ) => (
                        <ProcessStep
                          key={
                            step.key
                          }
                          step={
                            step
                          }
                          isLast={
                            index ===
                            processTimeline.length -
                            1
                          }
                        />
                      ),
                    )}
                  </ol>
                ) : (
                  <p className="text-sm text-[#69738A]">
                    Todavía no hay
                    hitos publicados
                    para este proceso.
                  </p>
                )}
              </ContentSection>

              {/* Fechas importantes */}
              <ContentSection title="Fechas importantes">
                {importantDates.length >
                  0 ? (
                  <ul className="flex flex-col">
                    {importantDates.map(
                      (
                        importantDate,
                      ) => (
                        <li
                          key={`${importantDate.label}-${importantDate.value}`}
                          className="flex flex-col gap-1 border-t border-[#EEF1F5] py-3 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#131A2C]">
                              {
                                importantDate.label
                              }
                            </p>

                            <p className="mt-0.5 text-sm text-[#4E5870]">
                              {
                                importantDate.value
                              }
                            </p>
                          </div>

                          <DateState
                            state={
                              importantDate.state
                            }
                          />
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-[#69738A]">
                    No hay fechas
                    adicionales
                    disponibles.
                  </p>
                )}
              </ContentSection>

              {/* Documentos */}
              <ContentSection
                title={`Documentos oficiales (${selectionProcess.documents.length})`}
              >
                {selectionProcess.documents.length >
                  0 ? (
                  <ul className="flex flex-col">
                    {selectionProcess.documents.map(
                      (
                        document,
                        index,
                      ) => (
                        <li
                          key={
                            document.id
                          }
                          className={`flex flex-col gap-3 py-4 first:pt-0 last:pb-0 ${index > 0
                            ? "border-t border-[#EEF1F5]"
                            : ""
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF0FC] text-[#3B45B5]">
                              <FileText
                                size={19}
                              />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-[#F4F6F9] px-2 py-1 text-[11.5px] font-semibold text-[#4E5870]">
                                  {
                                    document.phase
                                  }
                                </span>

                                <span className="text-xs text-[#7C859B]">
                                  {formatDate(
                                    document.publicationDate,
                                  )}
                                </span>
                              </div>

                              <p className="mt-2 text-[14.5px] font-semibold leading-6 text-[#131A2C]">
                                {buildDocumentTitle(
                                  document,
                                )}
                              </p>

                              {buildDocumentMetadata(
                                document,
                              ) && (
                                  <p className="mt-1 text-[13px] text-[#7C859B]">
                                    {buildDocumentMetadata(
                                      document,
                                    )}
                                  </p>
                                )}

                              {document.phaseNotes && (
                                <p className="mt-2 text-sm leading-6 text-[#4E5870]">
                                  {
                                    document.phaseNotes
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:pl-[52px]">
                            <a
                              href={
                                document.documentUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-[13px] font-semibold text-[#131A2C] hover:bg-[#F4F6F9]"
                            >
                              Abrir
                              documento

                              <ExternalLink
                                size={14}
                              />
                            </a>

                            {document.htmlUrl && (
                              <a
                                href={
                                  document.htmlUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-[13px] font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                              >
                                Ver publicación
                                HTML

                                <ExternalLink
                                  size={14}
                                />
                              </a>
                            )}
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-[#69738A]">
                    No hay documentos
                    oficiales
                    asociados.
                  </p>
                )}
              </ContentSection>

              {/* Fuentes oficiales */}
              <ContentSection title="Fuentes oficiales">
                {officialSources.length >
                  0 ? (
                  <ul className="flex flex-col gap-2">
                    {officialSources.map(
                      (
                        source,
                      ) => (
                        <li
                          key={`${source.type}-${source.url}`}
                        >
                          <a
                            href={
                              source.url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-[#E3E7EE] bg-[#FAFBFC] px-4 py-3 text-[#131A2C] hover:bg-[#F4F6F9]"
                          >
                            <SourceIcon
                              type={
                                source.type
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {
                                  source.title
                                }
                              </p>

                              <p className="truncate text-[13px] text-[#3B45B5]">
                                {
                                  source.host
                                }
                              </p>
                            </div>

                            <ExternalLink
                              size={15}
                              className="shrink-0 text-[#7C859B]"
                            />
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-[#69738A]">
                    No hay fuentes
                    adicionales
                    disponibles.
                  </p>
                )}

                <div className="mt-4 flex gap-2.5 rounded-lg bg-[#F1F3F7] px-4 py-3 text-[13px] leading-5 text-[#4E5870]">
                  <Info
                    size={16}
                    className="mt-0.5 shrink-0 text-[#7C859B]"
                  />

                  <span>
                    Convoca&apos;m
                    recoge y organiza
                    información
                    pública. Antes de
                    presentar la
                    solicitud, consulta
                    siempre las fuentes
                    oficiales.
                  </span>
                </div>
              </ContentSection>
            </div>

            {/* Columna derecha */}
            <aside
              aria-label="Resumen y acciones"
              className="flex flex-col gap-4 xl:sticky xl:top-6"
            >
              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
                      Estado oficial
                    </p>

                    <OfficialStatusBadge
                      label={
                        officialStatus.label
                      }
                      badgeClassName={
                        officialStatus.badgeClassName
                      }
                      dotClassName={
                        officialStatus.dotClassName
                      }
                    />
                  </div>

                  <div className="h-px bg-[#EEF1F5]" />

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
                        Plazo de
                        inscripción
                      </p>

                      <ApplicationPeriodBadge
                        label={
                          applicationPeriod.label
                        }
                        badgeClassName={
                          applicationPeriod.badgeClassName
                        }
                        dotClassName={
                          applicationPeriod.dotClassName
                        }
                      />
                    </div>

                    <p className="text-[16px] font-semibold text-[#131A2C]">
                      {formatDateRange(
                        selectionProcess.applicationStartDate,
                        selectionProcess.applicationEndDate,
                      )}
                    </p>

                    {selectionProcess.applicationStartDate &&
                      selectionProcess.applicationEndDate && (
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF1F5]">
                          <div
                            className={`h-full rounded-full ${applicationPeriod.progressClassName}`}
                            style={{
                              width: `${applicationPeriod.progress}%`,
                            }}
                          />
                        </div>
                      )}

                    <p className="text-[19px] font-semibold tracking-[-0.02em] text-[#131A2C]">
                      {
                        applicationPeriod.detail
                      }
                    </p>

                    {selectionProcess.applicationEndTime && (
                      <SidebarValue
                        label="Hora límite"
                        value={
                          selectionProcess.applicationEndTime
                        }
                      />
                    )}

                    {selectionProcess.applicationDeadlineNotes && (
                      <div className="rounded-lg bg-[#FFF8E8] px-3 py-2.5 text-[12.5px] leading-5 text-[#7B5B12]">
                        {
                          selectionProcess.applicationDeadlineNotes
                        }
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-center text-xs text-[#7C859B]">
                      {!session?.user ? (
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/login?returnTo=${encodeURIComponent(
                              `/convocatorias/${selectionProcess.id}`,
                            )}`}
                            className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#4F5BD5] px-5 text-[15px] font-semibold text-white hover:bg-[#3B45B5]"
                          >
                            Seguir convocatoria
                          </Link>

                          <p className="text-center text-[12.5px] text-[#7C859B]">
                            Inicia sesión para guardar esta convocatoria.
                          </p>
                        </div>
                      ) : userSelectionProcess ? (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled
                            className="flex h-12 w-full items-center justify-center rounded-[10px] border border-[#DDE1FA] bg-[#EEF0FC] px-5 text-[15px] font-semibold text-[#3B45B5]"
                          >
                            Siguiendo
                          </button>

                          <div className="flex items-center justify-center gap-1 text-[12.5px] text-[#7C859B]">
                            <span>
                              Guardada en Mis convocatorias ·
                            </span>

                            <form action={unfollowSelectionProcessAction}>
                              <input
                                type="hidden"
                                name="selectionProcessId"
                                value={selectionProcess.id}
                              />

                              <button
                                type="submit"
                                className="font-medium text-[#3B45B5] hover:underline"
                              >
                                Dejar de seguir
                              </button>
                            </form>
                          </div>
                        </div>
                      ) : (
                        <form
                          action={followSelectionProcessAction}
                          className="flex flex-col gap-2"
                        >
                          <input
                            type="hidden"
                            name="selectionProcessId"
                            value={selectionProcess.id}
                          />

                          <button
                            type="submit"
                            className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#4F5BD5] px-5 text-[15px] font-semibold text-white hover:bg-[#3B45B5]"
                          >
                            Seguir convocatoria
                          </button>

                          <p className="text-center text-[12.5px] text-[#7C859B]">
                            Se guardará en Mis convocatorias.
                          </p>
                        </form>
                      )}
                    </div>
                  </div>

                  {selectionProcess.applicationUrl && (
                    <a
                      href={
                        selectionProcess.applicationUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#4F5BD5] px-4 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                    >
                      Presentar
                      solicitud

                      <ExternalLink
                        size={16}
                      />
                    </a>
                  )}

                  {baseDocument && (
                    <a
                      href={
                        baseDocument.documentUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#131A2C] hover:bg-[#F4F6F9]"
                    >
                      Abrir las bases

                      <ExternalLink
                        size={16}
                      />
                    </a>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
                      Mi estado
                    </p>

                    <span className="inline-flex items-center gap-1 text-xs text-[#7C859B]">
                      <Lock
                        size={12}
                      />
{userSelectionProcess ? (
  <div className="flex flex-col gap-4">
    <div>
      <p className="text-[12.5px] font-medium text-[#7C859B]">
        Estado actual
      </p>

      <p className="mt-1 text-base font-semibold text-[#3B45B5]">
        {getPersonalSelectionProcessStatusLabel(
          userSelectionProcess.personalStatus,
        )}
      </p>
    </div>

    <div className="flex flex-col gap-1.5">
      {PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS.map(
        (status) => {
          const isCurrent =
            status ===
            userSelectionProcess.personalStatus;

          return (
            <form
              key={status}
              action={changePersonalStatusAction}
            >
              <input
                type="hidden"
                name="selectionProcessId"
                value={selectionProcess.id}
              />

              <input
                type="hidden"
                name="personalStatus"
                value={status}
              />

              <button
                type="submit"
                disabled={isCurrent}
                className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${
                  isCurrent
                    ? "bg-[#EEF0FC] font-semibold text-[#3B45B5]"
                    : "text-[#4E5870] hover:bg-[#F4F6F9]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isCurrent
                      ? "border-[#4F5BD5] bg-[#4F5BD5] text-white"
                      : "border-[#D5DAE3] bg-white text-[#7C859B]"
                  }`}
                >
                  {isCurrent ? "✓" : ""}
                </span>

                {getPersonalSelectionProcessStatusLabel(
                  status,
                )}
              </button>
            </form>
          );
        },
      )}
    </div>

    <p className="text-[12.5px] leading-relaxed text-[#7C859B]">
      Este estado es personal y solo lo ves tú.
      No modifica el estado oficial de la convocatoria.
    </p>
  </div>
) : (
                        <p className="text-[13.5px] leading-relaxed text-[#4E5870]">
                          Sigue la convocatoria para indicar en qué punto estás.
                          Tu estado personal no modifica el estado oficial.
                        </p>
                      )}
                    </span>
                  </div>

                  <p className="text-[13.5px] leading-6 text-[#4E5870]">
                    Sigue la
                    convocatoria para
                    anotar en qué
                    punto estás:
                    desde{" "}
                    <strong className="font-semibold text-[#131A2C]">
                      Me interesa
                    </strong>{" "}
                    hasta{" "}
                    <strong className="font-semibold text-[#131A2C]">
                      Finalizado
                    </strong>
                    . No modifica el
                    estado oficial.
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex flex-col gap-3 p-5">
                  <SidebarValue
                    label="Referencia CIDO"
                    value={
                      selectionProcess.cidoIdentifier
                    }
                  />

                  {selectionProcess.fileNumber && (
                    <SidebarValue
                      label="Expediente"
                      value={
                        selectionProcess.fileNumber
                      }
                    />
                  )}

                  <a
                    href={
                      selectionProcess.cidoUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B45B5] hover:underline"
                  >
                    Ver ficha en CIDO

                    <ExternalLink
                      size={14}
                    />
                  </a>
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * COMPONENTES
 * ============================================================
 */

function ContentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white px-6 py-5 shadow-sm">
      <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.01em] text-[#131A2C]">
        {title}
      </h2>

      {children}
    </section>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 border-b border-r border-[#EEF1F5] px-5 py-4">
      <span className="mt-0.5 shrink-0 text-[#7C859B]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
          {label}
        </p>

        <p className="mt-1 break-words text-[14px] font-semibold leading-5 text-[#131A2C]">
          {value}
        </p>
      </div>
    </div>
  );
}

/*
 * Badge reservado para condiciones
 * especiales de acceso.
 *
 * Utiliza un tono violeta para no
 * confundirse con el tipo, el estado
 * oficial o el plazo.
 */
function ReservationBadge({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 text-xs font-semibold text-[#6D28D9]">
      {children}
    </span>
  );
}

function OfficialStatusBadge({
  label,
  badgeClassName,
  dotClassName,
}: {
  label: string;
  badgeClassName: string;
  dotClassName: string;
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${badgeClassName}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`}
      />

      {label}
    </span>
  );
}

function ApplicationPeriodBadge({
  label,
  badgeClassName,
  dotClassName,
}: {
  label: string;
  badgeClassName: string;
  dotClassName: string;
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${badgeClassName}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`}
      />

      {label}
    </span>
  );
}

function ProcessStep({
  step,
  isLast,
}: {
  step: ProcessTimelineStep;
  isLast: boolean;
}) {
  const isCompleted =
    step.state ===
    "completed";

  const isCurrent =
    step.state ===
    "current" ||
    step.state ===
    "current-known";

  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!isLast && (
        <span className="absolute left-[14px] top-8 h-[calc(100%-20px)] w-px bg-[#DDE1E8]" />
      )}

      <span
        className={`relative z-10 mt-0.5 inline-flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full border text-xs font-bold ${isCompleted
          ? "border-[#4F5BD5] bg-[#4F5BD5] text-white"
          : isCurrent
            ? "border-[#4F5BD5] bg-[#EEF0FC] text-[#3B45B5]"
            : "border-[#D5DAE3] bg-white text-[#7C859B]"
          }`}
      >
        {isCompleted ? (
          <Check
            size={14}
          />
        ) : (
          "•"
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-semibold text-[#131A2C]">
            {
              step.title
            }
          </p>

          {step.state ===
            "current" && (
              <span className="rounded-full bg-[#EEF0FC] px-2 py-0.5 text-[11.5px] font-semibold text-[#3B45B5]">
                Actual
              </span>
            )}

          {step.state ===
            "current-known" && (
              <span className="rounded-full bg-[#FFF4DB] px-2 py-0.5 text-[11.5px] font-semibold text-[#9A6700]">
                Último hito conocido
              </span>
            )}
        </div>

        {step.detail && (
          <p className="mt-1 text-sm leading-5 text-[#4E5870]">
            {
              step.detail
            }
          </p>
        )}

        {step.date && (
          <p className="mt-1 text-xs font-medium text-[#7C859B]">
            {formatDate(
              step.date,
            )}
          </p>
        )}
      </div>
    </li>
  );
}

function DateState({
  state,
}: {
  state:
  ImportantDate["state"];
}) {
  if (
    state ===
    "today"
  ) {
    return (
      <span className="w-fit rounded-full bg-[#FDECEC] px-2.5 py-1 text-xs font-semibold text-[#B42318]">
        Hoy
      </span>
    );
  }

  if (
    state ===
    "future"
  ) {
    return (
      <span className="w-fit rounded-full bg-[#EEF0FC] px-2.5 py-1 text-xs font-semibold text-[#3B45B5]">
        Próxima
      </span>
    );
  }

  if (
    state ===
    "past"
  ) {
    return (
      <span className="w-fit rounded-full bg-[#EFF1F4] px-2.5 py-1 text-xs font-semibold text-[#69738A]">
        Finalizada
      </span>
    );
  }

  return (
    <span className="w-fit rounded-full bg-[#F4F6F9] px-2.5 py-1 text-xs font-semibold text-[#7C859B]">
      Sin determinar
    </span>
  );
}

function SourceIcon({
  type,
}: {
  type:
  OfficialSourceType;
}) {
  if (
    type ===
    "institution"
  ) {
    return (
      <Building2
        size={18}
        className="shrink-0 text-[#4E5870]"
      />
    );
  }

  if (
    type ===
    "application"
  ) {
    return (
      <FileText
        size={18}
        className="shrink-0 text-[#4E5870]"
      />
    );
  }

  if (
    type ===
    "cido"
  ) {
    return (
      <BriefcaseBusiness
        size={18}
        className="shrink-0 text-[#4E5870]"
      />
    );
  }

  return (
    <FileText
      size={18}
      className="shrink-0 text-[#4E5870]"
    />
  );
}

function SidebarValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[#131A2C]">
        {value}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * CRONOLOGÍA
 * ============================================================
 */

function buildProcessTimeline(
  selectionProcess:
    SelectionProcessDetailDto,
): ProcessTimelineStep[] {
  const steps:
    ProcessTimelineStep[] =
    [];

  const documentGroups =
    groupDocumentsByPhase(
      selectionProcess.documents,
    );

  for (
    const group of documentGroups
  ) {
    const latestDocument =
      group.documents[0];

    steps.push({
      key:
        `document-${group.key}`,

      title:
        group.title,

      detail:
        buildTimelineDocumentDetail(
          group.documents,
        ),

      date:
        latestDocument
          ?.publicationDate ??
        null,

      state:
        "unknown",
    });
  }

  if (
    selectionProcess.applicationStartDate
  ) {
    steps.push({
      key:
        "application-start",

      title:
        "Inicio del plazo de solicitudes",

      detail:
        null,

      date:
        selectionProcess.applicationStartDate,

      state:
        "unknown",
    });
  }

  if (
    selectionProcess.applicationEndDate
  ) {
    steps.push({
      key:
        "application-end",

      title:
        "Fin del plazo de solicitudes",

      detail:
        selectionProcess.applicationEndTime
          ? `Hora límite: ${selectionProcess.applicationEndTime}`
          : null,

      date:
        selectionProcess.applicationEndDate,

      state:
        "unknown",
    });
  }

  if (
    selectionProcess.firstExamDate
  ) {
    steps.push({
      key:
        "first-exam",

      title:
        "Primera prueba",

      detail:
        null,

      date:
        selectionProcess.firstExamDate,

      state:
        "unknown",
    });
  }

  steps.sort(
    (
      first,
      second,
    ) => {
      if (
        !first.date &&
        !second.date
      ) {
        return 0;
      }

      if (!first.date) {
        return 1;
      }

      if (!second.date) {
        return -1;
      }

      return (
        first.date.getTime() -
        second.date.getTime()
      );
    },
  );

  const today =
    getTodayInMadridDayNumber();

  let hasCurrent =
    false;

  for (
    const step of steps
  ) {
    if (!step.date) {
      step.state =
        "unknown";

      continue;
    }

    const day =
      getDateDayNumber(
        step.date,
      );

    if (
      day === null
    ) {
      step.state =
        "unknown";

      continue;
    }

    if (
      day < today
    ) {
      step.state =
        "completed";

      continue;
    }

    if (
      day === today
    ) {
      step.state =
        "current";

      hasCurrent =
        true;

      continue;
    }

    step.state =
      "future";
  }

  if (!hasCurrent) {
    for (
      let index =
        steps.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (
        steps[index].state ===
        "completed"
      ) {
        steps[index].state =
          "current-known";

        break;
      }
    }
  }

  return steps;
}

function groupDocumentsByPhase(
  documents:
    SelectionProcessDetailDto["documents"],
) {
  const groups =
    new Map<
      string,
      {
        key: string;
        title: string;
        documents:
        SelectionProcessDetailDto["documents"];
      }
    >();

  for (
    const document of documents
  ) {
    const key =
      normalizeTimelineKey(
        document.phase,
      );

    const existing =
      groups.get(key);

    if (existing) {
      existing.documents.push(
        document,
      );

      continue;
    }

    groups.set(
      key,
      {
        key,

        title:
          document.phase,

        documents: [
          document,
        ],
      },
    );
  }

  for (
    const group of groups.values()
  ) {
    group.documents.sort(
      (
        first,
        second,
      ) =>
        second.publicationDate.getTime() -
        first.publicationDate.getTime(),
    );
  }

  return [
    ...groups.values(),
  ];
}

function buildTimelineDocumentDetail(
  documents:
    SelectionProcessDetailDto["documents"],
): string | null {
  if (
    documents.length ===
    0
  ) {
    return null;
  }

  if (
    documents.length ===
    1
  ) {
    return (
      documents[0].summary ||
      documents[0].phaseNotes ||
      null
    );
  }

  return `${documents.length} publicaciones oficiales`;
}

function normalizeTimelineKey(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " ",
    );
}

/*
 * ============================================================
 * INFORMACIÓN
 * ============================================================
 */

function buildInformationText(
  selectionProcess:
    SelectionProcessDetailDto,
): string {
  const parts:
    string[] =
    [];

  parts.push(
    selectionProcess.isJobPool
      ? "La convocatoria corresponde a una bolsa de trabajo."
      : selectionProcess.numberOfPositions !==
        null
        ? `La convocatoria ofrece ${selectionProcess.numberOfPositions} plaza${selectionProcess.numberOfPositions ===
          1
          ? ""
          : "s"
        }.`
        : "La convocatoria corresponde a un proceso de selección de personal.",
  );

  if (
    selectionProcess.personnelType
  ) {
    parts.push(
      `El tipo de personal indicado es ${selectionProcess.personnelType}.`,
    );
  }

  if (
    selectionProcess.selectionSystem
  ) {
    parts.push(
      `El sistema de selección es ${selectionProcess.selectionSystem}.`,
    );
  }

  if (
    selectionProcess.scope
  ) {
    parts.push(
      `El ámbito de la convocatoria es ${selectionProcess.scope}.`,
    );
  }

  return parts.join(
    " ",
  );
}

function buildRequirements(
  selectionProcess:
    SelectionProcessDetailDto,
): string[] {
  const requirements:
    string[] =
    [];

  if (
    selectionProcess.requiredQualification
  ) {
    requirements.push(
      selectionProcess.requiredQualification,
    );
  }

  if (
    selectionProcess.otherRequirements
  ) {
    requirements.push(
      selectionProcess.otherRequirements,
    );
  }

  if (
    selectionProcess.qualificationGroup
  ) {
    requirements.push(
      `Grupo de titulación: ${selectionProcess.qualificationGroup}.`,
    );
  }

  return [
    ...new Set(
      requirements,
    ),
  ];
}

/*
 * ============================================================
 * FECHAS
 * ============================================================
 */

function buildImportantDates(
  selectionProcess:
    SelectionProcessDetailDto,
): ImportantDate[] {
  const dates:
    ImportantDate[] =
    [];

  if (
    selectionProcess.applicationStartDate
  ) {
    dates.push({
      label:
        "Inicio de solicitudes",

      value:
        formatDate(
          selectionProcess.applicationStartDate,
        ),

      state:
        getImportantDateState(
          selectionProcess.applicationStartDate,
        ),
    });
  }

  if (
    selectionProcess.applicationEndDate
  ) {
    dates.push({
      label:
        "Fin de solicitudes",

      value:
        selectionProcess.applicationEndTime
          ? `${formatDate(
            selectionProcess.applicationEndDate,
          )} · ${selectionProcess.applicationEndTime}`
          : formatDate(
            selectionProcess.applicationEndDate,
          ),

      state:
        getImportantDateState(
          selectionProcess.applicationEndDate,
        ),
    });
  }

  if (
    selectionProcess.firstExamDate
  ) {
    dates.push({
      label:
        "Primera prueba",

      value:
        formatDate(
          selectionProcess.firstExamDate,
        ),

      state:
        getImportantDateState(
          selectionProcess.firstExamDate,
        ),
    });
  }

  if (
    selectionProcess.lastDocumentPublicationDate
  ) {
    dates.push({
      label:
        "Última publicación oficial",

      value:
        formatDate(
          selectionProcess.lastDocumentPublicationDate,
        ),

      state:
        getImportantDateState(
          selectionProcess.lastDocumentPublicationDate,
        ),
    });
  }

  return dates;
}

function getImportantDateState(
  date: Date,
): ImportantDate["state"] {
  const day =
    getDateDayNumber(
      date,
    );

  if (
    day === null
  ) {
    return "unknown";
  }

  const today =
    getTodayInMadridDayNumber();

  if (
    day < today
  ) {
    return "past";
  }

  if (
    day === today
  ) {
    return "today";
  }

  return "future";
}

/*
 * ============================================================
 * DOCUMENTOS
 * ============================================================
 */

function findBaseDocument(
  documents:
    SelectionProcessDetailDto["documents"],
) {
  const candidates =
    documents.filter(
      (
        document,
      ) => {
        const searchable =
          [
            document.phase,
            document.summary,
            document.phaseNotes ??
            "",
          ]
            .join(" ")
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              "",
            )
            .toLowerCase();

        return (
          searchable.includes(
            "base",
          ) ||
          searchable.includes(
            "bases",
          )
        );
      },
    );

  candidates.sort(
    (
      first,
      second,
    ) =>
      second.publicationDate.getTime() -
      first.publicationDate.getTime(),
  );

  return (
    candidates[0] ??
    null
  );
}

function buildDocumentTitle(
  document:
    SelectionProcessDetailDto["documents"][number],
): string {
  if (
    document.summary
  ) {
    return document.summary;
  }

  if (
    document.phaseNotes
  ) {
    return document.phaseNotes;
  }

  return document.phase;
}

function buildDocumentMetadata(
  document:
    SelectionProcessDetailDto["documents"][number],
): string {
  const parts:
    string[] =
    [];

  if (
    document.publisher
  ) {
    parts.push(
      document.publisher,
    );
  }

  if (
    document.bulletin
  ) {
    parts.push(
      document.bulletinNumber !==
        null
        ? `${document.bulletin} ${document.bulletinNumber}`
        : document.bulletin,
    );
  }

  return parts.join(
    " · ",
  );
}

/*
 * ============================================================
 * FUENTES
 * ============================================================
 */

function buildOfficialSources(
  selectionProcess:
    SelectionProcessDetailDto,
): OfficialSource[] {
  const sources:
    OfficialSource[] =
    [];

  const seenUrls =
    new Set<string>();

  const publicationHosts =
    new Set<string>();

  function addSource(
    source:
      OfficialSource,
  ) {
    if (
      seenUrls.has(
        source.url,
      )
    ) {
      return;
    }

    seenUrls.add(
      source.url,
    );

    sources.push(
      source,
    );
  }

  if (
    selectionProcess.institutionUrl
  ) {
    addSource({
      type:
        "institution",

      title:
        selectionProcess
          .institution
          ?.name ??
        "Sede del organismo",

      url:
        selectionProcess.institutionUrl,

      host:
        getHostname(
          selectionProcess.institutionUrl,
        ),
    });
  }

  if (
    selectionProcess.applicationUrl
  ) {
    addSource({
      type:
        "application",

      title:
        "Presentación de solicitudes",

      url:
        selectionProcess.applicationUrl,

      host:
        getHostname(
          selectionProcess.applicationUrl,
        ),
    });
  }

  addSource({
    type:
      "cido",

    title:
      "CIDO — Diputació de Barcelona",

    url:
      selectionProcess.cidoUrl,

    host:
      getHostname(
        selectionProcess.cidoUrl,
      ),
  });

  for (
    const document of selectionProcess.documents
  ) {
    if (
      !document.htmlUrl
    ) {
      continue;
    }

    const host =
      getHostname(
        document.htmlUrl,
      );

    if (
      publicationHosts.has(
        host,
      )
    ) {
      continue;
    }

    publicationHosts.add(
      host,
    );

    addSource({
      type:
        "publication",

      title:
        document.bulletin ||
        document.publisher ||
        "Publicación oficial",

      url:
        document.htmlUrl,

      host,
    });
  }

  return sources;
}

/*
 * ============================================================
 * FORMATO
 * ============================================================
 */

function getDateDayNumber(
  date:
    | Date
    | null
    | undefined,
): number | null {
  if (!date) {
    return null;
  }

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return Math.floor(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ) /
    86_400_000,
  );
}

function getTodayInMadridDayNumber(): number {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Europe/Madrid",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(),
    );

  const year =
    Number(
      parts.find(
        (
          part,
        ) =>
          part.type ===
          "year",
      )?.value,
    );

  const month =
    Number(
      parts.find(
        (
          part,
        ) =>
          part.type ===
          "month",
      )?.value,
    );

  const day =
    Number(
      parts.find(
        (
          part,
        ) =>
          part.type ===
          "day",
      )?.value,
    );

  return Math.floor(
    Date.UTC(
      year,
      month - 1,
      day,
    ) /
    86_400_000,
  );
}

function formatDate(
  date:
    | Date
    | null
    | undefined,
): string {
  if (!date) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      timeZone:
        "UTC",
    },
  ).format(
    date,
  );
}

function formatDateRange(
  startDate:
    | Date
    | null,

  endDate:
    | Date
    | null,
): string {
  if (
    startDate &&
    endDate
  ) {
    return `${formatDate(
      startDate,
    )} – ${formatDate(
      endDate,
    )}`;
  }

  if (
    startDate
  ) {
    return `Desde ${formatDate(
      startDate,
    )}`;
  }

  if (
    endDate
  ) {
    return `Hasta ${formatDate(
      endDate,
    )}`;
  }

  return "Fechas no disponibles";
}

function formatLocation(
  municipality:
    | string
    | null
    | undefined,

  county:
    | string
    | null
    | undefined,

  province:
    | string
    | null
    | undefined,
): string {
  const values = [
    municipality,
    county,
    province,
  ].filter(
    (
      value,
    ): value is string =>
      typeof value ===
      "string" &&
      value.length > 0,
  );

  return values.length >
    0
    ? values.join(
      " · ",
    )
    : "Ubicación no disponible";
}

function getHostname(
  url: string,
): string {
  try {
    return new URL(
      url,
    ).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return url;
  }
}

/*
 * ============================================================
 * RETURN TO
 * ============================================================
 */

function getSafeResultsHref(
  returnTo:
    string | undefined,
): string {
  if (!returnTo) {
    return "/convocatorias";
  }

  if (
    returnTo ===
    "/convocatorias" ||
    returnTo.startsWith(
      "/convocatorias?",
    )
  ) {
    return returnTo;
  }

  return "/convocatorias";
}