import Link from "next/link";

/** Paginación del listado; no se muestra si hay una sola página. */
export function SearchPagination({
  page,
  totalPages,
  pageHref,
}: {
  page: number;
  totalPages: number;
  pageHref: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E3E7EE] bg-white px-5 py-4 shadow-sm">
      <div className="text-sm text-[#4E5870]">
        Página <span className="font-semibold text-[#131A2C]">{page}</span> de{" "}
        <span className="font-semibold text-[#131A2C]">{totalPages}</span>
      </div>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={pageHref(page - 1)}
            className="rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#131A2C] hover:bg-[#F4F6F9]"
          >
            Anterior
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-lg border border-[#E3E7EE] bg-[#F4F6F9] px-4 py-2 text-sm font-semibold text-[#A0A7B5]">
            Anterior
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={pageHref(page + 1)}
            className="rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]"
          >
            Siguiente
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-lg bg-[#E3E7EE] px-4 py-2 text-sm font-semibold text-[#A0A7B5]">
            Siguiente
          </span>
        )}
      </div>
    </div>
  );
}
