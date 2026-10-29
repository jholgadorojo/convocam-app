import { Building2, MapPin } from "lucide-react";
import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { getOfficialStatusPresentation } from "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";
import { formatInstitutionLocation } from "@/modules/selection-process/presentation/selection-process-format";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";

/** Cabecera: tipo, estado oficial, título, organismo y ubicación. */
export function DetailHeader({
  selectionProcess,
}: {
  selectionProcess: SelectionProcessDetailDto;
}) {
  const officialStatus = getOfficialStatusPresentation(selectionProcess.status);

  return (
    <section className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-3 text-xs font-semibold text-[#3B45B5]">
            {selectionProcess.isJobPool ? "Bolsa de trabajo" : "Plaza de plantilla"}
          </span>
          <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${officialStatus.badgeClassName}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${officialStatus.dotClassName}`} />
            Estado oficial: {officialStatus.label}
          </span>
          {selectionProcess.lastDocumentPublicationDate && (
            <span className="inline-flex min-h-7 items-center rounded-full border border-[#E3E7EE] bg-[#F7F8FA] px-3 text-xs font-medium text-[#69738A]">
              Última publicación:{" "}
              {formatCalendarDate(selectionProcess.lastDocumentPublicationDate)}
            </span>
          )}
        </div>

        <h1 className="mt-5 max-w-[900px] text-[28px] font-semibold leading-tight tracking-[-0.025em] text-[#131A2C]">
          {formatSelectionProcessTitle(selectionProcess.title)}
        </h1>

        <div className="mt-5 flex flex-col gap-2 text-sm text-[#4E5870]">
          <div className="flex items-start gap-2">
            <Building2 size={17} className="mt-0.5 shrink-0 text-[#646E85]" />
            <span>
              {selectionProcess.institution?.name ?? "Organismo no disponible"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={17} className="mt-0.5 shrink-0 text-[#646E85]" />
            <span>{formatInstitutionLocation(selectionProcess.institution)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
