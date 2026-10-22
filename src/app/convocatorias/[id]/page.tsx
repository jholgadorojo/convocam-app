import type { ReactNode } from "react";

import Link from "next/link";

import { headers } from "next/headers";

import { notFound } from "next/navigation";

import {

  ArrowLeft,

  Building2,

  CalendarDays,

  ExternalLink,

  FileText,

  GraduationCap,

  MapPin,

  Users,

} from "lucide-react";

import { auth } from "@/lib/auth";

import { AppHeader } from "@/components/layout/app-header";

import { AppSidebar } from "@/components/layout/app-sidebar";

import { getSelectionProcessDetailUseCase } from "@/composition/selection-process";

import { getUserSelectionProcessUseCase } from "@/composition/user-selection-process";

import {

  getApplicationPeriodPresentation,

  getOfficialStatusPresentation,

} from "@/modules/selection-process/presentation/selection-process-status";

import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";

import { PersonalSelectionProcessStatusPicker } from "@/modules/user-selection-process/presentation/personal-selection-process-status-picker";

import { UnfollowSelectionProcessForm } from "@/modules/user-selection-process/presentation/unfollow-selection-process-form";

import {

  changePersonalStatusAction,

  followSelectionProcessAction,

  unfollowSelectionProcessAction,

} from "./actions";

/* ============================================================

*   TYPES

*============================================================ */

type SelectionProcessDetailPageProps = {

  params: Promise<{

    id: string;

  }>;

  searchParams: Promise<{

    returnTo?: string | string[];

  }>;

};

type TimelineStatus =

  | "completed"

  | "current"

  | "current-known"

  | "future"

  | "unknown";

type TimelineItem = {

  key: string;

  title: string;

  description?: string;

  date: Date;

  status: TimelineStatus;

};

type ImportantDate = {

  label: string;

  date: Date;

};

type OfficialSource = {

  label: string;

  url: string;

  description?: string;

};

/* ============================================================

*   PAGE

*============================================================ */

