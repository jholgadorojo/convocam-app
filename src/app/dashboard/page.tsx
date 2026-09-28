import Link from "next/link";
import { headers } from "next/headers";
import {
  Bookmark,
  ListChecks,
  Search,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated={isAuthenticated}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          user={
            session?.user
              ? {
                  name: session.user.name,
                  email: session.user.email,
                }
              : undefined
          }
        />

        <main className="flex-1 px-6 py-8 lg:px-10 lg:pb-12">
          <div className="flex flex-col gap-7">
            {/* Cabecera */}
            <header>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                Encuentra tu próxima convocatoria
              </h1>

              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Busca procesos selectivos y bolsas de trabajo
                de acceso libre en Catalunya.
              </p>
            </header>

            {/* Buscador principal */}
            <section className="rounded-xl border border-[#E3E7EE] bg-white p-6 shadow-sm">
              <form
                action="/convocatorias"
                className="flex flex-col gap-3 md:flex-row"
              >
                <div className="relative flex-1">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C859B]"
                  />

                  <input
                    type="search"
                    name="q"
                    placeholder="Puesto, organismo, municipio..."
                    className="h-12 w-full rounded-[10px] border border-[#D5DAE3] bg-white pl-12 pr-4 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]"
                  />
                </div>

                <button
                  type="submit"
                  className="h-12 rounded-[10px] bg-[#4F5BD5] px-6 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                >
                  Buscar convocatorias
                </button>
              </form>
            </section>

            {/* Tres bloques */}
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
                href={
                  isAuthenticated
                    ? "/mis-convocatorias"
                    : "/login?returnTo=/mis-convocatorias"
                }
                action={
                  isAuthenticated
                    ? "Mis convocatorias"
                    : "Iniciar sesión"
                }
              />

              <DashboardCard
                icon={<ListChecks size={20} />}
                title="Seguir"
                description="Controla el estado de cada proceso y sus próximas fechas."
                href={
                  isAuthenticated
                    ? "/mis-convocatorias"
                    : "/login?returnTo=/mis-convocatorias"
                }
                action={
                  isAuthenticated
                    ? "Ver seguimiento"
                    : "Iniciar sesión"
                }
              />
            </div>

            {/* Mensaje para visitante */}
            {!isAuthenticated && (
              <section className="flex flex-col justify-between gap-5 rounded-xl border border-[#DDE1FA] bg-[#EEF0FC] p-6 md:flex-row md:items-center">
                <div>
                  <h2 className="text-base font-semibold text-[#131A2C]">
                    ¿Quieres guardar y seguir tus convocatorias?
                  </h2>

                  <p className="mt-1 text-sm text-[#4E5870]">
                    Crea una cuenta gratuita y tendrás tu
                    espacio personal en Convoca&apos;m.
                  </p>
                </div>

                <div className="flex gap-3">
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

type DashboardCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
};

function DashboardCard({
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

      <h2 className="text-base font-semibold text-[#131A2C]">
        {title}
      </h2>

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