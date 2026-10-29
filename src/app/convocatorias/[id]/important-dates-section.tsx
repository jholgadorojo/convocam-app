import { CalendarDays } from "lucide-react";
import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";
import { DetailSection } from "./detail-section";
import {
  buildImportantDates,
  type ImportantDate,
} from "./detail-presentation";

/** Fechas clave con su estado; no se muestra si no hay ninguna. */
export function ImportantDatesSection({
  selectionProcess,
  today,
}: {
  selectionProcess: SelectionProcessDetailDto;
  today: Date;
}) {
  const importantDates = buildImportantDates(selectionProcess, today);

  if (importantDates.length === 0) {
    return null;
  }

  return (
    <DetailSection title="Fechas importantes">
      <div className="grid gap-3 sm:grid-cols-2">
        {importantDates.map((item) => (
          <ImportantDateCard key={item.label} item={item} />
        ))}
      </div>
    </DetailSection>
  );
}

function ImportantDateCard({ item }: { item: ImportantDate }) {
  return (
    <div className="rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] p-4">
      <div className="flex items-start gap-3">
        <CalendarDays size={17} className="mt-0.5 shrink-0 text-[#4F5BD5]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#7C859B]">
            {item.label}
          </p>
          <p className="mt-1.5 text-sm font-semibold text-[#131A2C]">
            {formatCalendarDate(item.date)}
          </p>
          <p className="mt-1 text-xs text-[#69738A]">
            {item.state}
          </p>
        </div>
      </div>
    </div>
  );
}