export default async function SelectionProcessDetailPage({

  params,

  searchParams,

}: SelectionProcessDetailPageProps) {

  const { id: idParam } =

    await params;

  const parsedId =

    Number(idParam);

  if (

    !Number.isInteger(parsedId) ||

    parsedId <= 0

  ) {

    notFound();

  }

  const selectionProcess =

    await getSelectionProcessDetailUseCase.execute({

      id: parsedId,

    });

  if (!selectionProcess) {

    notFound();

  }

  const session =

    await auth.api.getSession({

      headers: await headers(),

    });

  const isAuthenticated =

    Boolean(session?.user);

  const userSelectionProcess =

    session?.user

      ? await getUserSelectionProcessUseCase.execute({

        userId:

          session.user.id,

        selectionProcessId:

          selectionProcess.id,

      })

      : null;

  const resolvedSearchParams =

    await searchParams;

  const resultsHref =

    getSafeResultsHref(

      resolvedSearchParams.returnTo,

    );

  const activeSidebarItem =
    resultsHref === "/dashboard" ||
      resultsHref.startsWith("/dashboard?")
      ? "dashboard"
      : resultsHref === "/para-mi" ||
        resultsHref.startsWith("/para-mi?")
        ? "para-mi"
        : resultsHref === "/mis-convocatorias" ||
          resultsHref.startsWith("/mis-convocatorias?")
          ? "mis-convocatorias"
          : "convocatorias";

  const detailHref =

    `/convocatorias/${selectionProcess.id}` +

    `?returnTo=${encodeURIComponent(

      resultsHref,

    )}`;

  const officialStatus =

    getOfficialStatusPresentation(

      selectionProcess.status,

    );

  const applicationPeriod =

    getApplicationPeriodPresentation(

      selectionProcess.applicationStartDate,

      selectionProcess.applicationEndDate,

    );

  const timeline =

    buildTimeline(

      selectionProcess,

    );

  const importantDates =

    buildImportantDates(

      selectionProcess,

    );

  const requirements =

    buildRequirements(

      selectionProcess,

    );

  const information =

    buildInformation(

      selectionProcess,

    );

  const officialSources =

    buildOfficialSources(

      selectionProcess,

    );

  const basesDocument =

    findBasesDocument(

      selectionProcess.documents,

    );

  const hasReservedPlaces =

    hasReservations(

      selectionProcess.reservedPlaces,

    );

  const applicationProgress =

    calculateApplicationProgress(

      selectionProcess.applicationStartDate,

      selectionProcess.applicationEndDate,

    );

  return (

    <div className="flex min-h-screen bg-[#F4F6F9]">

      <AppSidebar

        isAuthenticated={

          isAuthenticated

        }

        activeItem={activeSidebarItem}

      />

      <div className="flex min-w-0 flex-1 flex-col">

        <AppHeader

          title="Detalle de convocatoria"

          user={

            session?.user

              ? {

                name:

                  session.user

                    .name,

                email:

                  session.user

                    .email,

              }

              : undefined

          }

        />

        <main className="flex-1 px-4 py-8 lg:px-6 lg:pb-12">

          <div className="grid w-full items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

            {/* ==================================================

*                COLUMNA PRINCIPAL

*            ================================================== */}

            <div className="min-w-0">

              {/* ================================================

*                  VOLVER

*              ================================================ */}

              <Link

                href={

                  resultsHref

                }

                className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3B45B5] hover:text-[#2E3794]"

              >

                <ArrowLeft

                  size={16}

                />

                {resultsHref === "/dashboard" ||
                resultsHref.startsWith("/dashboard?")
                  ? "Volver al dashboard"
                  : "Volver a los resultados"}
                  
              </Link>

              {/* ================================================

*                  CABECERA

*              ================================================ */}

              <section className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm">

                <div className="p-6">

                  {/* Badges */}

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-3 text-xs font-semibold text-[#3B45B5]">

                      {selectionProcess.isJobPool

                        ? "Bolsa de trabajo"

                        : "Plaza de plantilla"}

                    </span>

                    <span

                      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${officialStatus.badgeClassName}`}

                    >

                      <span

                        className={`h-1.5 w-1.5 rounded-full ${officialStatus.dotClassName}`}

                      />

                      Estado oficial:{" "}

                      {

                        officialStatus.label

                      }

                    </span>

                    {selectionProcess.lastDocumentPublicationDate && (

                      <span className="inline-flex min-h-7 items-center rounded-full border border-[#E3E7EE] bg-[#F7F8FA] px-3 text-xs font-medium text-[#69738A]">

                        Última publicación:{" "}

                        {formatDate(

                          selectionProcess.lastDocumentPublicationDate,

                        )}

                      </span>

                    )}

                  </div>

                  {/* Título */}

                  <h1 className="mt-5 max-w-[900px] text-[28px] font-semibold leading-tight tracking-[-0.025em] text-[#131A2C]">

                    {formatSelectionProcessTitle(

                      selectionProcess.title,

                    )}

                  </h1>

                  {/* Organismo */}

                  <div className="mt-5 flex flex-col gap-2 text-sm text-[#4E5870]">

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

                            .institution,

                        )}

                      </span>

                    </div>

                  </div>

                </div>

              </section>

              {/* ================================================

*                  RESUMEN

*              ================================================ */}

              <DetailSection

                title="Resumen"

              >

                <div className="grid overflow-hidden rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] sm:grid-cols-2 lg:grid-cols-3">

                  <SummaryItem

                    label="Tipo"

                    value={

                      selectionProcess.isJobPool

                        ? "Bolsa de trabajo"

                        : "Plaza de plantilla"

                    }

                  />

                  <SummaryItem

                    label="Plazas"

                    value={formatNumberOfPositions(

                      selectionProcess.numberOfPositions,

                      selectionProcess.isJobPool,

                    )}

                  />

                  <SummaryItem

                    label="Grupo"

                    value={

                      selectionProcess.qualificationGroup ??

                      "No especificado"

                    }

                  />

                  <SummaryItem

                    label="Personal"

                    value={

                      selectionProcess.personnelType ??

                      "No especificado"

                    }

                  />

                  <SummaryItem

                    label="Sistema"

                    value={

                      selectionProcess.selectionSystem ??

                      "No especificado"

                    }

                  />

                  <SummaryItem

                    label="Municipio"

                    value={

                      selectionProcess

                        .institution

                        ?.municipality ??

                      "No disponible"

                    }

                  />

                </div>

                {hasReservedPlaces && (

                  <div className="mt-4">

                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#7C859B]">

                      Reservas

                    </p>

                    <div className="flex flex-wrap gap-2">

                      {(

                        selectionProcess

                          .reservedPlaces

                          .disability ??

                        0

                      ) > 0 && (

                          <ReservationBadge>

                            Discapacidad:{" "}

                            {

                              selectionProcess

                                .reservedPlaces

                                .disability

                            }

                          </ReservationBadge>

                        )}

                      {selectionProcess

                        .reservedPlaces

                        .unemployed && (

                          <ReservationBadge>

                            Personas desempleadas

                          </ReservationBadge>

                        )}

                      {selectionProcess

                        .reservedPlaces

                        .youngPeople && (

                          <ReservationBadge>

                            Jóvenes

                          </ReservationBadge>

                        )}

                      {selectionProcess

                        .reservedPlaces

                        .women && (

                          <ReservationBadge>

                            Mujeres

                          </ReservationBadge>

                        )}

                    </div>

                  </div>

                )}

              </DetailSection>

              {/* ================================================

*                  INFORMACIÓN

*              ================================================ */}

              <DetailSection

                title="Información"

              >

                <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-[#4E5870]">

                  {information.map(

                    (

                      paragraph,

                      index,

                    ) => (

                      <p

                        key={

                          index

                        }

                      >

                        {

                          paragraph

                        }

                      </p>

                    ),

                  )}

                </div>

                {selectionProcess.observations && (

                  <div className="mt-4 rounded-lg border border-[#E7EAF0] bg-[#F7F8FA] px-4 py-3">

                    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#7C859B]">

                      Observaciones

                    </p>

                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[#4E5870]">

                      {

                        selectionProcess.observations

                      }

                    </p>

                  </div>

                )}

              </DetailSection>

              {/* ================================================

*                  REQUISITOS

*              ================================================ */}

              <DetailSection

                title="Requisitos"

              >

                {requirements.length >

                  0 ? (

                  <div className="flex flex-col gap-3">

                    {requirements.map(

                      (

                        requirement,

                        index,

                      ) => (

                        <div

                          key={

                            index

                          }

                          className="flex items-start gap-3 rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] px-4 py-3"

                        >

                          <GraduationCap

                            size={

                              18

                            }

                            className="mt-0.5 shrink-0 text-[#4F5BD5]"

                          />

                          <p className="text-sm leading-relaxed text-[#4E5870]">

                            {

                              requirement

                            }

                          </p>

                        </div>

                      ),

                    )}

                  </div>

                ) : (

                  <div className="rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] px-4 py-3">

                    <p className="text-sm leading-relaxed text-[#4E5870]">

                      No hay

                      información

                      estructurada de

                      requisitos.

                      Consulta las bases

                      oficiales.

                    </p>

                  </div>

                )}

                {basesDocument && (

                  <a

                    href={

                      basesDocument.documentUrl

                    }

                    target="_blank"

                    rel="noreferrer"

                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"

                  >

                    <FileText

                      size={16}

                    />

                    Abrir las bases

                    <ExternalLink

                      size={14}

                    />

                  </a>

                )}

              </DetailSection>

              {/* ================================================

*                  MATERIAS

*              ================================================ */}

              {selectionProcess.subjectAreas.length >

                0 && (

                  <DetailSection

                    title="Áreas y materias"

                  >

                    <div className="flex flex-wrap gap-2">

                      {selectionProcess.subjectAreas.map(

                        (

                          subjectArea,

                        ) => (

                          <span

                            key={

                              subjectArea.id

                            }

                            className="rounded-full border border-[#DDE1E8] bg-[#F4F6F9] px-3 py-1.5 text-xs font-medium text-[#4E5870]"

                          >

                            {

                              subjectArea.name

                            }

                          </span>

                        ),

                      )}

                    </div>

                  </DetailSection>

                )}

              {/* ================================================

*                  CRONOLOGÍA

*              ================================================ */}

              <DetailSection

                title="Cronología"

              >

                {timeline.length >

                  0 ? (

                  <div className="flex flex-col">

                    {timeline.map(

                      (

                        item,

                        index,

                      ) => (

                        <TimelineRow

                          key={

                            item.key

                          }

                          item={

                            item

                          }

                          isLast={

                            index ===

                            timeline.length -

                            1

                          }

                        />

                      ),

                    )}

                  </div>

                ) : (

                  <p className="text-sm text-[#69738A]">

                    No hay hitos

                    disponibles para

                    construir la

                    cronología.

                  </p>

                )}

              </DetailSection>

              {/* ================================================

*                  FECHAS IMPORTANTES

*              ================================================ */}

              {importantDates.length >

                0 && (

                  <DetailSection

                    title="Fechas importantes"

                  >

                    <div className="grid gap-3 sm:grid-cols-2">

                      {importantDates.map(

                        (

                          item,

                        ) => (

                          <ImportantDateCard

                            key={

                              item.label

                            }

                            item={

                              item

                            }

                          />

                        ),

                      )}

                    </div>

                  </DetailSection>

                )}

              {/* ================================================

*                  DOCUMENTOS

*              ================================================ */}

              <DetailSection

                title="Documentos oficiales"

              >

                {selectionProcess

                  .documents.length ===

                  0 ? (

                  <p className="text-sm text-[#69738A]">

                    No hay documentos

                    oficiales disponibles.

                  </p>

                ) : (

                  <div className="flex flex-col gap-3">

                    {selectionProcess.documents.map(

                      (

                        document,

                      ) => (

                        <article

                          key={

                            document.id

                          }

                          className="rounded-lg border border-[#E3E7EE] bg-[#FAFBFC] p-4"

                        >

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="rounded-full bg-[#EEF0FC] px-2.5 py-1 text-[11px] font-semibold text-[#3B45B5]">

                                  {

                                    document.phase

                                  }

                                </span>

                                <span className="text-xs font-medium text-[#7C859B]">

                                  {formatDate(

                                    document.publicationDate,

                                  )}

                                </span>

                              </div>

                              <p className="mt-3 text-sm font-semibold leading-relaxed text-[#131A2C]">

                                {

                                  document.summary

                                }

                              </p>

                              <div className="mt-2 flex flex-col gap-1 text-xs leading-relaxed text-[#69738A]">

                                {document.publisher && (

                                  <p>

                                    Publica:{" "}

                                    {

                                      document.publisher

                                    }

                                  </p>

                                )}

                                <p>

                                  {

                                    document.bulletin

                                  }

                                  {document.bulletinNumber !==

                                    null &&

                                    ` · nº ${document.bulletinNumber}`}

                                </p>

                                {document.phaseNotes && (

                                  <p>

                                    {

                                      document.phaseNotes

                                    }

                                  </p>

                                )}

                              </div>

                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">

                              <a

                                href={

                                  document.documentUrl

                                }

                                target="_blank"

                                rel="noreferrer"

                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F5BD5] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3B45B5]"

                              >

                                Documento

                                <ExternalLink

                                  size={

                                    13

                                  }

                                />

                              </a>

                              {document.htmlUrl && (

                                <a

                                  href={

                                    document.htmlUrl

                                  }

                                  target="_blank"

                                  rel="noreferrer"

                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-xs font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"

                                >

                                  HTML

                                  <ExternalLink

                                    size={

                                      13

                                    }

                                  />

                                </a>

                              )}

                            </div>

                          </div>

                        </article>

                      ),

                    )}

                  </div>

                )}

              </DetailSection>

              {/* ================================================

*                  FUENTES

*              ================================================ */}

              <DetailSection

                title="Fuentes oficiales"

              >

                <div className="flex flex-col gap-2">

                  {officialSources.map(

                    (

                      source,

                    ) => (

                      <a

                        key={

                          source.url

                        }

                        href={

                          source.url

                        }

                        target="_blank"

                        rel="noreferrer"

                        className="flex items-center justify-between gap-4 rounded-lg border border-[#E3E7EE] bg-[#FAFBFC] px-4 py-3 hover:bg-[#F4F6F9]"

                      >

                        <div className="min-w-0">

                          <p className="text-sm font-semibold text-[#131A2C]">

                            {

                              source.label

                            }

                          </p>

                          {source.description && (

                            <p className="mt-0.5 text-xs text-[#69738A]">

                              {

                                source.description

                              }

                            </p>

                          )}

                        </div>

                        <ExternalLink

                          size={

                            15

                          }

                          className="shrink-0 text-[#4F5BD5]"

                        />

                      </a>

                    ),

                  )}

                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#7C859B]">

                  Convoca&apos;m

                  organiza información

                  pública para facilitar

                  su consulta. Revisa

                  siempre las fuentes

                  oficiales antes de

                  presentar una

                  solicitud.

                </p>

              </DetailSection>

            </div>

            {/* ==================================================

*                COLUMNA LATERAL

*            ================================================== */}

            <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-6">

              {/* ================================================

*                  ESTADO OFICIAL

*              ================================================ */}

              {/* ================================================

*    ESTADO OFICIAL

*================================================ */}

              <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">

                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">

                  Estado oficial CIDO

                </p>

                <div className="mt-3">

                  <span

                    className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3.5 text-sm font-semibold ${officialStatus.badgeClassName}`}

                  >

                    <span

                      className={`h-2 w-2 rounded-full ${officialStatus.dotClassName}`}

                    />

                    {officialStatus.label}

                  </span>

                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#7C859B]">

                  Estado publicado por la fuente oficial.

                </p>

                <div className="mt-4 border-t border-[#EEF1F5] pt-4">

                  <a

                    href={selectionProcess.cidoUrl}

                    target="_blank"

                    rel="noreferrer"

                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 py-2.5 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"

                  >

                    Ver convocatoria oficial

                    <ExternalLink size={15} />

                  </a>

                </div>

              </section>

              {/* ================================================

*                  PLAZO

*              ================================================ */}

              <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">

                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">

                  Plazo de solicitud

                </p>

                <div className="mt-3">

                  <span

                    className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3.5 text-sm font-semibold ${applicationPeriod.badgeClassName}`}

                  >

                    <span

                      className={`h-2 w-2 rounded-full ${applicationPeriod.dotClassName}`}

                    />

                    {

                      applicationPeriod.label

                    }

                  </span>

                  <p className="mt-3 text-sm font-semibold text-[#131A2C]">

                    {

                      applicationPeriod.detail

                    }

                  </p>

                </div>

                {selectionProcess.applicationStartDate && (

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs">

                    <span className="text-[#7C859B]">

                      Inicio

                    </span>

                    <span className="font-semibold text-[#4E5870]">

                      {formatDate(

                        selectionProcess.applicationStartDate,

                      )}

                    </span>

                  </div>

                )}

                {selectionProcess.applicationEndDate && (

                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">

                    <span className="text-[#7C859B]">

                      Fin

                    </span>

                    <span className="font-semibold text-[#4E5870]">

                      {formatDate(

                        selectionProcess.applicationEndDate,

                      )}

                      {selectionProcess.applicationEndTime

                        ? ` · ${selectionProcess.applicationEndTime}`

                        : ""}

                    </span>

                  </div>

                )}

                {applicationProgress !==

                  null && (

                    <div className="mt-4">

                      <div className="h-2 overflow-hidden rounded-full bg-[#E9ECF2]">

                        <div

                          className="h-full rounded-full bg-[#4F5BD5]"

                          style={{

                            width: `${applicationProgress}%`,

                          }}

                        />

                      </div>

                    </div>

                  )}

                {selectionProcess.applicationDeadlineNotes && (

                  <p className="mt-3 text-xs leading-relaxed text-[#69738A]">

                    {

                      selectionProcess.applicationDeadlineNotes

                    }

                  </p>

                )}

              </section>

              {/* ================================================

*                  SEGUIMIENTO PERSONAL

*              ================================================ */}

              <section className="rounded-xl border border-[#D8DCF8] bg-white p-5 shadow-sm">

                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">

                  Seguimiento personal

                </p>

                {userSelectionProcess ? (

                  <>

                    <div className="mt-3">

                      <PersonalSelectionProcessStatusPicker

                        selectionProcessId={

                          selectionProcess.id

                        }

                        currentStatus={

                          userSelectionProcess.personalStatus

                        }

                        action={

                          changePersonalStatusAction

                        }

                        embedded

                      />

                    </div>

                    <div className="mt-4 border-t border-[#EEF1F5] pt-3">

                      <p className="text-xs font-medium text-[#69738A]">

                        Último cambio:{" "}

                        <span className="font-semibold text-[#4E5870]">

                          {formatDateTime(

                            userSelectionProcess.personalStatusUpdatedAt,

                          )}

                        </span>

                      </p>

                      <p className="mt-1.5 text-xs leading-relaxed text-[#7C859B]">

                        Tu estado

                        personal. No

                        modifica el

                        estado oficial

                        de la

                        convocatoria.

                      </p>

                      <div className="mt-3">

                        <UnfollowSelectionProcessForm

                          selectionProcessId={

                            selectionProcess.id

                          }

                          action={

                            unfollowSelectionProcessAction

                          }

                        />

                      </div>

                    </div>

                  </>

                ) : (

                  <>

                    <p className="mt-3 text-sm leading-relaxed text-[#4E5870]">

                      Sigue esta

                      convocatoria para

                      indicar en qué

                      punto del proceso

                      te encuentras.

                    </p>

                    <form

                      action={

                        followSelectionProcessAction

                      }

                      className="mt-4"

                    >

                      <input

                        type="hidden"

                        name="selectionProcessId"

                        value={

                          selectionProcess.id

                        }

                      />

                      <input

                        type="hidden"

                        name="returnTo"

                        value={

                          detailHref

                        }

                      />

                      <button

                        type="submit"

                        className="inline-flex w-full items-center justify-center rounded-lg bg-[#4F5BD5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3B45B5]"

                      >

                        Seguir convocatoria

                      </button>

                    </form>

                    {!isAuthenticated && (

                      <p className="mt-2 text-center text-xs leading-relaxed text-[#7C859B]">

                        Necesitarás iniciar

                        sesión para guardar

                        tu seguimiento.

                      </p>

                    )}

                  </>

                )}

              </section>

              {/* ================================================

*                  REFERENCIA

*              ================================================ */}

              <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">

                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">

                  Referencia

                </p>

                <div className="mt-3 flex flex-col gap-3">

                  <ReferenceItem

                    label="Identificador CIDO"

                    value={

                      selectionProcess.cidoIdentifier

                    }

                  />

                  {selectionProcess.fileNumber && (

                    <ReferenceItem

                      label="Expediente"

                      value={

                        selectionProcess.fileNumber

                      }

                    />

                  )}

                  {selectionProcess.publicOfferYear !==

                    null && (

                      <ReferenceItem

                        label="Año de oferta pública"

                        value={String(

                          selectionProcess.publicOfferYear,

                        )}

                      />

                    )}

                  <ReferenceItem

                    label="Ámbito"

                    value={

                      selectionProcess.scope ||

                      "No especificado"

                    }

                  />

                </div>

              </section>

            </aside>

          </div>

        </main>

      </div>

    </div>

  );

}

/* ============================================================

*   COMPONENTES DE PRESENTACIÓN

*============================================================ */

function DetailSection({

  title,

  children,

}: {

  title: string;

  children: ReactNode;

}) {

  return (

    <section className="mt-5 rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm sm:p-6">

      <h2 className="text-[17px] font-semibold text-[#131A2C]">

        {title}

      </h2>

      <div className="mt-4">

        {children}

      </div>

    </section>

  );

}

function SummaryItem({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div className="border-b border-[#E7EAF0] px-4 py-3 last:border-b-0 sm:border-r sm:last:border-r-0">

      <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">

        {label}

      </p>

      <p className="mt-1.5 text-sm font-semibold leading-snug text-[#131A2C]">

        {value}

      </p>

    </div>

  );

}

function ReservationBadge({

  children,

}: {

  children: ReactNode;

}) {

  return (

    <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1E8] bg-[#F4F6F9] px-3 text-xs font-medium text-[#4E5870]">

      {children}

    </span>

  );

}

function TimelineRow({

  item,

  isLast,

}: {

  item: TimelineItem;

  isLast: boolean;

}) {

  const presentation =

    getTimelinePresentation(

      item.status,

    );

  return (

    <div className="relative flex gap-4">

      <div className="relative flex w-5 shrink-0 justify-center">

        <span

          className={`relative z-10 mt-1.5 h-3 w-3 rounded-full border-2 ${presentation.dotClassName}`}

        />

        {!isLast && (

          <span className="absolute bottom-0 top-4 w-px bg-[#E3E7EE]" />

        )}

      </div>

      <div className="min-w-0 pb-5">

        <div className="flex flex-wrap items-center gap-2">

          <p className="text-sm font-semibold text-[#131A2C]">

            {item.title}

          </p>

          <span

            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${presentation.badgeClassName}`}

          >

            {

              presentation.label

            }

          </span>

        </div>

        <p className="mt-1 text-xs font-medium text-[#7C859B]">

          {formatDate(

            item.date,

          )}

        </p>

        {item.description && (

          <p className="mt-1.5 text-sm leading-relaxed text-[#4E5870]">

            {

              item.description

            }

          </p>

        )}

      </div>

    </div>

  );

}

