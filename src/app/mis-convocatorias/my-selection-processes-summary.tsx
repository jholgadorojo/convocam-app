import Link from "next/link";
import type { FilteredMySelectionProcesses } from "./my-selection-processes-presentation";

const summaryLinkClassName =
  "flex min-w-0 flex-col items-center justify-center rounded-lg border px-2 py-3 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Resumen bajo el mapa: contadores de todos los seguimientos
 * que a la vez filtran el listado (todas, en plazo, caducadas).
 */
export function MySelectionProcessesSummary({
  counts,
  activeView,
}: {
  counts: FilteredMySelectionProcesses["counts"];
  /** Contador destacado; null si hay otros filtros activos. */
  activeView: "all" | "open" | "expired" | null;
}) {
  return (
    <section
      aria-labelledby="followed-summary-heading"
      className="rounded-xl border border-[#E3E7EE] bg-white p-4 shadow-sm"
    >
      <h2
        id="followed-summary-heading"
        className="text-sm font-semibold text-[#131A2C]"
      >
        Resumen de mis convocatorias
      </h2>
      <nav aria-label="Filtrar mis convocatorias por plazo" className="mt-3 grid grid-cols-3 gap-2">
        <Link
          href="/mis-convocatorias"
          aria-current={activeView === "all" ? "page" : undefined}
          className={`${summaryLinkClassName} focus-visible:outline-[#4F5BD5] ${
            activeView === "all"
              ? "border-[#9FA8EC] bg-[#EEF0FC] ring-1 ring-[#9FA8EC]"
              : "border-transparent bg-[#F4F6F9] hover:bg-[#E9EDF3]"
          }`}
        >
          <span className="text-xs font-semibold text-[#4E5870]">Todas</span>
          <span className="mt-1 text-2xl font-bold tabular-nums text-[#131A2C]">
            {counts.all}
          </span>
        </Link>
        <Link
          href="/mis-convocatorias?openApplications=1"
          aria-current={activeView === "open" ? "page" : undefined}
          className={`${summaryLinkClassName} focus-visible:outline-[#15803D] ${
            activeView === "open"
              ? "border-[#86EFAC] bg-[#DCFCE7] ring-1 ring-[#86EFAC]"
              : "border-transparent bg-[#F0FDF4] hover:bg-[#DCFCE7]"
          }`}
        >
          <span className="text-xs font-semibold text-[#4E5870]">En plazo</span>
          <span className="mt-1 text-2xl font-bold tabular-nums text-[#15803D]">
            {counts.open}
          </span>
        </Link>
        <Link
          href="/mis-convocatorias?expiredDeadlines=1"
          aria-current={activeView === "expired" ? "page" : undefined}
          className={`${summaryLinkClassName} focus-visible:outline-[#DC2626] ${
            activeView === "expired"
              ? "border-[#FCA5A5] bg-[#FEE2E2] ring-1 ring-[#FCA5A5]"
              : "border-transparent bg-[#FEF2F2] hover:bg-[#FEE2E2]"
          }`}
        >
          <span className="text-xs font-semibold text-[#4E5870]">Caducadas</span>
          <span className="mt-1 text-2xl font-bold tabular-nums text-[#DC2626]">
            {counts.expired}
          </span>
        </Link>
      </nav>
      <p className="mt-3 text-xs leading-relaxed text-[#69738A]">
        En plazo: solicitudes abiertas hoy. Caducadas: plazo vencido en «Me
        interesa» o «Preparando solicitud».
      </p>
    </section>
  );
}
