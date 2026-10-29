import Link from "next/link";

/** El usuario todavía no sigue ninguna convocatoria. */
export function MySelectionProcessesEmptyState() {
  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-[#131A2C]">
        Todavía no sigues ninguna convocatoria
      </h2>
      <p className="mx-auto mt-2 max-w-[520px] text-sm leading-relaxed text-[#69738A]">
        Busca convocatorias y añade a seguimiento las que te interesen.
      </p>
      <Link
        href="/convocatorias"
        className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#4F5BD5] px-5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
      >
        Buscar convocatorias
      </Link>
    </section>
  );
}
