import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ExternalLink,
  FileText,
  MapPin,
} from "lucide-react";
import type { UserSelectionProcessListItem } from
  "@/modules/user-selection-process/application/user-selection-process-list-item";
import {
  buildApplicationPeriodBadgeText,
  hasReservedPlaces,
} from "@/modules/selection-process/presentation/selection-process-badges";
import {
  getApplicationPeriodPresentation,
  getOfficialStatusPresentation,
} from "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";
import { PersonalSelectionProcessStatusPicker } from "@/modules/user-selection-process/presentation/personal-selection-process-status-picker";
import { UnfollowSelectionProcessForm } from "@/modules/user-selection-process/presentation/unfollow-selection-process-form";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";
import {
  changePersonalStatusFromMySelectionProcessesAction,
  unfollowFromMySelectionProcessesAction,
} from "./actions";
import {
  buildApplicationSummary,
  buildLocationText,
  formatCataloniaDate,
} from "./my-selection-processes-presentation";

/**
 * Tarjeta de una convocatoria seguida: estado oficial, plazo,
 * último documento, estado personal y acciones.
 */
export function MySelectionProcessCard({
  item,
  returnTo,
  today,
}: {
  item: UserSelectionProcessListItem;
  /** URL actual con los filtros, para volver desde el detalle. */
  returnTo: string;
  today: Date;
}) {
  const convocatoria = item.selectionProcess;
  const { reservedPlaces, latestDocument } = convocatoria;
  const officialStatus = getOfficialStatusPresentation(
    convocatoria.status,
    convocatoria.statusId,
  );
  const applicationPeriod = getApplicationPeriodPresentation(
    convocatoria.applicationStartDate,
    convocatoria.applicationEndDate,
  );
  const applicationSummary = buildApplicationSummary(
    applicationPeriod,
    convocatoria.applicationStartDate,
    convocatoria.applicationEndDate,
    today,
  );
  const detailHref = `/convocatorias/${convocatoria.id}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-1 flex-col p-4">
        {/* ESTADO / TIPO / PLAZO */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${officialStatus.badgeClassName}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${officialStatus.dotClassName}`} />
            {officialStatus.label}
          </span>
          <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-3 text-xs font-semibold text-[#3B45B5]">
            {convocatoria.isJobPool ? "Bolsa de trabajo" : "Plaza de plantilla"}
          </span>
          <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${applicationPeriod.badgeClassName}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${applicationPeriod.dotClassName}`} />
            {buildApplicationPeriodBadgeText(applicationPeriod)}
          </span>
        </div>

        {/* TÍTULO / UBICACIÓN */}
        <div className="mt-4">
          <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#131A2C]">
            {formatSelectionProcessTitle(convocatoria.title)}
          </h3>
          <div className="mt-2 flex items-start gap-2 text-[13.5px] text-[#4E5870]">
            <MapPin size={15} className="mt-0.5 shrink-0 text-[#7C859B]" />
            <span>{buildLocationText(convocatoria.institution)}</span>
          </div>
        </div>

        {/* SOLICITUD */}
        <div className="mt-4 rounded-lg border border-[#E7EAF0] bg-[#F7F8FA] px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <CalendarClock size={17} className="mt-0.5 shrink-0 text-[#4F5BD5]" />
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

        {/* RESERVAS */}
        {hasReservedPlaces(reservedPlaces) && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
              Reservas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(reservedPlaces.disability ?? 0) > 0 && (
                <ReservationBadge>
                  Discapacidad: {reservedPlaces.disability}
                </ReservationBadge>
              )}
              {reservedPlaces.unemployed && (
                <ReservationBadge>Personas desempleadas</ReservationBadge>
              )}
              {reservedPlaces.youngPeople && (
                <ReservationBadge>Jóvenes</ReservationBadge>
              )}
              {reservedPlaces.women && (
                <ReservationBadge>Mujeres</ReservationBadge>
              )}
            </div>
          </div>
        )}

        {/* ÚLTIMO DOCUMENTO */}
        <div className="mt-4 border-t border-[#EEF1F5] pt-3">
          {latestDocument ? (
            <a
              href={latestDocument.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-start justify-between gap-3 rounded-lg px-1 py-1.5 text-[#3B45B5] hover:text-[#2E3794]"
            >
              <span className="flex min-w-0 items-start gap-2">
                <FileText size={16} className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    Último documento oficial
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-[#7C859B]">
                    Publicado el {formatCalendarDate(latestDocument.publicationDate)}
                  </span>
                </span>
              </span>
              <ExternalLink size={15} className="mt-0.5 shrink-0" />
            </a>
          ) : (
            <div className="flex items-center gap-2 px-1 py-1.5 text-sm text-[#7C859B]">
              <FileText size={16} className="shrink-0" />
              <span>Sin documentos oficiales disponibles</span>
            </div>
          )}
        </div>

        {/* MI ESTADO */}
        <div className="mt-3">
          <PersonalSelectionProcessStatusPicker
            selectionProcessId={convocatoria.id}
            currentStatus={item.personalStatus}
            action={changePersonalStatusFromMySelectionProcessesAction}
          />
        </div>

        {/* INFORMACIÓN PERSONAL */}
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-[#FAFBFC] px-3.5 py-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#8A93A7]">
              Siguiendo desde
            </p>
            <p className="mt-1 text-xs font-medium text-[#4E5870]">
              {formatCataloniaDate(item.followedAt)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#8A93A7]">
              Último cambio de estado
            </p>
            <p className="mt-1 text-xs font-medium text-[#4E5870]">
              {formatCataloniaDate(item.personalStatusUpdatedAt)}
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-3 flex-1" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1F5] pt-3">
          <UnfollowSelectionProcessForm
            selectionProcessId={convocatoria.id}
            action={unfollowFromMySelectionProcessesAction}
          />
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Link
              href={detailHref}
              className="inline-flex items-center justify-center rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]"
            >
              Ver detalle
            </Link>
            <a
              href={convocatoria.cidoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
            >
              Ver convocatoria oficial
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function ReservationBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-6 items-center rounded-full border border-[#DDE1E8] bg-[#F4F6F9] px-2.5 text-[11px] font-medium text-[#4E5870]">
      {children}
    </span>
  );
}