function ImportantDateCard({

  item,

}: {

  item: ImportantDate;

}) {

  const state =

    getDateState(

      item.date,

    );

  return (

    <div className="rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] p-4">

      <div className="flex items-start gap-3">

        <CalendarDays

          size={17}

          className="mt-0.5 shrink-0 text-[#4F5BD5]"

        />

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#7C859B]">

            {item.label}

          </p>

          <p className="mt-1.5 text-sm font-semibold text-[#131A2C]">

            {formatDate(

              item.date,

            )}

          </p>

          <p className="mt-1 text-xs text-[#69738A]">

            {state}

          </p>

        </div>

      </div>

    </div>

  );

}

function ReferenceItem({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div>

      <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#8A93A7]">

        {label}

      </p>

      <p className="mt-1 break-words text-sm font-medium text-[#4E5870]">

        {value}

      </p>

    </div>

  );

}

/* ============================================================

*   INFORMACIÓN

*============================================================ */

function buildInformation(

  selectionProcess: {

    isJobPool: boolean;

    numberOfPositions: number | null;

    personnelType: string | null;

    selectionSystem: string | null;

    scope: string;

  },

): string[] {

  const paragraphs: string[] =

    [];

  if (

    !selectionProcess.isJobPool &&

    selectionProcess.numberOfPositions !==

    null &&

    selectionProcess.numberOfPositions >

    0

  ) {

    paragraphs.push(

      `La convocatoria ofrece ${selectionProcess.numberOfPositions} ${selectionProcess.numberOfPositions ===

        1

        ? "plaza"

        : "plazas"

      }.`,

    );

  }

  if (

    selectionProcess.personnelType

  ) {

    paragraphs.push(

      `El tipo de personal indicado es ${selectionProcess.personnelType}.`,

    );

  }

  if (

    selectionProcess.selectionSystem

  ) {

    paragraphs.push(

      `El sistema de selección es ${selectionProcess.selectionSystem}.`,

    );

  }

  if (

    selectionProcess.scope

  ) {

    paragraphs.push(

      `El ámbito de la convocatoria es ${selectionProcess.scope}.`,

    );

  }

  if (

    paragraphs.length === 0

  ) {

    paragraphs.push(

      "Consulta las fuentes oficiales para ampliar la información de esta convocatoria.",

    );

  }

  return paragraphs;

}

