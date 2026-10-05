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

  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
};

type ApplicationPeriodState =
  | "open"
  | "future"
  | "closed"
  | "unknown";

type ApplicationPeriod = {
  state: ApplicationPeriodState;
  label: string;
  detail: string;
  progress: number;
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

type ImportantDate = {
  key: string;
  label: string;
  date: Date;
};

const MILLISECONDS_PER_DAY =
  86_400_000;

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

  /*
   * ID de la convocatoria.
   */
  const { id } =
    await params;

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

  /*
   * URL de retorno al buscador.
   *
   * Esta URL llega desde:
   *
   * /convocatorias
   *
   * y contiene los filtros y
   * la página donde estaba
   * el usuario.
   */
  const {
    returnTo,
  } =
    await searchParams;

  const returnToValue =
    Array.isArray(
      returnTo,
    )
      ? returnTo[0]
      : returnTo;

  const resultsHref =
    getSafeResultsHref(
      returnToValue,
    );

  /*
   * Recuperamos la convocatoria.
   */
  const selectionProcess =
    await getSelectionProcessDetailUseCase.execute(
      {
        id:
          selectionProcessId,
      },
    );

  if (!selectionProcess) {
    notFound();
  }

  /*
   * Tipo de convocatoria.
   *
   * Queremos que se vea siempre
   * claramente nada más entrar.
   */
  const processType =
    selectionProcess.isJobPool
      ? "Bolsa de trabajo"
      : "Plaza de plantilla";

  /*
   * Periodo de solicitud.
   */
  const applicationPeriod =
    getApplicationPeriod(
      selectionProcess,
    );

  /*
   * Línea temporal.
   */
  const processTimeline =
    buildProcessTimeline(
      selectionProcess,
      applicationPeriod,
    );

  /*
   * Información general.
   */
  const informationText =
    buildInformationText(
      selectionProcess,
    );

  /*
   * Requisitos.
   */
  const requirements =
    buildRequirements(
      selectionProcess,
    );

  /*
   * Fechas importantes.
   */
  const importantDates =
    buildImportantDates(
      selectionProcess,
    );

  /*
   * Documento de bases.
   */
  const baseDocument =
    findBaseDocument(
      selectionProcess.documents,
    );

  /*
   * Fuentes oficiales.
   */
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
                    session.user
                      .name,

                  email:
                    session.user
                      .email,
                }
              : undefined
          }
        />

        <main className="flex-1 px-6 py-8 lg:px-10 lg:pb-12">
          <div className="grid w-full items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Columna principal */}
            <div className="flex min-w-0 flex-col gap-5">
              {/* Volver */}
              <Link
                href={
                  resultsHref
                }
                className="inline-flex w-fit items-center gap-1.5 text-[13.5px] font-semibold text-[#4E5870] hover:text-[#3B45B5]"
              >
                <ArrowLeft
                  size={15}
                />

                Volver a los resultados
              </Link>

              {/* Cabecera */}
              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-7 items-center rounded-full bg-[#EEF0FC] px-3 text-[13.5px] font-semibold text-[#3B45B5]">
                      {
                        processType
                      }
                    </span>

                    <OfficialStatusBadge
                      status={
                        selectionProcess.status
                      }
                    />

                    {selectionProcess.lastDocumentPublicationDate && (
                      <span className="text-[12.5px] text-[#69738A]">
                        Última
                        publicación:{" "}
                        {formatDate(
                          selectionProcess.lastDocumentPublicationDate,
                        )}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-4 text-[27px] font-semibold leading-[1.2] tracking-tight text-[#131A2C]">
                    {
                      selectionProcess.title
                    }
                  </h1>

                  <div className="mt-3 flex items-start gap-2 text-[14.5px] text-[#4E5870]">
                    <Building2
                      size={17}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      {selectionProcess
                        .institution
                        ?.name ??
                        "Organismo no disponible"}
                    </span>
                  </div>
                </div>

                {/* Resumen */}
                <div className="grid border-t border-[#EEF1F5] sm:grid-cols-2 xl:grid-cols-6">
                  <SummaryItem
                    icon={
                      <BriefcaseBusiness
                        size={
                          15
                        }
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
                        size={
                          15
                        }
                      />
                    }
                    label="Plazas"
                    value={
                      selectionProcess.numberOfPositions !==
                      null
                        ? String(
                            selectionProcess.numberOfPositions,
                          )
                        : "—"
                    }
                    bordered
                  />

                  <SummaryItem
                    icon={
                      <GraduationCap
                        size={
                          15
                        }
                      />
                    }
                    label="Grupo"
                    value={
                      selectionProcess.qualificationGroup ??
                      "—"
                    }
                    bordered
                  />

                  <SummaryItem
                    icon={
                      <Users
                        size={
                          15
                        }
                      />
                    }
                    label="Personal"
                    value={
                      selectionProcess.personnelType ??
                      "—"
                    }
                    bordered
                  />

                  <SummaryItem
                    icon={
                      <Scale
                        size={
                          15
                        }
                      />
                    }
                    label="Sistema"
                    value={
                      selectionProcess.selectionSystem ??
                      "—"
                    }
                    bordered
                  />

                  <SummaryItem
                    icon={
                      <MapPin
                        size={
                          15
                        }
                      />
                    }
                    label="Municipio"
                    value={
                      selectionProcess
                        .institution
                        ?.municipality ??
                      "—"
                    }
                    bordered
                  />
                </div>
              </section>

              {/* Información */}
              <ContentSection
                title="Información de la convocatoria"
                icon={
                  <Info
                    size={18}
                  />
                }
              >
                <p className="text-[14px] leading-6 text-[#4E5870]">
                  {
                    informationText
                  }
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <SidebarValue
                    label="Ámbito"
                    value={
                      selectionProcess.scope ||
                      "—"
                    }
                  />

                  <SidebarValue
                    label="Expediente"
                    value={
                      selectionProcess.fileNumber ??
                      "—"
                    }
                  />

                  <SidebarValue
                    label="Oferta pública"
                    value={
                      selectionProcess.publicOfferYear !==
                      null
                        ? String(
                            selectionProcess.publicOfferYear,
                          )
                        : "—"
                    }
                  />

                  <SidebarValue
                    label="Identificador CIDO"
                    value={
                      selectionProcess.cidoIdentifier
                    }
                  />
                </div>

                {selectionProcess.observations && (
                  <div className="mt-4 rounded-lg bg-[#F7F8FA] p-4">
                    <p className="text-[13.5px] leading-5 text-[#4E5870]">
                      {
                        selectionProcess.observations
                      }
                    </p>
                  </div>
                )}
              </ContentSection>

              {/* Requisitos */}
              {requirements.length >
                0 && (
                <ContentSection
                  title="Requisitos"
                  icon={
                    <Check
                      size={
                        18
                      }
                    />
                  }
                >
                  <div className="flex flex-col gap-3">
                    {requirements.map(
                      (
                        requirement,
                      ) => (
                        <div
                          key={
                            requirement
                          }
                          className="flex items-start gap-2.5 text-[14px] leading-5 text-[#4E5870]"
                        >
                          <Check
                            size={
                              16
                            }
                            className="mt-0.5 shrink-0 text-[#3F8A64]"
                          />

                          <span>
                            {
                              requirement
                            }
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </ContentSection>
              )}

              {/* Proceso */}
              {processTimeline.length >
                0 && (
                <ContentSection
                  title="Proceso de la convocatoria"
                  icon={
                    <BriefcaseBusiness
                      size={
                        18
                      }
                    />
                  }
                >
                  <div className="flex flex-col">
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
                  </div>
                </ContentSection>
              )}

              {/* Fechas */}
              {importantDates.length >
                0 && (
                <ContentSection
                  title="Fechas importantes"
                  icon={
                    <BriefcaseBusiness
                      size={
                        18
                      }
                    />
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {importantDates.map(
                      (
                        item,
                      ) => (
                        <div
                          key={
                            item.key
                          }
                          className="rounded-[10px] border border-[#E3E7EE] bg-[#FAFBFC] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#69738A]">
                                {
                                  item.label
                                }
                              </p>

                              <p className="mt-1.5 text-[15px] font-semibold text-[#131A2C]">
                                {formatDate(
                                  item.date,
                                )}
                              </p>
                            </div>

                            <DateState
                              date={
                                item.date
                              }
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </ContentSection>
              )}

              {/* Documentos */}
              <ContentSection
                title={`Documentos oficiales (${selectionProcess.documents.length})`}
                icon={
                  <FileText
                    size={18}
                  />
                }
              >
                {selectionProcess.documents.length ===
                0 ? (
                  <p className="text-[14px] text-[#69738A]">
                    No hay
                    documentos
                    oficiales
                    disponibles.
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
                          className="rounded-[10px] border border-[#E3E7EE] bg-white p-4"
                        >
                          <div className="flex flex-col gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-[#EEF0FC] px-2 py-1 text-[11.5px] font-semibold text-[#3B45B5]">
                                  {
                                    document.phase
                                  }
                                </span>

                                <span className="text-[12.5px] text-[#69738A]">
                                  {formatDate(
                                    document.publicationDate,
                                  )}
                                </span>
                              </div>

                              <h3 className="mt-2 text-[14.5px] font-semibold leading-5 text-[#131A2C]">
                                {buildDocumentTitle(
                                  document,
                                )}
                              </h3>

                              {buildDocumentMetadata(
                                document,
                              ) && (
                                <p className="mt-1.5 text-[12.5px] leading-5 text-[#69738A]">
                                  {buildDocumentMetadata(
                                    document,
                                  )}
                                </p>
                              )}

                              {document.phaseNotes && (
                                <p className="mt-2 text-[13.5px] leading-5 text-[#4E5870]">
                                  {
                                    document.phaseNotes
                                  }
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <a
                                href={
                                  document.documentUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F5BD5] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#3B45B5]"
                              >
                                <ExternalLink
                                  size={
                                    14
                                  }
                                />

                                Abrir
                                documento
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
                                  <ExternalLink
                                    size={
                                      14
                                    }
                                  />

                                  Ver
                                  publicación
                                  HTML
                                </a>
                              )}
                            </div>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </ContentSection>

              {/* Fuentes */}
              <ContentSection
                title="Fuentes oficiales"
                icon={
                  <Building2
                    size={18}
                  />
                }
              >
                <div className="flex flex-col gap-2.5">
                  {officialSources.map(
                    (
                      source,
                    ) => (
                      <a
                        key={
                          source.key
                        }
                        href={
                          source.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-[10px] border border-[#E3E7EE] bg-[#FAFBFC] px-4 py-3.5 text-[#131A2C] hover:border-[#C9CED9] hover:bg-white"
                      >
                        <SourceIcon
                          type={
                            source.type
                          }
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold">
                            {
                              source.title
                            }
                          </p>

                          <p className="mt-0.5 truncate text-[12.5px] text-[#69738A]">
                            {
                              source.description
                            }
                          </p>
                        </div>

                        <ExternalLink
                          size={
                            16
                          }
                          className="shrink-0 text-[#7C859B]"
                        />
                      </a>
                    ),
                  )}
                </div>

                <div className="mt-4 flex gap-2.5 rounded-[10px] bg-[#F1F3F7] p-3.5">
                  <Info
                    size={
                      16
                    }
                    className="mt-0.5 shrink-0 text-[#7C859B]"
                  />

                  <p className="text-[12.5px] leading-5 text-[#4E5870]">
                    Convoca&apos;m
                    recopila y
                    organiza
                    información
                    pública. Antes
                    de presentar la
                    solicitud,
                    consulta siempre
                    las fuentes
                    oficiales.
                  </p>
                </div>
              </ContentSection>
            </div>

            {/* Lateral */}
            <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
              {/* Estado */}
              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#69738A]">
                      Estado oficial
                    </p>

                    <OfficialStatusBadge
                      status={
                        selectionProcess.status
                      }
                    />
                  </div>

                  <div className="border-t border-[#EEF1F5] pt-4">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#69738A]">
                      Periodo de
                      solicitud
                    </p>

                    <div className="mt-2">
                      <ApplicationPeriodBadge
                        state={
                          applicationPeriod.state
                        }
                        label={
                          applicationPeriod.label
                        }
                      />
                    </div>

                    <p className="mt-2 text-[13px] leading-5 text-[#4E5870]">
                      {
                        applicationPeriod.detail
                      }
                    </p>

                    {applicationPeriod.state !==
                      "unknown" && (
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E9ECF2]">
                        <div
                          className={`h-full rounded-full ${
                            applicationPeriod.state ===
                            "open"
                              ? "bg-[#3F8A64]"
                              : applicationPeriod.state ===
                                  "future"
                                ? "bg-[#4F5BD5]"
                                : "bg-[#9AA2B1]"
                          }`}
                          style={{
                            width: `${applicationPeriod.progress}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {(selectionProcess.applicationStartDate ||
                    selectionProcess.applicationEndDate) && (
                    <div className="grid grid-cols-2 gap-3 border-t border-[#EEF1F5] pt-4">
                      <SidebarValue
                        label="Inicio"
                        value={
                          selectionProcess.applicationStartDate
                            ? formatDate(
                                selectionProcess.applicationStartDate,
                              )
                            : "—"
                        }
                      />

                      <SidebarValue
                        label="Fin"
                        value={
                          selectionProcess.applicationEndDate
                            ? formatDate(
                                selectionProcess.applicationEndDate,
                              )
                            : "—"
                        }
                      />
                    </div>
                  )}

                  {selectionProcess.applicationEndTime && (
                    <SidebarValue
                      label="Hora límite"
                      value={
                        selectionProcess.applicationEndTime
                      }
                    />
                  )}

                  {selectionProcess.applicationDeadlineNotes && (
                    <p className="rounded-lg bg-[#F7F8FA] p-3 text-[12.5px] leading-5 text-[#4E5870]">
                      {
                        selectionProcess.applicationDeadlineNotes
                      }
                    </p>
                  )}

                  {/* Seguimiento futuro */}
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#D5DAE3] bg-[#F4F6F9] px-4 text-[13.5px] font-semibold text-[#8A92A2]"
                  >
                    <BookmarkPlus
                      size={
                        16
                      }
                    />

                    Seguir
                    convocatoria
                  </button>

                  {selectionProcess.applicationUrl && (
                    <a
                      href={
                        selectionProcess.applicationUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#4F5BD5] px-4 text-[13.5px] font-semibold text-white hover:bg-[#3B45B5]"
                    >
                      Presentar
                      solicitud

                      <ExternalLink
                        size={
                          15
                        }
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
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-[13.5px] font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                    >
                      <FileText
                        size={
                          15
                        }
                      />

                      Abrir las
                      bases
                    </a>
                  )}
                </div>
              </section>

              {/* Mi estado */}
              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <Lock
                      size={
                        16
                      }
                      className="text-[#69738A]"
                    />

                    <h2 className="text-[14.5px] font-semibold text-[#131A2C]">
                      Mi estado
                    </h2>
                  </div>

                  <p className="mt-2 text-[13px] leading-5 text-[#69738A]">
                    Próximamente
                    podrás guardar
                    esta
                    convocatoria y
                    registrar el
                    estado de tu
                    proceso.
                  </p>

                  {!isAuthenticated && (
                    <Link
                      href="/login"
                      className="mt-4 inline-flex text-[13px] font-semibold text-[#3B45B5] hover:underline"
                    >
                      Iniciar sesión
                    </Link>
                  )}
                </div>
              </section>

              {/* Referencia */}
              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="p-5">
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#69738A]">
                    Referencia
                  </p>

                  <p className="mt-2 break-all text-[13px] font-semibold text-[#131A2C]">
                    {
                      selectionProcess.cidoIdentifier
                    }
                  </p>

                  <a
                    href={
                      selectionProcess.cidoUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3B45B5] hover:underline"
                  >
                    Ver en CIDO

                    <ExternalLink
                      size={
                        14
                      }
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
 * Sección principal.
 */
function ContentSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#EEF1F5] px-5 py-4">
        <span className="text-[#4E5870]">
          {icon}
        </span>

        <h2 className="text-[15px] font-semibold text-[#131A2C]">
          {title}
        </h2>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

/*
 * Elemento del resumen superior.
 */
function SummaryItem({
  icon,
  label,
  value,
  bordered = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`min-w-0 p-4 ${
        bordered
          ? "border-t border-[#EEF1F5] sm:border-l xl:border-t-0"
          : ""
      }`}
    >
      <div className="flex items-center gap-1.5 text-[#69738A]">
        {icon}

        <span className="text-[11.5px] font-semibold uppercase tracking-[0.04em]">
          {label}
        </span>
      </div>

      <p className="mt-1.5 truncate text-[13.5px] font-semibold text-[#131A2C]">
        {value}
      </p>
    </div>
  );
}

/*
 * Paso de la línea temporal.
 */
function ProcessStep({
  step,
  isLast,
}: {
  step: ProcessTimelineStep;
  isLast: boolean;
}) {
  const completed =
    step.state ===
    "completed";

  const current =
    step.state ===
      "current" ||
    step.state ===
      "current-known";

  return (
    <div className="relative flex gap-3.5">
      {/* Línea */}
      {!isLast && (
        <div className="absolute left-[10px] top-[22px] h-[calc(100%-4px)] w-px bg-[#DDE1E8]" />
      )}

      {/* Punto */}
      <div
        className={`relative z-10 mt-0.5 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border ${
          completed
            ? "border-[#3F8A64] bg-[#3F8A64] text-white"
            : current
              ? "border-[#4F5BD5] bg-[#EEF0FC] text-[#4F5BD5]"
              : "border-[#CBD1DC] bg-white text-[#8992A3]"
        }`}
      >
        {completed ? (
          <Check
            size={12}
          />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </div>

      <div
        className={`min-w-0 flex-1 ${
          isLast
            ? ""
            : "pb-5"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-semibold text-[#131A2C]">
            {
              step.title
            }
          </h3>

          {step.state ===
            "current" && (
            <span className="rounded-full bg-[#EAF5EF] px-2 py-0.5 text-[11px] font-semibold text-[#317553]">
              Actual
            </span>
          )}

          {step.state ===
            "current-known" && (
            <span className="rounded-full bg-[#EEF0FC] px-2 py-0.5 text-[11px] font-semibold text-[#3B45B5]">
              Último hito
              conocido
            </span>
          )}
        </div>

        <p className="mt-1 text-[13px] leading-5 text-[#69738A]">
          {
            step.detail
          }
        </p>
      </div>
    </div>
  );
}

/*
 * Estado oficial de CIDO.
 */
function OfficialStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="inline-flex h-7 items-center rounded-full bg-[#EAF5EF] px-3 text-[13px] font-semibold text-[#317553]">
      {status}
    </span>
  );
}

/*
 * Estado calculado del periodo.
 */
function ApplicationPeriodBadge({
  state,
  label,
}: {
  state: ApplicationPeriodState;
  label: string;
}) {
  const className =
    state === "open"
      ? "bg-[#EAF5EF] text-[#317553]"
      : state === "future"
        ? "bg-[#EEF0FC] text-[#3B45B5]"
        : state === "closed"
          ? "bg-[#EFF1F4] text-[#626C7E]"
          : "bg-[#F4F6F9] text-[#69738A]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

/*
 * Icono de fuente oficial.
 */
function SourceIcon({
  type,
}: {
  type: OfficialSourceType;
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
    type === "cido"
  ) {
    return (
      <Scale
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

/*
 * Estado de una fecha.
 */
function DateState({
  date,
}: {
  date: Date;
}) {
  const today =
    getTodayInMadridDayNumber();

  const dateDay =
    getDateDayNumber(
      date,
    );

  if (
    dateDay === null
  ) {
    return null;
  }

  if (
    dateDay < today
  ) {
    return (
      <span className="rounded-full bg-[#EFF1F4] px-2 py-1 text-[11px] font-semibold text-[#626C7E]">
        Pasada
      </span>
    );
  }

  if (
    dateDay === today
  ) {
    return (
      <span className="rounded-full bg-[#EAF5EF] px-2 py-1 text-[11px] font-semibold text-[#317553]">
        Hoy
      </span>
    );
  }

  return (
    <span className="rounded-full bg-[#EEF0FC] px-2 py-1 text-[11px] font-semibold text-[#3B45B5]">
      Próxima
    </span>
  );
}

/*
 * Valor sencillo del lateral/resumen.
 */
function SidebarValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#69738A]">
        {label}
      </p>

      <p className="mt-1 text-[13.5px] font-semibold leading-5 text-[#131A2C]">
        {value}
      </p>
    </div>
  );
}

/*
 * Construye la línea temporal real.
 */
function buildProcessTimeline(
  selectionProcess: SelectionProcessDetailDto,
  applicationPeriod: ApplicationPeriod,
): ProcessTimelineStep[] {
  const today =
    getTodayInMadridDayNumber();

  const steps:
    ProcessTimelineStep[] =
    [];

  /*
   * Documentos publicados agrupados
   * por fase.
   */
  const groupedDocuments =
    groupDocumentsByPhase(
      selectionProcess.documents,
    );

  for (
    const group of groupedDocuments
  ) {
    const firstDocument =
      group.documents[0];

    const publicationDay =
      getDateDayNumber(
        firstDocument.publicationDate,
      );

    steps.push({
      key:
        `document-${group.key}`,

      title:
        group.phase,

      detail:
        buildTimelineDocumentDetail(
          group.documents,
        ),

      state:
        publicationDay !==
          null &&
        publicationDay >
          today
          ? "future"
          : "completed",

      sortDay:
        publicationDay,

      sortPriority:
        10,
    });
  }

  /*
   * Periodo de solicitud.
   */
  if (
    selectionProcess.applicationStartDate ||
    selectionProcess.applicationEndDate
  ) {
    const startDay =
      getDateDayNumber(
        selectionProcess.applicationStartDate,
      );

    const endDay =
      getDateDayNumber(
        selectionProcess.applicationEndDate,
      );

    let state:
      ProcessTimelineState =
      "unknown";

    if (
      applicationPeriod.state ===
      "open"
    ) {
      state =
        "current";
    } else if (
      applicationPeriod.state ===
      "future"
    ) {
      state =
        "future";
    } else if (
      applicationPeriod.state ===
      "closed"
    ) {
      state =
        "completed";
    }

    steps.push({
      key:
        "application-period",

      title:
        "Presentación de solicitudes",

      detail:
        formatDateRange(
          selectionProcess.applicationStartDate,
          selectionProcess.applicationEndDate,
        ),

      state,

      sortDay:
        startDay ??
        endDay,

      sortPriority:
        20,
    });
  }

  /*
   * Primera prueba.
   */
  if (
    selectionProcess.firstExamDate
  ) {
    const examDay =
      getDateDayNumber(
        selectionProcess.firstExamDate,
      );

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
        examDay === null
          ? "unknown"
          : examDay >
              today
            ? "future"
            : examDay ===
                today
              ? "current"
              : "completed",

      sortDay:
        examDay,

      sortPriority:
        30,
    });
  }

  /*
   * Orden cronológico.
   */
  steps.sort(
    (
      a,
      b,
    ) => {
      if (
        a.sortDay ===
          null &&
        b.sortDay ===
          null
      ) {
        return (
          a.sortPriority -
          b.sortPriority
        );
      }

      if (
        a.sortDay ===
        null
      ) {
        return 1;
      }

      if (
        b.sortDay ===
        null
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

  /*
   * Si no existe un paso marcado
   * explícitamente como actual,
   * señalamos el último hito conocido.
   */
  const hasCurrent =
    steps.some(
      (
        step,
      ) =>
        step.state ===
        "current",
    );

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
        steps[index] = {
          ...steps[index],
          state:
            "current-known",
        };

        break;
      }
    }
  }

  return steps;
}

/*
 * Agrupa documentos de la misma fase.
 */
function groupDocumentsByPhase(
  documents:
    SelectionProcessDetailDto["documents"],
) {
  const groups =
    new Map<
      string,
      {
        key: string;
        phase: string;
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

        phase:
          document.phase,

        documents: [
          document,
        ],
      },
    );
  }

  return [
    ...groups.values(),
  ];
}

/*
 * Descripción de documentos
 * dentro de la línea temporal.
 */
function buildTimelineDocumentDetail(
  documents:
    SelectionProcessDetailDto["documents"],
): string {
  const sorted = [
    ...documents,
  ].sort(
    (
      a,
      b,
    ) =>
      a.publicationDate.getTime() -
      b.publicationDate.getTime(),
  );

  if (
    sorted.length === 1
  ) {
    return `${formatDate(
      sorted[0].publicationDate,
    )} · ${sorted[0].summary}`;
  }

  const first =
    sorted[0];

  const last =
    sorted[
      sorted.length - 1
    ];

  return `${sorted.length} publicaciones · ${formatDate(
    first.publicationDate,
  )} - ${formatDate(
    last.publicationDate,
  )}`;
}

/*
 * Normaliza la fase para agruparla.
 */
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
      "-",
    );
}

/*
 * Texto informativo.
 */
function buildInformationText(
  selectionProcess:
    SelectionProcessDetailDto,
): string {
  const institution =
    selectionProcess
      .institution
      ?.name;

  const location =
    [
      selectionProcess
        .institution
        ?.municipality,

      selectionProcess
        .institution
        ?.county,

      selectionProcess
        .institution
        ?.province,
    ]
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      )
      .join(", ");

  if (
    selectionProcess.isJobPool
  ) {
    return [
      "Convocatoria para la constitución de una bolsa de trabajo",

      institution
        ? `del organismo ${institution}`
        : null,

      location
        ? `en ${location}`
        : null,
    ]
      .filter(Boolean)
      .join(" ") +
      ".";
  }

  const positions =
    selectionProcess.numberOfPositions;

  return [
    positions !== null
      ? `Convocatoria para ${positions} ${
          positions === 1
            ? "plaza"
            : "plazas"
        }`
      : "Convocatoria de plaza de plantilla",

    institution
      ? `del organismo ${institution}`
      : null,

    location
      ? `en ${location}`
      : null,
  ]
    .filter(Boolean)
    .join(" ") +
    ".";
}

/*
 * Requisitos.
 */
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

  return requirements;
}

/*
 * Fechas importantes.
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
      key:
        "application-start",

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
      key:
        "application-end",

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
      key:
        "first-exam",

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
      key:
        "last-publication",

      label:
        "Última publicación",

      date:
        selectionProcess.lastDocumentPublicationDate,
    });
  }

  return dates.sort(
    (
      a,
      b,
    ) =>
      a.date.getTime() -
      b.date.getTime(),
  );
}

/*
 * Fuentes oficiales.
 */
function buildOfficialSources(
  selectionProcess:
    SelectionProcessDetailDto,
): OfficialSource[] {
  const sources:
    OfficialSource[] =
    [];

  const usedUrls =
    new Set<string>();

  const publicationHosts =
    new Set<string>();

  function addSource(
    source:
      OfficialSource,
  ) {
    if (
      usedUrls.has(
        source.url,
      )
    ) {
      return;
    }

    usedUrls.add(
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
      key:
        "institution",

      type:
        "institution",

      title:
        selectionProcess
          .institution
          ?.name ??
        "Organismo convocante",

      description:
        getHostname(
          selectionProcess.institutionUrl,
        ),

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
        getHostname(
          selectionProcess.applicationUrl,
        ),

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
      "CIDO — Diputació de Barcelona",

    description:
      getHostname(
        selectionProcess.cidoUrl,
      ),

    url:
      selectionProcess.cidoUrl,
  });

  for (
    const document of selectionProcess.documents
  ) {
    if (
      !document.htmlUrl
    ) {
      continue;
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
      continue;
    }

    publicationHosts.add(
      hostname,
    );

    addSource({
      key:
        `publication-${hostname}`,

      type:
        "publication",

      title:
        document.bulletin,

      description:
        hostname,

      url:
        document.htmlUrl,
    });
  }

  return sources;
}

/*
 * Busca el documento de bases
 * más reciente.
 */
function findBaseDocument(
  documents:
    SelectionProcessDetailDto["documents"],
) {
  return [
    ...documents,
  ]
    .filter(
      (
        document,
      ) => {
        const text =
          [
            document.phase,
            document.summary,
            document.phaseNotes,
          ]
            .filter(Boolean)
            .join(" ")
            .normalize(
              "NFD",
            )
            .replace(
              /[\u0300-\u036f]/g,
              "",
            )
            .toLowerCase();

        return text.includes(
          "base",
        );
      },
    )
    .sort(
      (
        a,
        b,
      ) =>
        b.publicationDate.getTime() -
        a.publicationDate.getTime(),
    )[0];
}

/*
 * Título visible del documento.
 */
function buildDocumentTitle(
  document:
    SelectionProcessDetailDto["documents"][number],
): string {
  return (
    document.summary ||
    document.phase
  );
}

/*
 * Información secundaria
 * del documento.
 */
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
        ? `${document.bulletin} núm. ${document.bulletinNumber}`
        : document.bulletin,
    );
  }

  return parts.join(
    " · ",
  );
}

/*
 * Calcula el estado del plazo
 * de solicitudes.
 */
function getApplicationPeriod(
  selectionProcess:
    SelectionProcessDetailDto,
): ApplicationPeriod {
  const start =
    selectionProcess.applicationStartDate;

  const end =
    selectionProcess.applicationEndDate;

  if (
    !start &&
    !end
  ) {
    return {
      state:
        "unknown",

      label:
        "Sin información",

      detail:
        "No consta un periodo de solicitud.",

      progress:
        0,
    };
  }

  const today =
    getTodayInMadridDayNumber();

  const startDay =
    getDateDayNumber(
      start,
    );

  const endDay =
    getDateDayNumber(
      end,
    );

  /*
   * Todavía no ha empezado.
   */
  if (
    startDay !== null &&
    today < startDay
  ) {
    const days =
      startDay -
      today;

    return {
      state:
        "future",

      label:
        "Próximamente",

      detail:
        days === 1
          ? "Empieza mañana."
          : `Empieza en ${days} días.`,

      progress:
        0,
    };
  }

  /*
   * Ya ha terminado.
   */
  if (
    endDay !== null &&
    today > endDay
  ) {
    return {
      state:
        "closed",

      label:
        "Finalizado",

      detail:
        `El plazo finalizó el ${formatDate(
          end!,
        )}.`,

      progress:
        100,
    };
  }

  /*
   * Está abierto.
   */
  if (
    endDay !== null
  ) {
    const remainingDays =
      Math.max(
        0,
        endDay -
          today,
      );

    let progress =
      0;

    if (
      startDay !== null &&
      endDay >
        startDay
    ) {
      const total =
        endDay -
        startDay;

      const elapsed =
        Math.max(
          0,
          Math.min(
            total,
            today -
              startDay,
          ),
        );

      progress =
        Math.round(
          (elapsed /
            total) *
            100,
        );
    }

    return {
      state:
        "open",

      label:
        "Abierto",

      detail:
        remainingDays ===
        0
          ? "El plazo termina hoy."
          : remainingDays ===
              1
            ? "Queda 1 día."
            : `Quedan ${remainingDays} días.`,

      progress,
    };
  }

  /*
   * Tenemos inicio pero no fin.
   */
  if (
    startDay !== null &&
    today >= startDay
  ) {
    return {
      state:
        "open",

      label:
        "Abierto",

      detail:
        "El plazo está iniciado. No consta fecha de finalización.",

      progress:
        0,
    };
  }

  return {
    state:
      "unknown",

    label:
      "Sin información",

    detail:
      "No se puede determinar el estado del plazo.",

    progress:
      0,
  };
}

/*
 * Convierte una fecha en número
 * de día calendario.
 */
function getDateDayNumber(
  date:
    | Date
    | null,
): number | null {
  if (!date) {
    return null;
  }

  return Math.floor(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ) /
      MILLISECONDS_PER_DAY,
  );
}

/*
 * Día actual según Europe/Madrid.
 */
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
      MILLISECONDS_PER_DAY,
  );
}

/*
 * Formato de fecha.
 */
function formatDate(
  date: Date,
): string {
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
  ).format(date);
}

/*
 * Rango de fechas.
 */
function formatDateRange(
  start:
    | Date
    | null,
  end:
    | Date
    | null,
): string {
  if (
    start &&
    end
  ) {
    return `${formatDate(
      start,
    )} - ${formatDate(
      end,
    )}`;
  }

  if (start) {
    return `Desde el ${formatDate(
      start,
    )}`;
  }

  if (end) {
    return `Hasta el ${formatDate(
      end,
    )}`;
  }

  return "Fecha no disponible";
}

/*
 * Devuelve el dominio de una URL.
 */
function getHostname(
  url: string,
): string {
  try {
    return new URL(
      url,
    ).hostname;
  } catch {
    return url;
  }
}

/*
 * NUEVO:
 *
 * URL segura para volver
 * a los resultados.
 *
 * Solo aceptamos:
 *
 * /convocatorias
 *
 * o
 *
 * /convocatorias?...
 *
 * Así evitamos que returnTo pueda
 * redirigir a una web externa.
 */
function getSafeResultsHref(
  returnTo:
    | string
    | undefined,
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