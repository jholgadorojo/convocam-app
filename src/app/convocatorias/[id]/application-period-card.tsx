import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { getApplicationPeriodPresentation } from "@/modules/selection-process/presentation/selection-process-status";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";
import { calculateApplicationProgress } from "./detail-presentation";

/** Estado del plazo de solicitud, fechas y barra de progreso. */
export function ApplicationPeriodCard({
  selectionProcess,
  today,
}: {
  selectionProcess: Pick<
    SelectionProcessDetailDto,
    | "applicationStartDate"
    | "applicationEndDate"
    | "applicationEndTime"
    | "applicationDeadlineNotes"
  >;
  today: Date;
}) {
  const {
    applicationStartDate,
    applicationEndDate,
    applicationEndTime,
    applicationDeadlineNotes,
  } = selectionProcess;
  const applicationPeriod = getApplicationPeriodPresentation(
    applicationStartDate,
    applicationEndDate,
  );
  const applicationProgress = calculateApplicationProgress(
    applicationStartDate,
    applicationEndDate,
    today,
  );

  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
        Plazo de solicitud
      </p>
      <div className="mt-3">
        <span
          className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3.5 text-sm font-semibold ${applicationPeriod.badgeClassName}`}
        >
          <span className={`h-2 w-2 rounded-full ${applicationPeriod.dotClassName}`} />
          {applicationPeriod.label}
        </span>
        <p className="mt-3 text-sm font-semibold text-[#131A2C]">
          {applicationPeriod.detail}
        </p>
      </div>
      {applicationStartDate && (
        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <span className="text-[#7C859B]">Inicio</span>
          <span className="font-semibold text-[#4E5870]">
            {formatCalendarDate(applicationStartDate)}
          </span>
        </div>
      )}
      {applicationEndDate && (
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="text-[#7C859B]">Fin</span>
          <span className="font-semibold text-[#4E5870]">
            {formatCalendarDate(applicationEndDate)}
            {applicationEndTime ? ` · ${applicationEndTime}` : ""}
          </span>
        </div>
      )}
      {applicationProgress !== null && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-[#E9ECF2]">
            <div
              className="h-full rounded-full bg-[#4F5BD5]"
              style={{ width: `${applicationProgress}%` }}
            />
          </div>
        </div>
      )}
      {applicationDeadlineNotes && (
        <p className="mt-3 text-xs leading-relaxed text-[#69738A]">
          {applicationDeadlineNotes}
        </p>
      )}
    </section>
  );
}
