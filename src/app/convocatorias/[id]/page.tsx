import type { ReactNode } from "react";

import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookmarkPlus,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Clock,
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

export default async function SelectionProcessDetailPage({
  params,
}: SelectionProcessDetailPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = Boolean(session?.user);

  const { id } = await params;

  const selectionProcessId = Number(id);

  if (
    !Number.isInteger(selectionProcessId) ||
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
    findBaseDocument(selectionProcess.documents);

  const importantDates =
    buildImportantDates(selectionProcess);

  const applicationPeriod =
    getApplicationPeriod(selectionProcess);

  const informationText =
    buildInformationText(selectionProcess);

  const requirements =
    buildRequirements(selectionProcess);

  const officialSources =
    buildOfficialSources(selectionProcess);

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated={isAuthenticated}
        activeItem="convocatorias"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Detalle de convocatoria"
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
          <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* COLUMNA PRINCIPAL */}
            <div className="flex min-w-0 flex-col gap-5">
              {/* Cabecera convocatoria */}
              <header className="flex flex-col gap-3.5 pb-1">
                <Link
                  href="/convocatorias"
                  className="inline-flex w-fit items-center gap-1.5 text-[13.5px] font-semibold text-[#4E5870] hover:text-[#3B45B5]"
                >
                  <ArrowLeft size={15} />
                  Volver a los resultados
                </Link>

                <div className="flex flex-wrap items-center gap-3">
                  <OfficialStatusBadge
                    status={selectionProcess.status}
                  />

                  {selectionProcess.lastDocumentPublicationDate && (
                    <span className="text-[13.5px] text-[#7C859B]">
                      Última publicación oficial:{" "}
                      {formatDate(
                        selectionProcess.lastDocumentPublicationDate,
                      )}
                    </span>
                  )}
                </div>

                <h1 className="max-w-[900px] text-[34px] font-semibold leading-[1.15] tracking-[-0.025em] text-[#131A2C]">
                  {selectionProcess.title}
                </h1>

                {selectionProcess.institution && (
                  <p className="flex items-center gap-2 text-base text-[#4E5870]">
                    <Building2
                      size={18}
                      className="shrink-0 text-[#7C859B]"
                    />

                    {selectionProcess.institution.name}
                  </p>
                )}
              </header>

              {/* Resumen 5 columnas */}
              <section className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="grid sm:grid-cols-2 xl:grid-cols-5">
                  <SummaryItem
                    icon={<Users size={15} />}
                    label="Plazas"
                    value={
                      selectionProcess.numberOfPositions !== null
                        ? String(
                            selectionProcess.numberOfPositions,
                          )
                        : "—"
                    }
                  />

                  <SummaryItem
                    icon={<GraduationCap size={15} />}
                    label="Grupo"
                    value={
                      selectionProcess.qualificationGroup ??
                      "—"
                    }
                    bordered
                  />

                  <SummaryItem
                    icon={<BriefcaseBusiness size={15} />}
                    label="Personal"
                    value={
                      selectionProcess.personnelType ??
                      "—"
                    }
                    bordered
                  />

                  <SummaryItem
                    icon={<Scale size={15} />}
                    label="Sistema"
                    value={
                      selectionProcess.selectionSystem ??
                      "—"
                    }
                    bordered
                  />

                  <SummaryItem
                    icon={<MapPin size={15} />}
                    label="Municipio"
                    value={
                      selectionProcess.institution
                        ?.municipality ??
                      "—"
                    }
                    secondary={
                      selectionProcess.institution?.county ??
                      undefined
                    }
                    bordered
                  />
                </div>
              </section>

              {/* Información */}
              <ContentSection title="Información">
                <div className="flex max-w-[760px] flex-col gap-3 text-[15px] leading-[1.65] text-[#4E5870]">
                  <p>{informationText}</p>

                  {selectionProcess.observations && (
                    <p className="whitespace-pre-line">
                      {selectionProcess.observations}
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
                          selectionProcess.applicationDeadlineNotes
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
                      (requirement, index) => (
                        <li
                          key={`${index}-${requirement}`}
                          className="flex gap-3 text-[14.5px] leading-[1.55] text-[#131A2C]"
                        >
                          <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[#4F5BD5] text-[#4F5BD5]">
                            <Check size={12} />
                          </span>

                          <span className="whitespace-pre-line">
                            {requirement}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </ContentSection>
              )}

              {/* Proceso selectivo */}
              <ContentSection title="Proceso selectivo">
                <ol className="flex flex-col">
                  <ProcessStep
                    number={1}
                    title="Presentación de solicitudes"
                    detail={formatDateRange(
                      selectionProcess.applicationStartDate,
                      selectionProcess.applicationEndDate,
                    )}
                    active={
                      applicationPeriod.state === "open"
                    }
                    showLine
                  />

                  <ProcessStep
                    number={2}
                    title="Última publicación oficial"
                    detail={
                      selectionProcess.lastDocumentPublicationDate
                        ? formatDate(
                            selectionProcess.lastDocumentPublicationDate,
                          )
                        : "Pendiente de publicación"
                    }
                    showLine
                  />

                  <ProcessStep
                    number={3}
                    title="Primera prueba"
                    detail={
                      selectionProcess.firstExamDate
                        ? formatDate(
                            selectionProcess.firstExamDate,
                          )
                        : "Fecha pendiente de publicar"
                    }
                  />
                </ol>

                <p className="mt-5 rounded-lg bg-[#F4F6F9] px-4 py-3 text-[13px] leading-relaxed text-[#69738A]">
                  En el siguiente paso ampliaremos este
                  timeline automáticamente con las fases
                  publicadas en los documentos oficiales.
                </p>
              </ContentSection>

              {/* Fechas importantes */}
              {importantDates.length > 0 && (
                <ContentSection title="Fechas importantes">
                  <ul className="flex flex-col">
                    {importantDates.map(
                      (importantDate, index) => (
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
                              importantDate.date,
                            )}
                          </p>

                          <p className="text-sm text-[#4E5870]">
                            {importantDate.label}
                          </p>

                          <DateState
                            date={importantDate.date}
                          />
                        </li>
                      ),
                    )}
                  </ul>
                </ContentSection>
              )}

              {/* Documentos */}
              <ContentSection title="Documentos">
                {selectionProcess.documents.length === 0 ? (
                  <p className="text-sm text-[#69738A]">
                    No hay documentos disponibles.
                  </p>
                ) : (
                  <ul>
                    {selectionProcess.documents.map(
                      (document, index) => (
                        <li
                          key={document.id}
                          className={
                            index === 0
                              ? "flex flex-col gap-3 py-3 sm:flex-row sm:items-center"
                              : "flex flex-col gap-3 border-t border-[#EEF1F5] py-3 sm:flex-row sm:items-center"
                          }
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EEF0FC] text-[#3B45B5]">
                            <FileText size={19} />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="text-[14.5px] font-semibold text-[#131A2C]">
                              {document.summary ||
                                document.phase}
                            </p>

                            <p className="mt-0.5 text-[13px] text-[#7C859B]">
                              {buildDocumentMetadata(
                                document,
                              )}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <a
                              href={document.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 text-[13px] font-semibold text-[#131A2C] shadow-sm hover:bg-[#F4F6F9]"
                            >
                              Abrir documento
                              <ExternalLink size={14} />
                            </a>

                            {document.htmlUrl && (
                              <a
                                href={document.htmlUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 text-[13px] font-semibold text-[#131A2C] shadow-sm hover:bg-[#F4F6F9]"
                              >
                                HTML
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </ContentSection>

              {/* Fuentes oficiales */}
              <ContentSection title="Fuentes oficiales">
                <div className="flex flex-col gap-3">
                  <ul className="flex flex-col gap-2">
                    {officialSources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3.5 rounded-[10px] border border-[#E3E7EE] bg-[#FAFBFC] px-4 py-3.5 text-[#131A2C] no-underline hover:bg-[#F4F6F9] hover:no-underline"
                        >
                          <Building2
                            size={18}
                            className="shrink-0 text-[#4E5870]"
                          />

                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">
                              {source.title}
                            </span>

                            <span className="block truncate text-[13px] text-[#3B45B5]">
                              {getHostname(source.url)}
                            </span>
                          </div>

                          <ExternalLink
                            size={16}
                            className="shrink-0 text-[#7C859B]"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>

                  <p className="flex gap-2.5 rounded-[10px] bg-[#F1F3F7] px-3.5 py-3 text-[13px] text-[#4E5870]">
                    <Info
                      size={16}
                      className="shrink-0 text-[#7C859B]"
                    />

                    <span>
                      Convoca&apos;m recopila y organiza
                      información pública. Antes de presentar
                      una solicitud, consulta siempre las
                      fuentes oficiales.
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
                      status={selectionProcess.status}
                      small
                    />
                  </div>

                  <div className="h-px bg-[#EEF1F5]" />

                  <div className="flex flex-col gap-2.5">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
                      Plazo de inscripción
                    </p>

                    <p className="text-[17px] font-semibold tracking-[-0.01em] text-[#131A2C]">
                      {formatDateRange(
                        selectionProcess.applicationStartDate,
                        selectionProcess.applicationEndDate,
                      )}
                    </p>

                    {applicationPeriod.progress !== null && (
                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={
                          applicationPeriod.progress
                        }
                        className="h-1.5 overflow-hidden rounded-full bg-[#EEF1F5]"
                      >
                        <div
                          className="h-1.5 rounded-full bg-[#23A26B]"
                          style={{
                            width: `${applicationPeriod.progress}%`,
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[22px] font-semibold tracking-[-0.02em] text-[#131A2C]">
                        {applicationPeriod.text}
                      </p>
                    </div>

                    {selectionProcess.applicationEndTime && (
                      <p className="text-[13px] text-[#7C859B]">
                        Hora límite:{" "}
                        {
                          selectionProcess.applicationEndTime
                        }
                      </p>
                    )}
                  </div>

                  {/* Seguir: todavía sin persistencia */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[10px] border border-[#DDE1FA] bg-[#EEF0FC] px-5 text-[15px] font-semibold text-[#3B45B5] opacity-75"
                    >
                      <BookmarkPlus size={17} />
                      Seguir convocatoria
                    </button>

                    <p className="text-center text-[12.5px] text-[#7C859B]">
                      Se activará cuando implementemos
                      Mis convocatorias.
                    </p>
                  </div>

                  {selectionProcess.applicationUrl && (
                    <a
                      href={selectionProcess.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#4F5BD5] px-4 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                    >
                      Presentar solicitud
                      <ExternalLink size={16} />
                    </a>
                  )}

                  {baseDocument && (
                    <a
                      href={baseDocument.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#131A2C] shadow-sm hover:bg-[#F4F6F9]"
                    >
                      Abrir las bases
                      <ExternalLink size={16} />
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
                      <Lock size={12} />
                      Solo lo ves tú
                    </span>
                  </div>

                  <p className="text-[13.5px] leading-relaxed text-[#4E5870]">
                    Sigue la convocatoria para indicar en qué
                    punto estás: desde{" "}
                    <strong>Me interesa</strong> hasta{" "}
                    <strong>Finalizado</strong>. Tu estado
                    personal no modifica el estado oficial.
                  </p>
                </div>
              </section>

              {/* Datos técnicos */}
              <section className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex flex-col gap-3 px-6 py-5">
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
                    Referencia
                  </p>

                  <SidebarValue
                    label="Identificador CIDO"
                    value={selectionProcess.cidoIdentifier}
                  />

                  {selectionProcess.fileNumber && (
                    <SidebarValue
                      label="Expediente"
                      value={selectionProcess.fileNumber}
                    />
                  )}

                  <SidebarValue
                    label="Ámbito"
                    value={selectionProcess.scope}
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

/*
 * Sección principal de la ficha.
 */
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

/*
 * Resumen superior.
 */
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

/*
 * Timeline.
 *
 * En este paso todavía usamos únicamente
 * datos que sabemos con seguridad.
 */
function ProcessStep({
  number,
  title,
  detail,
  active = false,
  showLine = false,
}: {
  number: number;
  title: string;
  detail: string;
  active?: boolean;
  showLine?: boolean;
}) {
  return (
    <li className="flex gap-4">
      <div className="flex w-7 shrink-0 flex-col items-center">
        <span
          className={
            active
              ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#4F5BD5] text-[13px] font-bold text-white shadow-[0_0_0_4px_#EEF0FC]"
              : "inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-[#D5DAE3] bg-white text-[13px] font-semibold text-[#7C859B]"
          }
        >
          {number}
        </span>

        {showLine && (
          <span className="my-1 min-h-[26px] w-0.5 flex-1 bg-[#E3E7EE]" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 pb-5 pt-0.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <p
            className={
              active
                ? "text-[15px] font-semibold text-[#131A2C]"
                : "text-[15px] font-semibold text-[#4E5870]"
            }
          >
            {title}
          </p>

          {active && (
            <span className="inline-flex h-[22px] items-center rounded-md bg-[#EEF0FC] px-2 text-xs font-semibold text-[#3B45B5]">
              Fase actual
            </span>
          )}
        </div>

        <p className="text-[13.5px] text-[#7C859B]">
          {detail}
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

function DateState({
  date,
}: {
  date: Date;
}) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);

  if (target.getTime() < today.getTime()) {
    return (
      <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#7C859B]">
        <Check size={13} />
        Realizada
      </span>
    );
  }

  if (target.getTime() === today.getTime()) {
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

/*
 * Información general.
 *
 * No inventamos una descripción:
 * construimos un texto únicamente con
 * datos existentes en PostgreSQL.
 */
function buildInformationText(
  selectionProcess: SelectionProcessDetailDto,
): string {
  const parts: string[] = [];

  if (selectionProcess.isJobPool) {
    parts.push(
      "Convocatoria para la constitución de una bolsa de trabajo",
    );
  } else if (
    selectionProcess.numberOfPositions !== null
  ) {
    parts.push(
      `Convocatoria para ${selectionProcess.numberOfPositions} ${
        selectionProcess.numberOfPositions === 1
          ? "plaza"
          : "plazas"
      }`,
    );
  } else {
    parts.push("Proceso selectivo");
  }

  if (selectionProcess.selectionSystem) {
    parts.push(
      `mediante ${selectionProcess.selectionSystem}`,
    );
  }

  if (selectionProcess.personnelType) {
    parts.push(
      `para personal ${selectionProcess.personnelType}`,
    );
  }

  if (selectionProcess.qualificationGroup) {
    parts.push(
      `del grupo ${selectionProcess.qualificationGroup}`,
    );
  }

  if (selectionProcess.institution?.name) {
    parts.push(
      `de ${selectionProcess.institution.name}`,
    );
  }

  return `${parts.join(" ")}.`;
}

/*
 * Requisitos disponibles directamente desde CIDO.
 */
function buildRequirements(
  selectionProcess: SelectionProcessDetailDto,
): string[] {
  const requirements: string[] = [];

  if (selectionProcess.requiredQualification) {
    requirements.push(
      `Titulación requerida: ${selectionProcess.requiredQualification}`,
    );
  }

  if (selectionProcess.otherRequirements) {
    requirements.push(
      selectionProcess.otherRequirements,
    );
  }

  return requirements;
}

/*
 * Fechas que tenemos estructuradas.
 */
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
    selectionProcess.lastDocumentPublicationDate
  ) {
    dates.push({
      date:
        selectionProcess.lastDocumentPublicationDate,
      label: "Última publicación oficial",
    });
  }

  if (selectionProcess.applicationStartDate) {
    dates.push({
      date: selectionProcess.applicationStartDate,
      label:
        "Inicio del plazo de presentación de solicitudes",
    });
  }

  if (selectionProcess.applicationEndDate) {
    dates.push({
      date: selectionProcess.applicationEndDate,
      label:
        "Fin del plazo de presentación de solicitudes",
    });
  }

  if (selectionProcess.firstExamDate) {
    dates.push({
      date: selectionProcess.firstExamDate,
      label: "Primera prueba",
    });
  }

  return dates.sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime(),
  );
}

/*
 * Fuentes oficiales que realmente tenemos.
 */
function buildOfficialSources(
  selectionProcess: SelectionProcessDetailDto,
): {
  title: string;
  url: string;
}[] {
  const sources: {
    title: string;
    url: string;
  }[] = [];

  if (selectionProcess.institutionUrl) {
    sources.push({
      title: selectionProcess.institution
        ? `Web oficial de ${selectionProcess.institution.name}`
        : "Web oficial del organismo",
      url: selectionProcess.institutionUrl,
    });
  }

  if (selectionProcess.applicationUrl) {
    sources.push({
      title: "Presentación de solicitudes",
      url: selectionProcess.applicationUrl,
    });
  }

  sources.push({
    title: "CIDO — información de la convocatoria",
    url: selectionProcess.cidoUrl,
  });

  return sources;
}

/*
 * Busca el documento que parece corresponder
 * a las bases de la convocatoria.
 */
function findBaseDocument(
  documents: SelectionProcessDetailDto["documents"],
) {
  return documents.find((document) => {
    const text =
      `${document.phase} ${document.summary}`.toLowerCase();

    return (
      text.includes("base") ||
      text.includes("bases")
    );
  });
}

function buildDocumentMetadata(
  document: SelectionProcessDetailDto["documents"][number],
): string {
  const values = [
    document.phase,
    document.publisher,
    document.bulletin,
    formatDate(document.publicationDate),
  ].filter(
    (value): value is string =>
      typeof value === "string" &&
      value.trim().length > 0,
  );

  return [...new Set(values)].join(" · ");
}

function getApplicationPeriod(
  selectionProcess: SelectionProcessDetailDto,
): {
  state: "open" | "future" | "closed" | "unknown";
  text: string;
  progress: number | null;
} {
  const start =
    selectionProcess.applicationStartDate;

  const end =
    selectionProcess.applicationEndDate;

  if (!start || !end) {
    return {
      state: "unknown",
      text: "Plazo no disponible",
      progress: null,
    };
  }

  const today = startOfDay(new Date());
  const startDate = startOfDay(start);
  const endDate = startOfDay(end);

  if (today.getTime() < startDate.getTime()) {
    return {
      state: "future",
      text: "Todavía no ha comenzado",
      progress: 0,
    };
  }

  if (today.getTime() > endDate.getTime()) {
    return {
      state: "closed",
      text: "Plazo finalizado",
      progress: 100,
    };
  }

  const totalDays = Math.max(
    1,
    differenceInDays(
      endDate,
      startDate,
    ),
  );

  const elapsedDays = Math.max(
    0,
    differenceInDays(
      today,
      startDate,
    ),
  );

  const remainingDays = Math.max(
    0,
    differenceInDays(
      endDate,
      today,
    ),
  );

  const progress = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (elapsedDays / totalDays) * 100,
      ),
    ),
  );

  return {
    state: "open",
    text:
      remainingDays === 0
        ? "Finaliza hoy"
        : `Quedan ${remainingDays} ${
            remainingDays === 1
              ? "día"
              : "días"
          }`,
    progress,
  };
}

function differenceInDays(
  later: Date,
  earlier: Date,
): number {
  const milliseconds =
    later.getTime() - earlier.getTime();

  return Math.floor(
    milliseconds / 86_400_000,
  );
}

function startOfDay(
  date: Date,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "es-ES",
  ).format(date);
}

function formatDateRange(
  start: Date | null,
  end: Date | null,
): string {
  if (start && end) {
    return `${formatDate(start)} – ${formatDate(end)}`;
  }

  if (start) {
    return `Desde ${formatDate(start)}`;
  }

  if (end) {
    return `Hasta ${formatDate(end)}`;
  }

  return "No especificado";
}

function getHostname(
  url: string,
): string {
  try {
    return new URL(url).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return url;
  }
}