/* ============================================================

*   REQUISITOS

*============================================================ */

function buildRequirements(

  selectionProcess: {

    requiredQualification: string | null;

    otherRequirements: string | null;

    qualificationGroup: string | null;

  },

): string[] {

  const requirements: string[] =

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

    requirements.length ===

    0 &&

    selectionProcess.qualificationGroup

  ) {

    requirements.push(

      `Grupo de titulación: ${selectionProcess.qualificationGroup}.`,

    );

  }

  return requirements;

}

/* ============================================================

*   CRONOLOGÍA

*============================================================ */

function buildTimeline(

  selectionProcess: {

    applicationStartDate: Date | null;

    applicationEndDate: Date | null;

    firstExamDate: Date | null;

    documents: {

      id: number;

      publicationDate: Date;

      phase: string;

      summary: string;

    }[];

  },

): TimelineItem[] {

  const rawItems: Omit<

    TimelineItem,

    "status"

  >[] = [];

  for (

    const document of

    selectionProcess.documents

  ) {

    rawItems.push({

      key: `document-${document.id}`,

      title:

        document.phase ||

        "Publicación oficial",

      description:

        document.summary,

      date:

        document.publicationDate,

    });

  }

  if (

    selectionProcess.applicationStartDate

  ) {

    rawItems.push({

      key: "application-start",

      title:

        "Inicio del plazo de solicitud",

      date:

        selectionProcess.applicationStartDate,

    });

  }

  if (

    selectionProcess.applicationEndDate

  ) {

    rawItems.push({

      key: "application-end",

      title:

        "Fin del plazo de solicitud",

      date:

        selectionProcess.applicationEndDate,

    });

  }

  if (

    selectionProcess.firstExamDate

  ) {

    rawItems.push({

      key: "first-exam",

      title:

        "Primera prueba",

      date:

        selectionProcess.firstExamDate,

    });

  }

  const sorted =

    rawItems.sort(

      (

        first,

        second,

      ) =>

        first.date.getTime() -

        second.date.getTime(),

    );

  const today =

    getCataloniaTodayUtc();

  let hasCurrent = false;

  const items: TimelineItem[] =

    sorted.map(

      (item) => {

        const comparison =

          compareDateOnly(

            item.date,

            today,

          );

        let status: TimelineStatus;

        if (

          comparison < 0

        ) {

          status =

            "completed";

        } else if (

          comparison === 0

        ) {

          status =

            "current";

          hasCurrent = true;

        } else {

          status =

            "future";

        }

        return {

          ...item,

          status,

        };

      },

    );

  if (

    !hasCurrent

  ) {

    for (

      let index =

        items.length - 1;

      index >= 0;

      index -= 1

    ) {

      if (

        items[index].status ===

        "completed"

      ) {

        items[index] = {

          ...items[index],

          status:

            "current-known",

        };

        break;

      }

    }

  }

  return items;

}

