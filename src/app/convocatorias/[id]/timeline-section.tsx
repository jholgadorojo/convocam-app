import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";
import { DetailSection } from "./detail-section";
import {
  buildTimeline,
  getTimelinePresentation,
  type TimelineItem,
} from "./detail-presentation";

/** Cronología de publicaciones, plazo de solicitud y primera prueba. */
export function TimelineSection({
  selectionProcess,
  today,
}: {
  selectionProcess: SelectionProcessDetailDto;
  today: Date;
}) {
  const timeline = buildTimeline(selectionProcess, today);

  return (
    <DetailSection title="Cronología">
      {timeline.length > 0 ? (
        <div className="flex flex-col">
          {timeline.map((item, index) => (
            <TimelineRow
              key={item.key}
              item={item}
              isLast={index === timeline.length - 1}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#69738A]">
          No hay hitos disponibles para construir la cronología.
        </p>
      )}
    </DetailSection>
  );
}

function TimelineRow({
  item,
  isLast,
}: {
  item: TimelineItem;
  isLast: boolean;
}) {
  const presentation = getTimelinePresentation(item.status);

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
            {presentation.label}
          </span>
        </div>
        <p className="mt-1 text-xs font-medium text-[#646E85]">
          {formatCalendarDate(item.date)}
        </p>
        {item.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-[#4E5870]">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
