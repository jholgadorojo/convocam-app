import Link from "next/link";
import {
  CalendarClock,
  ExternalLink,
  MapPin,
} from "lucide-react";
import type { SelectionProcessListItem } from
  "@/modules/selection-process/application/selection-process-list-item";
import {
  getApplicationPeriodPresentation,
  getOfficialStatusPresentation,
} from "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";
import { followFromForMeAction } from "./actions";
import { locationText } from "./for-me-presentation";

/** Tarjeta de una convocatoria recomendada, con el botón para seguirla. */
export function ForMeCard({
  item,
  returnTo,
  matchReasons,
  showTerritorialNote,
}: {
  item: SelectionProcessListItem;
  /** URL actual de «Para mí», para volver desde el detalle. */
  returnTo: string;
  matchReasons: string[];
  /** Aviso de que la ubicación es la del organismo convocante. */
  showTerritorialNote: boolean;
}) {
  const officialStatus = getOfficialStatusPresentation(
    item.status,
    item.statusId,
  );
  const applicationPeriod = getApplicationPeriodPresentation(
    item.applicationStartDate,
    item.applicationEndDate,
  );
  const detailHref = `/convocatorias/${item.id}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <article
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm transition-shadow hover:shadow-md"
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
          <MapPin size={15} className="mt-0.5 shrink-0 text-[#646E85]" />
          <span>{locationText(item.institution)}</span>
        </p>

        <div className="mt-4 rounded-lg border border-[#E7EAF0] bg-[#F7F8FA] px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <CalendarClock size={17} className="mt-0.5 shrink-0 text-[#4F5BD5]" />
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#646E85]">
                Plazo de solicitud
              </p>
              <p className="mt-1 text-sm font-semibold text-[#131A2C]">
                {applicationPeriod.label}
                {(applicationPeriod.state === "open" || applicationPeriod.state === "future") &&
                  ` · ${applicationPeriod.detail}`}
              </p>
              <p className="mt-1 text-xs text-[#69738A]">
                Inicio: {formatCalendarDate(item.applicationStartDate, "No indicada")}
                {" · "}Fin: {formatCalendarDate(item.applicationEndDate, "No indicada")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#646E85]">
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
          {showTerritorialNote && (
            <p className="mt-1.5 text-[11px] text-[#646E85]">
              La coincidencia territorial se basa en la ubicación
              del organismo convocante, no necesariamente del puesto.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#EEF1F5] pt-3">
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
            className="inline-flex items-center rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
          >
            Ver detalle
          </Link>
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
        </div>
      </div>
    </article>
  );
}