function getTimelinePresentation(

  status: TimelineStatus,

) {

  switch (status) {

    case "completed":

      return {

        label:

          "Finalizada",

        dotClassName:

          "border-[#8A93A7] bg-[#8A93A7]",

        badgeClassName:

          "bg-[#F1F3F7] text-[#69738A]",

      };

    case "current":

      return {

        label:

          "Hoy",

        dotClassName:

          "border-[#4F5BD5] bg-[#4F5BD5]",

        badgeClassName:

          "bg-[#EEF0FC] text-[#3B45B5]",

      };

    case "current-known":

      return {

        label:

          "Último hito",

        dotClassName:

          "border-[#4F5BD5] bg-[#4F5BD5]",

        badgeClassName:

          "bg-[#EEF0FC] text-[#3B45B5]",

      };

    case "future":

      return {

        label:

          "Próxima",

        dotClassName:

          "border-[#D5DAE3] bg-white",

        badgeClassName:

          "bg-[#F7F8FA] text-[#69738A]",

      };

    default:

      return {

        label:

          "Sin determinar",

        dotClassName:

          "border-[#D5DAE3] bg-white",

        badgeClassName:

          "bg-[#F7F8FA] text-[#69738A]",

      };

  }

}

/* ============================================================

*   FECHAS IMPORTANTES

*============================================================ */

