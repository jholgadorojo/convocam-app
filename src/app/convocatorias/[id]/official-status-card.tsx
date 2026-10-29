import { ExternalLink } from "lucide-react";
import { getOfficialStatusPresentation } from "@/modules/selection-process/presentation/selection-process-status";

/** Estado oficial publicado por CIDO y enlace a la ficha oficial. */
export function OfficialStatusCard({
  status,
  cidoUrl,
}: {
  status: string;
  cidoUrl: string;
}) {
  const officialStatus = getOfficialStatusPresentation(status);

  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
        Estado oficial CIDO
      </p>
      <div className="mt-3">
        <span
          className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3.5 text-sm font-semibold ${officialStatus.badgeClassName}`}
        >
          <span className={`h-2 w-2 rounded-full ${officialStatus.dotClassName}`} />
          {officialStatus.label}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#7C859B]">
        Estado publicado por la fuente oficial.
      </p>
      <div className="mt-4 border-t border-[#EEF1F5] pt-4">
        <a
          href={cidoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 py-2.5 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
        >
          Ver convocatoria oficial
          <ExternalLink size={15} />
        </a>
      </div>
    </section>
  );
}
