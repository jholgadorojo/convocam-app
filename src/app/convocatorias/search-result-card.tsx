import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import type { SelectionProcessListItem } from
  "@/modules/selection-process/application/selection-process-list-item";
import {
  buildApplicationPeriodBadgeText,
  hasReservedPlaces,
} from "@/modules/selection-process/presentation/selection-process-badges";
import {
  formatInstitutionLocation,
  formatNumberOfPositions,
} from "@/modules/selection-process/presentation/selection-process-format";
import {
  getApplicationPeriodPresentation,
  getOfficialStatusPresentation,
} from "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";

/** Tarjeta de una convocatoria en el listado del buscador. */
export function SearchResultCard({
  item,
  returnTo,
}: {
  item: SelectionProcessListItem;
  /** URL actual del buscador, para volver desde el detalle. */
  returnTo: string;
}) {
  const { reservedPlaces } = item;
  const officialStatus = getOfficialStatusPresentation(item.status, item.statusId);
  const applicationPeriod = getApplicationPeriodPresentation(
    item.applicationStartDate,
    item.applicationEndDate,
  );

  return (
    <article className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-3 text-xs font-semibold text-[#3B45B5]">
            {item.isJobPool ? "Bolsa de trabajo" : "Plaza de plantilla"}
          </span>
          <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${officialStatus.badgeClassName}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${officialStatus.dotClassName}`} />
            Oficial: {officialStatus.label}
          </span>
          <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${applicationPeriod.badgeClassName}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${applicationPeriod.dotClassName}`} />
            Solicitudes: {buildApplicationPeriodBadgeText(applicationPeriod)}
          </span>
        </div>

        <div>
          <h3 className="text-[17px] font-semibold sm:text-[18px] leading-snug tracking-[-0.01em] text-[#131A2C]">
            {formatSelectionProcessTitle(item.title)}
          </h3>
          <div className="mt-3 flex flex-col gap-2 text-sm text-[#4E5870]">
            <div className="flex items-start gap-2">
              <Building2 size={16} className="mt-0.5 shrink-0 text-[#646E85]" />
              <span>{item.institution?.name ?? "Organismo no disponible"}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[#646E85]" />
              <span>{formatInstitutionLocation(item.institution)}</span>
            </div>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] grid-cols-2 xl:grid-cols-3">
          <ResultInfoItem
            label="Plazas"
            value={formatNumberOfPositions(item.numberOfPositions, item.isJobPool)}
          />
          <ResultInfoItem label="Grupo" value={item.qualificationGroup ?? "No especificado"} />
          <ResultInfoItem label="Personal" value={item.personnelType ?? "No especificado"} />
          <ResultInfoItem label="Sistema" value={item.selectionSystem ?? "No especificado"} />
          <ResultInfoItem label="Ámbito" value={item.scope || "No especificado"} />
          <ResultInfoItem
            label="Fin del plazo de solicitud"
            value={formatCalendarDate(item.applicationEndDate, "No disponible")}
          />
        </div>

        {hasReservedPlaces(reservedPlaces) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-[0.04em] text-[#646E85]">
              Reservas
            </span>
            {(reservedPlaces.disability ?? 0) > 0 && (
              <ReservationBadge>Discapacidad: {reservedPlaces.disability}</ReservationBadge>
            )}
            {reservedPlaces.unemployed && (
              <ReservationBadge>Personas desempleadas</ReservationBadge>
            )}
            {reservedPlaces.youngPeople && <ReservationBadge>Jóvenes</ReservationBadge>}
            {reservedPlaces.women && <ReservationBadge>Mujeres</ReservationBadge>}
          </div>
        )}

        <div className="flex flex-col gap-2.5 border-t border-[#EEF1F5] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Link
            href={`/convocatorias/${item.id}?returnTo=${encodeURIComponent(returnTo)}`}
            className="inline-flex items-center justify-center rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]"
          >
            Ver detalle
          </Link>
          <a
            href={item.cidoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
          >
            Ver convocatoria oficial
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </article>
  );
}

function ResultInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-r border-[#E7EAF0] px-3 py-3 sm:px-4">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#646E85]">
        {label}
      </p>
      <p className="mt-1 break-words text-[13.5px] font-medium leading-snug text-[#131A2C]">
        {value}
      </p>
    </div>
  );
}

function ReservationBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1E8] bg-[#F4F6F9] px-3 text-xs font-medium text-[#4E5870]">
      {children}
    </span>
  );
}