function buildImportantDates(

  selectionProcess: {

    applicationStartDate: Date | null;

    applicationEndDate: Date | null;

    firstExamDate: Date | null;

    lastDocumentPublicationDate: Date | null;

  },

): ImportantDate[] {

  const dates: ImportantDate[] =

    [];

  if (

    selectionProcess.applicationStartDate

  ) {

    dates.push({

      label:

        "Inicio de solicitudes",

      date:

        selectionProcess.applicationStartDate,

    });

  }

  if (

    selectionProcess.applicationEndDate

  ) {

    dates.push({

      label:

        "Fin de solicitudes",

      date:

        selectionProcess.applicationEndDate,

    });

  }

  if (

    selectionProcess.firstExamDate

  ) {

    dates.push({

      label:

        "Primera prueba",

      date:

        selectionProcess.firstExamDate,

    });

  }

  if (

    selectionProcess.lastDocumentPublicationDate

  ) {

    dates.push({

      label:

        "Última publicación oficial",

      date:

        selectionProcess.lastDocumentPublicationDate,

    });

  }

  return dates;

}

function getDateState(

  date: Date,

): string {

  const today =

    getCataloniaTodayUtc();

  const comparison =

    compareDateOnly(

      date,

      today,

    );

  if (

    comparison < 0

  ) {

    return "Finalizada";

  }

  if (

    comparison === 0

  ) {

    return "Hoy";

  }

  return "Próxima";

}

