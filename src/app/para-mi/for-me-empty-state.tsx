import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Aviso de página sin resultados: preferencias sin configurar
 * o ninguna convocatoria nueva para el usuario.
 */
export function ForMeEmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
      {icon}
      <h2 className={`${icon ? "mt-4 " : ""}text-lg font-semibold text-[#131A2C]`}>
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-[550px] text-sm leading-relaxed text-[#69738A]">
        {description}
      </p>
      <Link
        href={actionHref}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#4F5BD5] px-5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
