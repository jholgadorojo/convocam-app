import type { ReactNode } from "react";

/** Bloque con título de la columna principal del detalle. */
export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-[17px] font-semibold text-[#131A2C]">
        {title}
      </h2>
      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}