/* ============================================================

*   DOCUMENTO DE BASES

*============================================================ */

function findBasesDocument<

  T extends {

    phase: string;

    summary: string;

    phaseNotes: string | null;

  },

>(

  documents: T[],

): T | null {

  return (

    documents.find(

      (document) => {

        const text =

          normalizeText(

            [

              document.phase,

              document.summary,

              document.phaseNotes ??

              "",

            ].join(" "),

          );

        return (

          text.includes(

            "base",

          ) ||

          text.includes(

            "bases",

          )

        );

      },

    ) ?? null

  );

}

/* ============================================================

*   FUENTES OFICIALES

*============================================================ */

function buildOfficialSources(

  selectionProcess: {

    institutionUrl: string | null;

    applicationUrl: string | null;

    cidoUrl: string;

    institution: {

      name: string;

    } | null;

    documents: {

      htmlUrl: string | null;

      bulletin: string;

      bulletinNumber: number | null;

    }[];

  },

): OfficialSource[] {

  const sources =

    new Map<

      string,

      OfficialSource

    >();

  if (

    selectionProcess.institutionUrl

  ) {

    sources.set(

      selectionProcess.institutionUrl,

      {

        label:

          selectionProcess

            .institution?.name ??

          "Organismo convocante",

        url:

          selectionProcess.institutionUrl,

        description:

          "Web oficial del organismo",

      },

    );

  }

  if (

    selectionProcess.applicationUrl

  ) {

    sources.set(

      selectionProcess.applicationUrl,

      {

        label:

          "Presentación de solicitudes",

        url:

          selectionProcess.applicationUrl,

        description:

          "Canal oficial para la solicitud",

      },

    );

  }

  sources.set(

    selectionProcess.cidoUrl,

    {

      label:

        "CIDO — Diputació de Barcelona",

      url:

        selectionProcess.cidoUrl,

      description:

        "Ficha oficial de la convocatoria",

    },

  );

  for (

    const document of

    selectionProcess.documents

  ) {

    if (

      !document.htmlUrl

    ) {

      continue;

    }

    sources.set(

      document.htmlUrl,

      {

        label:

          document.bulletinNumber !==

            null

            ? `${document.bulletin} · nº ${document.bulletinNumber}`

            : document.bulletin,

        url:

          document.htmlUrl,

        description:

          "Publicación oficial",

      },

    );

  }

  return [

    ...sources.values(),

  ];

}

