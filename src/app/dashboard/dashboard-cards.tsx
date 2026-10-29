import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type PersonalStatCardProps = {
  icon: ReactNode;
  title: string;
  count: number | null;
  description: string;
  href: string;
  action: string;
  /** "danger" destaca el número en rojo (p. ej. caducadas). */
  tone?: "default" | "danger";
};
export function PersonalStatCard({
  icon,
  title,
  count,
  description,
  href,
  action,
  tone = "default",
}: PersonalStatCardProps) {
  return (
    <section className="flex flex-col rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EEF0FC] text-[#3B45B5]">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#4E5870]">{title}</h3>
      <p
        className={`mt-2 text-[36px] font-bold leading-tight tracking-tight ${tone === "danger" ? "text-[#DC2626]" : "text-[#131A2C]"
          }`}
      >
        {count === null ? "—" : new Intl.NumberFormat("es-ES").format(count)}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#69738A]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3B45B5] hover:underline"
      >
        {action}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
type PublicCountCardProps = {
  title: string;
  count: number;
  description: string;
  href: string;
  action: string;
};
export function PublicCountCard({
  title,
  count,
  description,
  href,
  action,
}: PublicCountCardProps) {
  return (
    <section className="flex flex-col rounded-xl border border-[#E3E7EE] bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-[#4E5870]">{title}</h3>
      <p className="mt-3 text-4xl font-bold tracking-tight text-[#131A2C]">
        {new Intl.NumberFormat("es-ES").format(count)}
      </p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#69738A]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3B45B5] hover:underline"
      >
        {action}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
type DashboardCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
};
export function DashboardCard({
  icon,
  title,
  description,
  href,
  action,
}: DashboardCardProps) {
  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EEF0FC] text-[#3B45B5]">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-[#131A2C]">{title}</h2>
      <p className="mt-1.5 min-h-[42px] text-sm leading-relaxed text-[#4E5870]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex text-sm font-semibold text-[#3B45B5] hover:underline"
      >
        {action}
      </Link>
    </section>
  );
}
