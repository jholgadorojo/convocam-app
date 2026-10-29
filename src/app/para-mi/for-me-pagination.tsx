import Link from "next/link";
import { pageHref } from "./for-me-presentation";

/** Paginación «Anterior / Siguiente» que conserva el municipio seleccionado. */
export function ForMePagination({
  currentPage,
  totalPages,
  municipality,
  province,
}: {
  currentPage: number;
  totalPages: number;
  municipality: string | null;
  province: string | null;
}) {
  return (
    <nav
      aria-label="Paginación de convocatorias para mí"
      className="flex items-center justify-between gap-3 rounded-xl border border-[#E3E7EE] bg-white px-4 py-3 text-sm"
    >
      {currentPage > 1 ? (
        <Link href={pageHref(currentPage - 1, municipality, province)} className="font-semibold text-[#3B45B5] hover:underline">
          ← Anterior
        </Link>
      ) : (
        <span className="text-[#A4ADBE]">← Anterior</span>
      )}
      <span className="text-[#4E5870]">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={pageHref(currentPage + 1, municipality, province)} className="font-semibold text-[#3B45B5] hover:underline">
          Siguiente →
        </Link>
      ) : (
        <span className="text-[#A4ADBE]">Siguiente →</span>
      )}
    </nav>
  );
}