/* ============================================================

*   PLAZO

*============================================================ */

function calculateApplicationProgress(

  startDate: Date | null,

  endDate: Date | null,

): number | null {

  if (

    !startDate ||

    !endDate

  ) {

    return null;

  }

  const start =

    toDateOnlyUtc(

      startDate,

    );

  const end =

    toDateOnlyUtc(

      endDate,

    );

  if (

    end.getTime() <=

    start.getTime()

  ) {

    return null;

  }

  const today =

    getCataloniaTodayUtc();

  if (

    today.getTime() <=

    start.getTime()

  ) {

    return 0;

  }

  if (

    today.getTime() >=

    end.getTime()

  ) {

    return 100;

  }

  const total =

    end.getTime() -

    start.getTime();

  const elapsed =

    today.getTime() -

    start.getTime();

  return Math.round(

    (elapsed / total) *

    100,

  );

}

/* ============================================================

*   RESERVAS

*============================================================ */

function hasReservations(

  reservedPlaces: {

    disability: number | null;

    unemployed: boolean;

    youngPeople: boolean;

    women: boolean;

  },

): boolean {

  return (

    (reservedPlaces.disability ??

      0) > 0 ||

    reservedPlaces.unemployed ||

    reservedPlaces.youngPeople ||

    reservedPlaces.women

  );

}

/* ============================================================

*   UBICACIÓN

*============================================================ */

function formatLocation(

  institution: {

    municipality: string | null;

    county: string | null;

    province: string | null;

  } | null,

): string {

  if (

    !institution

  ) {

    return "Ubicación no disponible";

  }

  const parts = [

    institution.municipality,

    institution.county,

    institution.province,

  ].filter(

    (

      value,

    ): value is string =>

      Boolean(value),

  );

  return parts.length > 0

    ? parts.join(" · ")

    : "Ubicación no disponible";

}

/* ============================================================

*   PLAZAS

*============================================================ */

function formatNumberOfPositions(

  numberOfPositions: number | null,

  isJobPool: boolean,

): string {

  if (

    isJobPool

  ) {

    return "—";

  }

  if (

    numberOfPositions !==

    null &&

    numberOfPositions > 0

  ) {

    return String(

      numberOfPositions,

    );

  }

  return "Sin definir";

}

/* ============================================================

*   RETORNO AL BUSCADOR

*============================================================ */

function getSafeResultsHref(
  value: string | string[] | undefined,
): string {
  const returnTo = Array.isArray(value) ? value[0] : value;

  if (!returnTo) {
    return "/convocatorias";
  }

  // Only allow local pages where the user can originate from.
  // The exact path or its query string are allowed; external URLs are rejected.
  const allowedPaths = [
    "/convocatorias",
    "/para-mi",
    "/mis-convocatorias",
    "/dashboard",
  ];

  if (
    allowedPaths.some(
      (path) => returnTo === path || returnTo.startsWith(`${path}?`),
    )
  ) {
    return returnTo;
  }

  return "/convocatorias";
}

/* ============================================================

*   FECHAS

*============================================================ */

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

function formatDateTime(

  date: Date,

): string {

  return new Intl.DateTimeFormat(

    "es-ES",

    {

      day: "2-digit",

      month: "2-digit",

      year: "numeric",

      hour: "2-digit",

      minute: "2-digit",

      second: "2-digit",

      hour12: false,

      timeZone: "Europe/Madrid",

    },

  ).format(date);

}

function compareDateOnly(

  first: Date,

  second: Date,

): number {

  return (

    toDateOnlyUtc(

      first,

    ).getTime() -

    toDateOnlyUtc(

      second,

    ).getTime()

  );

}

function toDateOnlyUtc(

  date: Date,

): Date {

  return new Date(

    Date.UTC(

      date.getUTCFullYear(),

      date.getUTCMonth(),

      date.getUTCDate(),

    ),

  );

}

function getCataloniaTodayUtc(): Date {

  const parts =

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

    ).formatToParts(

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

  return new Date(

    Date.UTC(

      year,

      month - 1,

      day,

    ),

  );

}

/* ============================================================

*   TEXTO

*============================================================ */

function normalizeText(

  value: string,

): string {

  return value

    .normalize("NFD")

    .replace(

      /[\u0300-\u036f]/g,

      "",

    )

    .toLowerCase();

}
