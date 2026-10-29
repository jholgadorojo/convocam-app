import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  MapPin,
} from "lucide-react";
import type { PersonalDashboardUpcomingDeadline } from
  "@/modules/dashboard/application/get-personal-dashboard-deadlines";
import { formatSelectionProcessTitle } from
  "@/modules/selection-process/presentation/selection-process-title";
import { getPersonalSelectionProcessStatusLabel } from
  "@/modules/user-selection-process/presentation/personal-selection-process-status";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";
import {
  dashboardDetailHref,
  deadlineBadgeClasses,
  deadlineBadgeLabel,
  secondaryDetailButtonClasses,
} from "./dashboard-presentation";

/** Panel izquierdo: cinco plazos próximos de convocatorias seguidas. */
export function UpcomingDeadlinesPanel({
  items,
}: {
  items: PersonalDashboardUpcomingDeadline[];
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF1F5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock size={19} className="text-[#4F5BD5]" />
            <h2 className="text-lg font-semibold text-[#131A2C]">
              Plazos próximos
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#69738A]">
            Los cinco vencimientos más cercanos en los próximos 15 días.
          </p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="py-8">
          <p className="text-sm font-medium text-[#4E5870]">
            No tienes plazos de solicitud próximos.
          </p>
          <p className="mt-1 text-sm text-[#69738A]">
            Aquí aparecerán las convocatorias seguidas con estado
            «Me interesa» o «Preparando solicitud» cuyo plazo finalice
            dentro de los próximos 15 días.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEF1F5]">
          {items.map((item) => (
            <article
              key={item.selectionProcessId}
              className="min-w-0 py-4 first:pt-4 last:pb-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${deadlineBadgeClasses(item.daysRemaining)}`}
                >
                  {deadlineBadgeLabel(item.daysRemaining)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#69738A]">
                  <CalendarDays size={14} aria-hidden="true" />
                  Fin: {formatCalendarDate(item.applicationEndDate)}
                </span>
              </div>
              <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug text-[#131A2C]">
                {formatSelectionProcessTitle(item.title)}
              </h3>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-[#4E5870]">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0 text-[#646E85]"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">
                  {item.municipality || "Municipio no indicado"}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#F4F6F9] px-2.5 py-1.5 text-xs font-medium text-[#4E5870]">
                  Mi estado: {getPersonalSelectionProcessStatusLabel(item.personalStatus)}
                </span>
              </div>
              <div className="mt-3 flex justify-end border-t border-[#EEF1F5] pt-3">
                <Link
                  href={dashboardDetailHref(item.selectionProcessId)}
                  className={secondaryDetailButtonClasses}
                >
                  Ver detalle
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
