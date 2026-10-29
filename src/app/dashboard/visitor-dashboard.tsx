import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  ListChecks,
  Search,
} from "lucide-react";
import type { PublicDashboardCounts } from
  "@/modules/dashboard/application/get-public-dashboard-counts";
import {
  DashboardCard,
  PublicCountCard,
} from "./dashboard-cards";
import { DashboardHeading } from "./dashboard-heading";

/** Dashboard de visitante: contadores públicos y accesos. */
export function VisitorDashboard({
  counts,
}: {
  counts: PublicDashboardCounts;
}) {
  return (
    <>
      <DashboardHeading
        title="Encuentra tu próxima convocatoria"
        description="Busca procesos selectivos y bolsas de trabajo de acceso libre en Catalunya."
      />
      {/* Contadores públicos */}
      <section
        aria-labelledby="public-dashboard-counts"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2
              id="public-dashboard-counts"
              className="text-lg font-semibold text-[#131A2C]"
            >
              Convocatorias en Catalunya
            </h2>
            <p className="mt-1 text-sm text-[#69738A]">
              Explora las convocatorias según su estado oficial en CIDO.
            </p>
          </div>
          <Link
            href="/convocatorias"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B45B5] hover:underline"
          >
            Ver todas las convocatorias
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <PublicCountCard
            title="Plazo abierto"
            count={counts.openCount}
            description="Convocatorias con el plazo de presentación de solicitudes abierto."
            href="/convocatorias?statusId=3&statusFilterApplied=1"
            action="Ver convocatorias abiertas"
          />
          <PublicCountCard
            title="Pendiente de plazo"
            count={counts.pendingCount}
            description="Convocatorias pendientes de la apertura del plazo de solicitudes."
            href="/convocatorias?statusId=2&statusFilterApplied=1"
            action="Ver convocatorias pendientes"
          />
        </div>
      </section>
      {/* Accesos conservados para visitantes */}
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          icon={<Search size={20} />}
          title="Buscar"
          description="Encuentra convocatorias por puesto, organismo o ubicación."
          href="/convocatorias"
          action="Buscar convocatorias"
        />
        <DashboardCard
          icon={<Bookmark size={20} />}
          title="Guardar"
          description="Guarda las convocatorias que te interesan para consultarlas después."
          href="/login?returnTo=/mis-convocatorias"
          action="Iniciar sesión"
        />
        <DashboardCard
          icon={<ListChecks size={20} />}
          title="Seguir"
          description="Controla el estado de cada proceso y sus próximas fechas."
          href="/login?returnTo=/mis-convocatorias"
          action="Iniciar sesión"
        />
      </div>
      <section className="flex flex-col justify-between gap-5 rounded-xl border border-[#DDE1FA] bg-[#EEF0FC] p-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-base font-semibold text-[#131A2C]">
            ¿Quieres guardar y seguir tus convocatorias?
          </h2>
          <p className="mt-1 text-sm text-[#4E5870]">
            Crea una cuenta gratuita y tendrás tu espacio personal en
            Convoca&apos;m.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login?returnTo=/dashboard"
            className="flex h-10 items-center rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#3B45B5]"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="flex h-10 items-center rounded-lg bg-[#4F5BD5] px-4 text-sm font-semibold text-white"
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    </>
  );
}
