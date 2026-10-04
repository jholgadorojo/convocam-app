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

type SelectionProcessDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ApplicationPeriodState =
  | "open"
  | "future"
  | "closed"
  | "unknown";

type ApplicationPeriod = {
  state: ApplicationPeriodState;
  text: string;
  progress: number | null;
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
  detail: string;
  state: ProcessTimelineState;
  sortDay: number | null;
  sortPriority: number;
};

type OfficialSourceType =
  | "institution"
  | "application"
  | "cido"
  | "publication";

type OfficialSource = {
  key: string;
  type: OfficialSourceType;
  title: string;
  description: string;
  url: string;
};

const MILLISECONDS_PER_DAY =
  86_400_000;

export default async function SelectionProcessDetailPage({
  params,
}: SelectionProcessDetailPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated =
    Boolean(session?.user);

  const { id } = await params;

  const selectionProcessId =
    Number(id);

  if (
    !Number.isInteger(
      selectionProcessId,
    ) ||
    selectionProcessId <= 0
  ) {
    notFound();
  }

  const selectionProcess =
    await getSelectionProcessDetailUseCase.execute({
      id: selectionProcessId,
    });

  if (!selectionProcess) {
    notFound();
  }

  const baseDocument =
    findBaseDocument(
      selectionProcess.documents,
    );

  const importantDates =
    buildImportantDates(
      selectionProcess,
    );

  const applicationPeriod =
    getApplicationPeriod(
      selectionProcess,
    );

  const processTimeline =
    buildProcessTimeline(
      selectionProcess,
      applicationPeriod,
    );

  const informationText =
    buildInformationText(
      selectionProcess,
    );

  const requirements =
    buildRequirements(
      selectionProcess,
    );

  const officialSources =
    buildOfficialSources(
      selectionProcess,
    );

  const processType =
    selectionProcess.isJobPool
      ? "Bolsa de trabajo"
      : "Plaza de plantilla";

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
          <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* COLUMNA PRINCIPAL */}
            <div className="flex min-w-0 flex-col gap-5">
              {/* Cabecera */}
              <header className="flex flex-col gap-3.5 pb-1">
                <Link
                  href="/convocatorias"
                  className="inline-flex w-fit items-center gap-1.5 text-[13.5px] font-semibold text-[#4E5870] hover:text-[#3B45B5]"
                >
                  <ArrowLeft
                    size={15}
                  />

                  Volver a los resultados
                </Link>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Tipo de convocatoria */}
                  <span className="inline-flex h-7 items-center rounded-full bg-[#EEF0FC] px-3 text-[13.5px] font-semibold text-[#3B45B5]">
                    {processType}
                  </span>

                  {/* Estado oficial CIDO */}
                  <OfficialStatusBadge
                    status={
                      selectionProcess.status
                    }
                  />

                  {selectionProcess.lastDocumentPublicationDate && (
                    <span className="text-[13.5px] text-[#7C859B]">
                      Última publicación
                      oficial:{" "}
                      {formatDate(
                        selectionProcess
                          .lastDocumentPublicationDate,
                      )}
                    </span>
                  )}
                </div>

                <h1 className="max-w-[900px] text-[34px] font-semibold leading-[1.15] tracking-[-0.025em] text-[#131A2C]">
                  {
                    selectionProcess.title
                  }
                </h1>

                {selectionProcess.institution && (
                  <p className="flex items-center gap-2 text-base text-[#4E5870]">
                    <Building2
                      size={18}
                      className="shrink-0 text-[#7C859B]"
                    />

                    {
                      selectionProcess
                        .institution.name
                    }
                  </p>
                )}
              </header>

              {/* Resumen superior */}
              <section className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="grid sm:grid-cols-2 xl:grid-cols-6">
                  {/* Tipo */}
                  <SummaryItem
                    icon={
                      <BriefcaseBusiness
                        size={15}
                      />
                    }
                    label="Tipo"
                    value={processType}
                  />

                  {/* Plazas */}
                  <SummaryItem
                    icon={
                      <Users size={15} />
                    }
                    label="Plazas"
                    value={
                      selectionProcess
                        .numberOfPositions !==
                      null
                        ? String(
                            selectionProcess
                              .numberOfPositions,
                          )
                        : "—"
                    }
                    bordered
                  />

                  {/* Grupo */}
                  <SummaryItem
                    icon={
                      <GraduationCap
                        size={15}
                      />
                    }
                    label="Grupo"
                    value={
                      selectionProcess
                        .qualificationGroup ??
                      "—"
                    }
                    bordered
                  />

                  {/* Personal */}
                  <SummaryItem
                    icon={
                      <BriefcaseBusiness
                        size={15}
                      />
                    }
                    label="Personal"
                    value={
                      selectionProcess
                        .personnelType ??
                      "—"
                    }
                    bordered
                  />

                  {/* Sistema */}
                  <SummaryItem
                    icon={
                      <Scale size={15} />
                    }
                    label="Sistema"
                    value={
                      selectionProcess
                        .selectionSystem ??
                      "—"
                    }
                    bordered
                  />

                  {/* Municipio */}
                  <SummaryItem
                    icon={
                      <MapPin size={15} />
                    }
                    label="Municipio"
                    value={
                      selectionProcess
                        .institution
                        ?.municipality ??
                      "—"
                    }
                    secondary={
                      selectionProcess
                        .institution
                        ?.county ??
                      undefined
                    }
                    bordered
                  />
                </div>
              </section>

              {/* Información */}
              <ContentSection title="Información">
                <div className="flex max-w-[760px] flex-col gap-3 text-[15px] leading-[1.65] text-[#4E5870]">
                  <p>
                    {
                      informationText
                    }
                  </p>

                  {selectionProcess.observations && (
                    <p className="whitespace-pre-line">
                      {
                        selectionProcess
                          .observations
                      }
                    </p>
                  )}

                  {selectionProcess.applicationDeadlineNotes && (
                    <div className="mt-1 flex gap-2.5 rounded-lg bg-[#F4F6F9] p-4 text-sm">
                      <Info
                        size={17}
                        className="mt-0.5 shrink-0 text-[#7C859B]"
                      />

                      <span>
                        {
                          selectionProcess
                            .applicationDeadlineNotes
                        }
                      </span>
                    </div>
                  )}
                </div>
              </ContentSection>

              {/* Requisitos */}
              {requirements.length > 0 && (
                <ContentSection title="Requisitos">
                  <ul className="flex flex-col gap-3">
                    {requirements.map(
                      (
                        requirement,
                        index,
                      ) => (
                        <li
                          key={`${index}-${requirement}`}
                          className="flex gap-3 text-[14.5px] leading-[1.55] text-[#131A2C]"
                        >
                          <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[#4F5BD5] text-[#4F5BD5]">
                            <Check
                              size={12}
                            />
                          </span>

                          <span className="whitespace-pre-line">
                            {
                              requirement
                            }
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </ContentSection>
              )}

              {/* Proceso selectivo */}
              <ContentSection title="Proceso selectivo">
                {processTimeline.length ===
                0 ? (
                  <p className="text-sm text-[#69738A]">
                    Todavía no
                    disponemos de
                    información
                    suficiente para
                    construir el proceso
                    selectivo.
                  </p>
                ) : (
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
                          number={
                            index + 1
                          }
                          step={
                            step
                          }
                          showLine={
                            index <
                            processTimeline.length -
                              1
                          }
                        />
                      ),
                    )}
                  </ol>
                )}

                <p className="mt-5 flex gap-2.5 rounded-lg bg-[#F4F6F9] px-4 py-3 text-[13px] leading-relaxed text-[#69738A]">
                  <Info
                    size={16}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    El proceso se
                    construye a partir de
                    las fechas y fases
                    publicadas en las
                    fuentes oficiales. Si
                    una fase todavía no
                    ha sido publicada, no
                    se muestra como
                    confirmada.
                  </span>
                </p>
              </ContentSection>

              {/* Fechas importantes */}
              {importantDates.length >
                0 && (
                <ContentSection title="Fechas importantes">
                  <ul className="flex flex-col">
                    {importantDates.map(
                      (
                        importantDate,
                        index,
                      ) => (
                        <li
                          key={`${importantDate.label}-${index}`}
                          className={
                            index === 0
                              ? "grid gap-2 py-3 sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                              : "grid gap-2 border-t border-[#EEF1F5] py-3 sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                          }
                        >
                          <p className="text-sm font-semibold text-[#4E5870]">
                            {formatDate(
                              importantDate
                                .date,
                            )}
                          </p>

                          <p className="text-sm text-[#4E5870]">
                            {
                              importantDate
                                .label
                            }
                          </p>

                          <DateState
                            date={
                              importantDate
                                .date
                            }
                          />
                        </li>
                      ),
                    )}
                  </ul>
                </ContentSection>
              )}

              {/* Documentos oficiales */}
              <ContentSection
                title={`Documentos oficiales (${selectionProcess.documents.length})`}
              >
                {selectionProcess
                  .documents.length ===
                0 ? (
                  <p className="text-sm text-[#69738A]">
                    No hay documentos
                    oficiales
                    disponibles.
                  </p>
                ) : (
                  <ul>
                    {selectionProcess.documents.map(
                      (
                        document,
                        index,
                      ) => {
                        const metadata =
                          buildDocumentMetadata(
                            document,
                          );

                        return (
                          <li
                            key={
                              document.id
                            }
                            className={
                              index ===
                              0
                                ? "flex flex-col gap-4 py-3 sm:flex-row sm:items-start"
                                : "flex flex-col gap-4 border-t border-[#EEF1F5] py-4 sm:flex-row sm:items-start"
                            }
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EEF0FC] text-[#3B45B5]">
                              <FileText
                                size={19}
                              />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                {document.phase && (
                                  <span className="inline-flex rounded-md bg-[#F1F3F7] px-2 py-1 text-[11.5px] font-semibold text-[#4E5870]">
                                    {
                                      document.phase
                                    }
                                  </span>
                                )}

                                <span className="text-[12.5px] text-[#7C859B]">
                                  {formatDate(
                                    document.publicationDate,
                                  )}
                                </span>
                              </div>

                              <p className="text-[14.5px] font-semibold leading-snug text-[#131A2C]">
                                {buildDocumentTitle(
                                  document,
                                )}
                              </p>

                              {metadata && (
                                <p className="mt-1 text-[13px] text-[#7C859B]">
                                  {
                                    metadata
                                  }
                                </p>
                              )}

                              {document.phaseNotes && (
                                <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[#4E5870]">
                                  {
                                    document.phaseNotes
                                  }
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                              <a
                                href={
                                  document.documentUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 text-[13px] font-semibold text-[#131A2C] shadow-sm hover:bg-[#F4F6F9]"
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
                                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 text-[13px] font-semibold text-[#3B45B5] shadow-sm hover:bg-[#F4F6F9]"
                                >
                                  Ver
                                  publicación
                                  HTML

                                  <ExternalLink
                                    size={14}
                                  />
                                </a>
                              )}
                            </div>
                          </li>
                        );
                      },
                    )}
                  </ul>
                )}
              </ContentSection>

              {/* Fuentes oficiales */}
              <ContentSection title="Fuentes oficiales">
                <div className="flex flex-col gap-3">
                  <ul className="flex flex-col gap-2">
                    {officialSources.map(
                      (source) => (
                        <li
                          key={
                            source.key
                          }
                        >
                          <a
                            href={
                              source.url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3.5 rounded-[10px] border border-[#E3E7EE] bg-[#FAFBFC] px-4 py-3.5 text-[#131A2C] no-underline transition-colors hover:bg-[#F4F6F9] hover:no-underline"
                          >
                            <SourceIcon
                              type={
                                source.type
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold">
                                {
                                  source.title
                                }
                              </span>

                              <span className="mt-0.5 block text-[12.5px] text-[#7C859B]">
                                {
                                  source.description
                                }
                              </span>

                              <span className="mt-0.5 block truncate text-[13px] text-[#3B45B5]">
                                {getHostname(
                                  source.url,
                                )}
                              </span>
                            </div>

                            <ExternalLink
                              size={16}
                              className="shrink-0 text-[#7C859B]"
                            />
                          </a>
                        </li>
                      ),
                    )}
                  </ul>

                  <p className="flex gap-2.5 rounded-[10px] bg-[#F1F3F7] px-3.5 py-3 text-[13px] leading-relaxed text-[#4E5870]">
                    <Info
                      size={16}
                      className="mt-0.5 shrink-0 text-[#7C859B]"
                    />

                    <span>
                      Convoca&apos;m
                      recopila y organiza
                      información pública.
                      Antes de presentar
                      una solicitud,
                      consulta siempre las
                      fuentes y documentos
                      oficiales.
                    </span>
                  </p>
                </div>
              </ContentSection>
            </div>

            {/* COLUMNA DERECHA */}
            <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
              {/* Estado y plazo */}
              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex flex-col gap-4 px-6 py-[22px]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
                      Estado oficial
                    </p>

                    <OfficialStatusBadge
                      status={
                        selectionProcess
                          .status
                      }
                      small
                    />
                  </div>

                  <div className="h-px bg-[#EEF1F5]" />

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
                        Plazo de
                        inscripción
                      </p>

                      <ApplicationPeriodBadge
                        state={
                          applicationPeriod
                            .state
                        }
                      />
                    </div>

                    <p className="text-[17px] font-semibold tracking-[-0.01em] text-[#131A2C]">
                      {formatDateRange(
                        selectionProcess
                          .applicationStartDate,
                        selectionProcess
                          .applicationEndDate,
                      )}
                    </p>

                    {applicationPeriod.progress !==
                      null && (
                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={
                          applicationPeriod
                            .progress
                        }
                        className="h-1.5 overflow-hidden rounded-full bg-[#EEF1F5]"
                      >
                        <div
                          className={`h-1.5 rounded-full ${
                            applicationPeriod.state ===
                            "open"
                              ? "bg-[#23A26B]"
                              : applicationPeriod.state ===
                                  "future"
                                ? "bg-[#4F5BD5]"
                                : "bg-[#A0A7B5]"
                          }`}
                          style={{
                            width: `${applicationPeriod.progress}%`,
                          }}
                        />
                      </div>
                    )}

                    <p className="text-[22px] font-semibold tracking-[-0.02em] text-[#131A2C]">
                      {
                        applicationPeriod
                          .text
                      }
                    </p>

                    {selectionProcess.applicationEndTime && (
                      <p className="text-[13px] text-[#7C859B]">
                        Hora límite:{" "}
                        {
                          selectionProcess
                            .applicationEndTime
                        }
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[10px] border border-[#DDE1FA] bg-[#EEF0FC] px-5 text-[15px] font-semibold text-[#3B45B5] opacity-75"
                    >
                      <BookmarkPlus
                        size={17}
                      />

                      Seguir convocatoria
                    </button>

                    <p className="text-center text-[12.5px] text-[#7C859B]">
                      Se activará cuando
                      implementemos Mis
                      convocatorias.
                    </p>
                  </div>

                  {selectionProcess.applicationUrl && (
                    <a
                      href={
                        selectionProcess
                          .applicationUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#4F5BD5] px-4 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                    >
                      Presentar solicitud

                      <ExternalLink
                        size={16}
                      />
                    </a>
                  )}

                  {baseDocument && (
                    <a
                      href={
                        baseDocument
                          .documentUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#131A2C] shadow-sm hover:bg-[#F4F6F9]"
                    >
                      Abrir las bases

                      <ExternalLink
                        size={16}
                      />
                    </a>
                  )}
                </div>
              </section>

              {/* Mi estado */}
              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex flex-col gap-3.5 px-6 py-[22px]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
                      Mi estado
                    </p>

                    <span className="inline-flex items-center gap-1 text-xs text-[#7C859B]">
                      <Lock
                        size={12}
                      />

                      Solo lo ves tú
                    </span>
                  </div>

                  <p className="text-[13.5px] leading-relaxed text-[#4E5870]">
                    Sigue la convocatoria
                    para indicar en qué
                    punto estás: desde{" "}
                    <strong>
                      Me interesa
                    </strong>{" "}
                    hasta{" "}
                    <strong>
                      Finalizado
                    </strong>
                    . Tu estado personal
                    no modifica el estado
                    oficial.
                  </p>
                </div>
              </section>

              {/* Referencia */}
              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex flex-col gap-3 px-6 py-5">
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
                    Referencia
                  </p>

                  <SidebarValue
                    label="Identificador CIDO"
                    value={
                      selectionProcess
                        .cidoIdentifier
                    }
                  />

                  {selectionProcess.fileNumber && (
                    <SidebarValue
                      label="Expediente"
                      value={
                        selectionProcess
                          .fileNumber
                      }
                    />
                  )}

                  <SidebarValue
                    label="Ámbito"
                    value={
                      selectionProcess
                        .scope
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

function ContentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white px-7 py-6 shadow-sm">
      <h2 className="mb-[18px] text-lg font-semibold tracking-[-0.01em] text-[#131A2C]">
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
  secondary,
  bordered = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  secondary?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={
        bordered
          ? "border-t border-[#EEF1F5] sm:border-l sm:border-t-0"
          : ""
      }
    >
      <div className="flex min-w-0 flex-col gap-1.5 px-5 py-[18px]">
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#7C859B]">
          {icon}

          {label}
        </span>

        <p className="break-words text-base font-semibold tracking-[-0.01em] text-[#131A2C]">
          {value}
        </p>

        {secondary && (
          <p className="-mt-1 text-[12.5px] text-[#7C859B]">
            {secondary}
          </p>
        )}
      </div>
    </div>
  );
}

function ProcessStep({
  number,
  step,
  showLine,
}: {
  number: number;
  step: ProcessTimelineStep;
  showLine: boolean;
}) {
  const completed =
    step.state === "completed";

  const highlighted =
    step.state === "current" ||
    step.state === "current-known";

  return (
    <li className="flex gap-4">
      <div className="flex w-7 shrink-0 flex-col items-center">
        <span
          className={
            completed
              ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#4F5BD5] text-white"
              : highlighted
                ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#4F5BD5] text-[13px] font-bold text-white shadow-[0_0_0_4px_#EEF0FC]"
                : "inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-[#D5DAE3] bg-white text-[13px] font-semibold text-[#7C859B]"
          }
        >
          {completed ? (
            <Check size={15} />
          ) : (
            number
          )}
        </span>

        {showLine && (
          <span
            className={`my-1 min-h-[26px] w-0.5 flex-1 ${
              completed
                ? "bg-[#C9CFF8]"
                : "bg-[#E3E7EE]"
            }`}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 pb-5 pt-0.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <p
            className={
              highlighted ||
              completed
                ? "text-[15px] font-semibold text-[#131A2C]"
                : "text-[15px] font-semibold text-[#4E5870]"
            }
          >
            {step.title}
          </p>

          {step.state ===
            "current" && (
            <span className="inline-flex h-[22px] items-center rounded-md bg-[#EEF0FC] px-2 text-xs font-semibold text-[#3B45B5]">
              Fase actual
            </span>
          )}

          {step.state ===
            "current-known" && (
            <span className="inline-flex h-[22px] items-center rounded-md bg-[#F1F3F7] px-2 text-xs font-semibold text-[#4E5870]">
              Último hito conocido
            </span>
          )}

          {step.state ===
            "future" && (
            <span className="text-xs font-medium text-[#7C859B]">
              Pendiente
            </span>
          )}
        </div>

        <p className="text-[13.5px] leading-relaxed text-[#7C859B]">
          {step.detail}
        </p>
      </div>
    </li>
  );
}

function OfficialStatusBadge({
  status,
  small = false,
}: {
  status: string;
  small?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#E6F4EC] font-semibold text-[#1B7A4B] ${
        small
          ? "h-6 px-2.5 text-[12.5px]"
          : "h-7 px-3 text-[13.5px]"
      }`}
    >
      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#23A26B]" />

      {status}
    </span>
  );
}

function ApplicationPeriodBadge({
  state,
}: {
  state: ApplicationPeriodState;
}) {
  if (state === "open") {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#E6F4EC] px-2.5 text-[12px] font-semibold text-[#1B7A4B]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#23A26B]" />

        Abierto
      </span>
    );
  }

  if (state === "future") {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#EEF0FC] px-2.5 text-[12px] font-semibold text-[#3B45B5]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4F5BD5]" />

        Próximamente
      </span>
    );
  }

  if (state === "closed") {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#F1F3F7] px-2.5 text-[12px] font-semibold text-[#69738A]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#A0A7B5]" />

        Finalizado
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#F1F3F7] px-2.5 text-[12px] font-semibold text-[#69738A]">
      Sin determinar
    </span>
  );
}

function SourceIcon({
  type,
}: {
  type: OfficialSourceType;
}) {
  if (type === "institution") {
    return (
      <Building2
        size={18}
        className="shrink-0 text-[#4E5870]"
      />
    );
  }

  if (type === "publication") {
    return (
      <FileText
        size={18}
        className="shrink-0 text-[#4E5870]"
      />
    );
  }

  if (type === "application") {
    return (
      <ExternalLink
        size={18}
        className="shrink-0 text-[#4E5870]"
      />
    );
  }

  return (
    <Info
      size={18}
      className="shrink-0 text-[#4E5870]"
    />
  );
}

function DateState({
  date,
}: {
  date: Date;
}) {
  const todayDay =
    getTodayInMadridDayNumber();

  const targetDay =
    getDateDayNumber(date);

  if (targetDay < todayDay) {
    return (
      <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#7C859B]">
        <Check size={13} />

        Realizada
      </span>
    );
  }

  if (targetDay === todayDay) {
    return (
      <span className="inline-flex h-[22px] items-center rounded-md bg-[#EEF0FC] px-2 text-xs font-semibold text-[#3B45B5]">
        Hoy
      </span>
    );
  }

  return (
    <span className="text-[12.5px] font-medium text-[#7C859B]">
      Pendiente
    </span>
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
    <div className="border-t border-[#EEF1F5] pt-3 first:border-0 first:pt-0">
      <p className="text-[11.5px] font-medium text-[#7C859B]">
        {label}
      </p>

      <p className="mt-1 text-[13.5px] font-semibold text-[#131A2C]">
        {value}
      </p>
    </div>
  );
}

function buildProcessTimeline(
  selectionProcess: SelectionProcessDetailDto,
  applicationPeriod: ApplicationPeriod,
): ProcessTimelineStep[] {
  const steps:
    ProcessTimelineStep[] = [];

  const todayDay =
    getTodayInMadridDayNumber();

  const documentGroups =
    groupDocumentsByPhase(
      selectionProcess.documents,
    );

  documentGroups.forEach(
    (group, index) => {
      const sortedDocuments = [
        ...group.documents,
      ].sort(
        (a, b) =>
          a.publicationDate.getTime() -
          b.publicationDate.getTime(),
      );

      const firstDocument =
        sortedDocuments[0];

      const lastDocument =
        sortedDocuments[
          sortedDocuments.length - 1
        ];

      const firstDay =
        getDateDayNumber(
          firstDocument.publicationDate,
        );

      const lastDay =
        getDateDayNumber(
          lastDocument.publicationDate,
        );

      let state:
        ProcessTimelineState;

      if (lastDay < todayDay) {
        state = "completed";
      } else if (
        lastDay === todayDay
      ) {
        state = "current";
      } else {
        state = "future";
      }

      steps.push({
        key:
          `document-${group.key}-${index}`,

        title:
          group.title,

        detail:
          buildTimelineDocumentDetail(
            sortedDocuments,
          ),

        state,

        sortDay:
          firstDay,

        sortPriority:
          10,
      });
    },
  );

  if (
    selectionProcess.applicationStartDate ||
    selectionProcess.applicationEndDate
  ) {
    const sortDate =
      selectionProcess.applicationStartDate ??
      selectionProcess.applicationEndDate;

    steps.push({
      key:
        "application-period",

      title:
        "Presentación de solicitudes",

      detail:
        formatDateRange(
          selectionProcess
            .applicationStartDate,
          selectionProcess
            .applicationEndDate,
        ),

      state:
        applicationPeriod.state ===
        "open"
          ? "current"
          : applicationPeriod.state ===
              "future"
            ? "future"
            : applicationPeriod.state ===
                "closed"
              ? "completed"
              : "unknown",

      sortDay:
        sortDate
          ? getDateDayNumber(
              sortDate,
            )
          : null,

      sortPriority:
        20,
    });
  }

  if (
    selectionProcess.firstExamDate
  ) {
    const examDay =
      getDateDayNumber(
        selectionProcess.firstExamDate,
      );

    let examState:
      ProcessTimelineState;

    if (examDay < todayDay) {
      examState =
        "completed";
    } else if (
      examDay === todayDay
    ) {
      examState =
        "current";
    } else {
      examState =
        "future";
    }

    steps.push({
      key:
        "first-exam",

      title:
        "Primera prueba",

      detail:
        formatDate(
          selectionProcess.firstExamDate,
        ),

      state:
        examState,

      sortDay:
        examDay,

      sortPriority:
        30,
    });
  }

  steps.sort(
    (a, b) => {
      if (
        a.sortDay === null &&
        b.sortDay === null
      ) {
        return (
          a.sortPriority -
          b.sortPriority
        );
      }

      if (
        a.sortDay === null
      ) {
        return 1;
      }

      if (
        b.sortDay === null
      ) {
        return -1;
      }

      if (
        a.sortDay !==
        b.sortDay
      ) {
        return (
          a.sortDay -
          b.sortDay
        );
      }

      return (
        a.sortPriority -
        b.sortPriority
      );
    },
  );

  const hasCurrentStep =
    steps.some(
      (step) =>
        step.state ===
        "current",
    );

  if (!hasCurrentStep) {
    let lastCompletedIndex =
      -1;

    steps.forEach(
      (
        step,
        index,
      ) => {
        if (
          step.state ===
          "completed"
        ) {
          lastCompletedIndex =
            index;
        }
      },
    );

    if (
      lastCompletedIndex >=
      0
    ) {
      steps[
        lastCompletedIndex
      ] = {
        ...steps[
          lastCompletedIndex
        ],

        state:
          "current-known",
      };
    }
  }

  return steps;
}

function groupDocumentsByPhase(
  documents: SelectionProcessDetailDto["documents"],
): {
  key: string;
  title: string;
  documents: SelectionProcessDetailDto["documents"];
}[] {
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

  documents.forEach(
    (document) => {
      const title =
        document.phase.trim() ||
        document.summary.trim() ||
        "Publicación oficial";

      const key =
        normalizeTimelineKey(
          title,
        );

      const existing =
        groups.get(key);

      if (existing) {
        existing.documents.push(
          document,
        );

        return;
      }

      groups.set(key, {
        key,
        title,

        documents: [
          document,
        ],
      });
    },
  );

  return [
    ...groups.values(),
  ];
}

function buildTimelineDocumentDetail(
  documents: SelectionProcessDetailDto["documents"],
): string {
  if (
    documents.length ===
    0
  ) {
    return "Publicación oficial";
  }

  const latest =
    documents[
      documents.length - 1
    ];

  const values:
    string[] = [];

  if (
    documents.length ===
    1
  ) {
    values.push(
      `Publicado el ${formatDate(
        latest.publicationDate,
      )}`,
    );
  } else {
    values.push(
      `${documents.length} publicaciones`,
    );

    values.push(
      `última el ${formatDate(
        latest.publicationDate,
      )}`,
    );
  }

  if (
    latest.publisher
  ) {
    values.push(
      latest.publisher,
    );
  } else if (
    latest.bulletin
  ) {
    values.push(
      latest.bulletin,
    );
  }

  if (
    latest.phaseNotes
  ) {
    values.push(
      latest.phaseNotes,
    );
  }

  return values.join(
    " · ",
  );
}

function normalizeTimelineKey(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase(
      "es-ES",
    )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    );
}

function buildInformationText(
  selectionProcess: SelectionProcessDetailDto,
): string {
  const parts:
    string[] = [];

  if (
    selectionProcess.isJobPool
  ) {
    parts.push(
      "Convocatoria para la constitución de una bolsa de trabajo",
    );
  } else if (
    selectionProcess.numberOfPositions !==
    null
  ) {
    parts.push(
      `Convocatoria para ${selectionProcess.numberOfPositions} ${
        selectionProcess.numberOfPositions ===
        1
          ? "plaza"
          : "plazas"
      }`,
    );
  } else {
    parts.push(
      "Proceso selectivo",
    );
  }

  if (
    selectionProcess.selectionSystem
  ) {
    parts.push(
      `mediante ${selectionProcess.selectionSystem}`,
    );
  }

  if (
    selectionProcess.personnelType
  ) {
    parts.push(
      `para personal ${selectionProcess.personnelType}`,
    );
  }

  if (
    selectionProcess.qualificationGroup
  ) {
    parts.push(
      `del grupo ${selectionProcess.qualificationGroup}`,
    );
  }

  if (
    selectionProcess.institution
      ?.name
  ) {
    parts.push(
      `de ${selectionProcess.institution.name}`,
    );
  }

  return `${parts.join(" ")}.`;
}

function buildRequirements(
  selectionProcess: SelectionProcessDetailDto,
): string[] {
  const requirements:
    string[] = [];

  if (
    selectionProcess.requiredQualification
  ) {
    requirements.push(
      `Titulación requerida: ${selectionProcess.requiredQualification}`,
    );
  }

  if (
    selectionProcess.otherRequirements
  ) {
    requirements.push(
      selectionProcess.otherRequirements,
    );
  }

  return requirements;
}

function buildImportantDates(
  selectionProcess: SelectionProcessDetailDto,
): {
  date: Date;
  label: string;
}[] {
  const dates: {
    date: Date;
    label: string;
  }[] = [];

  if (
    selectionProcess
      .lastDocumentPublicationDate
  ) {
    dates.push({
      date:
        selectionProcess
          .lastDocumentPublicationDate,

      label:
        "Última publicación oficial",
    });
  }

  if (
    selectionProcess
      .applicationStartDate
  ) {
    dates.push({
      date:
        selectionProcess
          .applicationStartDate,

      label:
        "Inicio del plazo de presentación de solicitudes",
    });
  }

  if (
    selectionProcess
      .applicationEndDate
  ) {
    dates.push({
      date:
        selectionProcess
          .applicationEndDate,

      label:
        "Fin del plazo de presentación de solicitudes",
    });
  }

  if (
    selectionProcess
      .firstExamDate
  ) {
    dates.push({
      date:
        selectionProcess
          .firstExamDate,

      label:
        "Primera prueba",
    });
  }

  return dates.sort(
    (a, b) =>
      a.date.getTime() -
      b.date.getTime(),
  );
}

function buildOfficialSources(
  selectionProcess: SelectionProcessDetailDto,
): OfficialSource[] {
  const sources:
    OfficialSource[] = [];

  const usedUrls =
    new Set<string>();

  function addSource(
    source: OfficialSource,
  ) {
    const normalizedUrl =
      source.url.trim();

    if (
      !normalizedUrl ||
      usedUrls.has(
        normalizedUrl,
      )
    ) {
      return;
    }

    usedUrls.add(
      normalizedUrl,
    );

    sources.push({
      ...source,

      url:
        normalizedUrl,
    });
  }

  if (
    selectionProcess.institutionUrl
  ) {
    addSource({
      key:
        "institution",

      type:
        "institution",

      title:
        selectionProcess.institution
          ? `Web oficial de ${selectionProcess.institution.name}`
          : "Web oficial del organismo",

      description:
        "Institución convocante",

      url:
        selectionProcess.institutionUrl,
    });
  }

  if (
    selectionProcess.applicationUrl
  ) {
    addSource({
      key:
        "application",

      type:
        "application",

      title:
        "Presentación de solicitudes",

      description:
        "Acceso al trámite oficial",

      url:
        selectionProcess.applicationUrl,
    });
  }

  addSource({
    key:
      "cido",

    type:
      "cido",

    title:
      "CIDO — información de la convocatoria",

    description:
      "Fuente de información utilizada por Convoca'm",

    url:
      selectionProcess.cidoUrl,
  });

  const publicationHosts =
    new Set<string>();

  selectionProcess.documents.forEach(
    (document) => {
      if (
        !document.htmlUrl
      ) {
        return;
      }

      const hostname =
        getHostname(
          document.htmlUrl,
        );

      if (
        publicationHosts.has(
          hostname,
        )
      ) {
        return;
      }

      publicationHosts.add(
        hostname,
      );

      const title =
        document.bulletin?.trim() ||
        document.publisher?.trim() ||
        "Publicación oficial";

      addSource({
        key:
          `publication-${hostname}`,

        type:
          "publication",

        title,

        description:
          "Fuente oficial de publicación",

        url:
          document.htmlUrl,
      });
    },
  );

  return sources;
}

function findBaseDocument(
  documents: SelectionProcessDetailDto["documents"],
) {
  const candidates =
    documents.filter(
      (document) => {
        const text = [
          document.phase,
          document.summary,
          document.phaseNotes ??
            "",
        ]
          .join(" ")
          .toLocaleLowerCase(
            "es-ES",
          )
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            "",
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
    );

  if (
    candidates.length ===
    0
  ) {
    return undefined;
  }

  return [
    ...candidates,
  ].sort(
    (a, b) =>
      b.publicationDate.getTime() -
      a.publicationDate.getTime(),
  )[0];
}

function buildDocumentTitle(
  document: SelectionProcessDetailDto["documents"][number],
): string {
  const summary =
    document.summary.trim();

  if (summary) {
    return summary;
  }

  const phase =
    document.phase.trim();

  if (phase) {
    return phase;
  }

  return "Documento oficial";
}

function buildDocumentMetadata(
  document: SelectionProcessDetailDto["documents"][number],
): string | null {
  const values:
    string[] = [];

  if (
    document.publisher?.trim()
  ) {
    values.push(
      document.publisher.trim(),
    );
  }

  if (
    document.bulletin?.trim()
  ) {
    const bulletin =
      document.bulletinNumber !==
      null
        ? `${document.bulletin.trim()} nº ${document.bulletinNumber}`
        : document.bulletin.trim();

    values.push(
      bulletin,
    );
  }

  const uniqueValues = [
    ...new Set(values),
  ];

  return uniqueValues.length >
    0
    ? uniqueValues.join(
        " · ",
      )
    : null;
}

function getApplicationPeriod(
  selectionProcess: SelectionProcessDetailDto,
): ApplicationPeriod {
  const start =
    selectionProcess.applicationStartDate;

  const end =
    selectionProcess.applicationEndDate;

  const todayDay =
    getTodayInMadridDayNumber();

  const startDay =
    start
      ? getDateDayNumber(
          start,
        )
      : null;

  const endDay =
    end
      ? getDateDayNumber(
          end,
        )
      : null;

  if (
    startDay === null &&
    endDay === null
  ) {
    return {
      state:
        "unknown",

      text:
        "Plazo no disponible",

      progress:
        null,
    };
  }

  if (
    endDay !== null &&
    todayDay > endDay
  ) {
    return {
      state:
        "closed",

      text:
        "Plazo finalizado",

      progress:
        startDay !== null
          ? 100
          : null,
    };
  }

  if (
    startDay !== null &&
    todayDay < startDay
  ) {
    const daysUntilStart =
      startDay -
      todayDay;

    return {
      state:
        "future",

      text:
        daysUntilStart === 1
          ? "Empieza mañana"
          : `Empieza en ${daysUntilStart} días`,

      progress:
        endDay !== null
          ? 0
          : null,
    };
  }

  if (
    startDay !== null &&
    endDay !== null
  ) {
    const totalDays =
      Math.max(
        1,
        endDay -
          startDay,
      );

    const elapsedDays =
      Math.max(
        0,
        todayDay -
          startDay,
      );

    const remainingDays =
      Math.max(
        0,
        endDay -
          todayDay,
      );

    const progress =
      startDay ===
      endDay
        ? 100
        : Math.min(
            100,
            Math.max(
              0,
              Math.round(
                (elapsedDays /
                  totalDays) *
                  100,
              ),
            ),
          );

    return {
      state:
        "open",

      text:
        remainingDays === 0
          ? "Finaliza hoy"
          : remainingDays ===
              1
            ? "Queda 1 día"
            : `Quedan ${remainingDays} días`,

      progress,
    };
  }

  if (
    startDay !== null &&
    todayDay >= startDay
  ) {
    return {
      state:
        "open",

      text:
        "Plazo iniciado",

      progress:
        null,
    };
  }

  if (
    endDay !== null
  ) {
    const remainingDays =
      endDay -
      todayDay;

    return {
      state:
        "unknown",

      text:
        remainingDays === 0
          ? "Finaliza hoy"
          : remainingDays ===
              1
            ? "Finaliza mañana"
            : `Finaliza en ${remainingDays} días`,

      progress:
        null,
    };
  }

  return {
    state:
      "unknown",

    text:
      "Plazo no disponible",

    progress:
      null,
  };
}

function getDateDayNumber(
  date: Date,
): number {
  return Math.floor(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ) /
      MILLISECONDS_PER_DAY,
  );
}

function getTodayInMadridDayNumber(): number {
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
        (part) =>
          part.type ===
          "year",
      )?.value,
    );

  const month =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "month",
      )?.value,
    );

  const day =
    Number(
      parts.find(
        (part) =>
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
      MILLISECONDS_PER_DAY,
  );
}

function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "es-ES",
    {
      timeZone:
        "UTC",
    },
  ).format(
    date,
  );
}

function formatDateRange(
  start: Date | null,
  end: Date | null,
): string {
  if (
    start &&
    end
  ) {
    return `${formatDate(
      start,
    )} – ${formatDate(
      end,
    )}`;
  }

  if (start) {
    return `Desde ${formatDate(
      start,
    )}`;
  }

  if (end) {
    return `Hasta ${formatDate(
      end,
    )}`;
  }

  return "No especificado";
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