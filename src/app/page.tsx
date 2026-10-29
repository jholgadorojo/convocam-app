import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  Building2,
  Clock3,
  MapPin,
  Search,
  Users,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { listActiveSelectionProcessesUseCase } from "@/composition/selection-process";
import { getApplicationPeriodPresentation } from "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";

const QUICK_SEARCHES = [
  {
    label: "Administrativo",
    href: `/convocatorias?q=${encodeURIComponent("Administrativo")}`,
  },
  {
    label: "Auxiliar administrativo",
    href: `/convocatorias?q=${encodeURIComponent("Auxiliar administrativo")}`,
  },
  {
    label: "Informática",
    href: `/convocatorias?q=${encodeURIComponent("Informática")}`,
  },
  {
    label: "Bolsas de trabajo",
    href: "/convocatorias?isJobPool=true",
  },
];

const OPEN_CALLS_URL =
  "/convocatorias?statusFilterApplied=1&statusId=3&applicationPeriod=open&sort=publication-desc";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = Boolean(session?.user);

  // Reutilizamos el buscador existente: solo tres convocatorias con
  // estado CIDO abierto y plazo de solicitud realmente abierto.
  const latestOpenCalls = await listActiveSelectionProcessesUseCase.execute({
    page: 1,
    pageSize: 3,
    filters: {
      statusId: [3],
      applicationPeriod: "open",
      sort: "publication-desc",
    },
  });

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#131A2C]">
      {/* CABECERA */}
      <header className="border-b border-[#E3E7EE] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-16">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#4F5BD5]">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <span className="text-lg font-bold">Convoca&apos;m</span>
            </Link>

            <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
              <Link
                href="/"
                aria-current="page"
                className="flex h-9 items-center rounded-lg bg-[#F1F3F7] px-3 text-[14.5px] font-semibold"
              >
                Inicio
              </Link>
              <Link
                href="/convocatorias"
                className="flex h-9 items-center rounded-lg px-3 text-[14.5px] font-medium text-[#4E5870] hover:bg-[#F1F3F7]"
              >
                Buscar convocatorias
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex h-10 items-center rounded-lg bg-[#4F5BD5] px-4 text-sm font-semibold text-white hover:bg-[#3B45B5]"
              >
                Ir al dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login?returnTo=/dashboard"
                  className="hidden h-10 items-center px-4 text-sm font-semibold text-[#131A2C] sm:flex"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="flex h-10 items-center rounded-lg bg-[#4F5BD5] px-4 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* BUSCADOR PRINCIPAL */}
        <section className="relative overflow-hidden border-b border-[#E3E7EE] bg-white px-6 py-16 lg:px-16 lg:py-[88px]">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(#E3E7EE 1.2px, transparent 1.2px)",
              backgroundSize: "24px 24px",
              maskImage:
                "radial-gradient(ellipse 60% 70% at 50% 40%, #000 20%, transparent 75%)",
            }}
          />

          <div className="relative mx-auto flex max-w-[850px] flex-col items-center text-center">
            <p className="mb-4 rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-4 py-1.5 text-sm font-semibold text-[#3B45B5]">
              Tu portal personal de convocatorias públicas en Catalunya
            </p>

            <h1 className="max-w-[820px] text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[56px]">
              Encuentra tu próxima oportunidad de empleo público en Catalunya
            </h1>

            <p className="mt-5 max-w-[660px] text-lg leading-relaxed text-[#4E5870]">
              Busca procesos selectivos, oposiciones y bolsas de trabajo de
              acceso libre en Catalunya.
            </p>

            <form
              action="/convocatorias"
              method="get"
              role="search"
              className="mt-9 flex w-full flex-col gap-2.5 rounded-2xl border border-[#E3E7EE] bg-white p-2 shadow-[0_12px_32px_rgba(15,27,51,0.08)] sm:flex-row"
            >
              <div className="relative min-w-0 flex-1">
                <Search
                  size={19}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#646E85]"
                />
                <input
                  type="search"
                  name="q"
                  maxLength={100}
                  aria-label="Buscar convocatorias"
                  placeholder="Administrativo, auxiliar, informática, ayuntamiento..."
                  className="h-14 w-full rounded-xl border border-transparent bg-white pl-12 pr-4 text-[15px] outline-none focus:border-[#4F5BD5]"
                />
              </div>
              <button
                type="submit"
                className="flex h-14 shrink-0 items-center justify-center rounded-xl bg-[#4F5BD5] px-9 text-base font-semibold text-white hover:bg-[#3B45B5]"
              >
                Buscar
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[13.5px]">
              <span className="text-[#646E85]">Búsquedas frecuentes:</span>
              {QUICK_SEARCHES.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex min-h-[30px] items-center rounded-full border border-[#E3E7EE] bg-white px-3 font-medium text-[#4E5870] hover:border-[#4F5BD5] hover:text-[#3B45B5]"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {!isAuthenticated && (
              <p className="mt-6 text-sm text-[#646E85]">
                No necesitas registrarte para buscar convocatorias.
              </p>
            )}
          </div>
        </section>

        {/* ÚLTIMAS CONVOCATORIAS ABIERTAS */}
        <section className="mx-auto max-w-[1180px] px-6 py-14 lg:px-0 lg:py-16">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[26px] font-semibold tracking-tight">
                Últimas convocatorias abiertas
              </h2>
              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Convocatorias recientes con el plazo de inscripción abierto.
              </p>
            </div>
            <Link
              href={OPEN_CALLS_URL}
              className="inline-flex shrink-0 items-center gap-2 text-[14.5px] font-semibold text-[#3B45B5] hover:text-[#2E3794]"
            >
              Ver todas las convocatorias
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          {latestOpenCalls.items.length === 0 ? (
            <div className="rounded-xl border border-[#E3E7EE] bg-white px-6 py-10 text-center shadow-sm">
              <p className="font-semibold">
                No hay convocatorias con inscripción abierta en este momento.
              </p>
              <p className="mt-2 text-sm text-[#4E5870]">
                Puedes consultar el buscador para explorar otras convocatorias.
              </p>
              <Link
                href="/convocatorias"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-[#3B45B5]"
              >
                Ir al buscador
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {latestOpenCalls.items.map((convocatoria) => {
                const period = getApplicationPeriodPresentation(
                  convocatoria.applicationStartDate,
                  convocatoria.applicationEndDate,
                );
                const remainingText =
                  period.state === "open"
                    ? period.label === "Finaliza hoy"
                      ? period.label
                      : period.detail
                    : null;
                const detailUrl = `/convocatorias/${convocatoria.id}`;
                const hasPositions =
                  !convocatoria.isJobPool &&
                  convocatoria.numberOfPositions !== null &&
                  convocatoria.numberOfPositions > 0;

                return (
                  <article
                    key={convocatoria.id}
                    className="flex h-full min-w-0 flex-col rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-[#E6F4EC] px-2.5 text-xs font-semibold text-[#1B7A4B]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#23A26B]" />
                        Inscripción abierta
                      </span>
                      <span className="inline-flex min-h-6 items-center rounded-full bg-[#F1F3F7] px-2.5 text-xs font-medium text-[#4E5870]">
                        {convocatoria.isJobPool
                          ? "Bolsa de trabajo"
                          : "Plaza de plantilla"}
                      </span>
                    </div>

                    <h3 className="mt-4 text-[17px] font-semibold leading-snug tracking-[-0.01em]">
                      <Link
                        href={detailUrl}
                        className="hover:text-[#3B45B5] hover:underline"
                      >
                        {formatSelectionProcessTitle(convocatoria.title)}
                      </Link>
                    </h3>

                    <div className="mt-2 flex items-start gap-2 text-sm text-[#4E5870]">
                      <Building2
                        size={16}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[#646E85]"
                      />
                      <span>
                        {convocatoria.institution?.name ??
                          "Organismo no disponible"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#4E5870]">
                      {convocatoria.qualificationGroup && (
                        <span className="rounded-md bg-[#F1F3F7] px-2 py-1 font-medium">
                          Grupo: {convocatoria.qualificationGroup}
                        </span>
                      )}
                      {hasPositions && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F1F3F7] px-2 py-1 font-medium">
                          <Users size={14} aria-hidden="true" />
                          {convocatoria.numberOfPositions}{" "}
                          {convocatoria.numberOfPositions === 1
                            ? "plaza"
                            : "plazas"}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-start gap-2 text-[13px] text-[#4E5870]">
                      <MapPin
                        size={16}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[#646E85]"
                      />
                      <span>
                        {formatLocation(
                          convocatoria.institution?.municipality,
                          convocatoria.institution?.county,
                        )}
                      </span>
                    </div>

                    <div className="mt-auto pt-5">
                      <div className="border-t border-[#EEF1F5] pt-4">
                        <p className="text-xs text-[#646E85]">
                          Fin del plazo de inscripción
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {convocatoria.applicationEndDate
                            ? `Hasta el ${formatDate(convocatoria.applicationEndDate)}`
                            : "Fecha no disponible"}
                        </p>
                        {remainingText && (
                          <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#F1F3F7] px-2 py-1 text-xs font-semibold text-[#4E5870]">
                            <Clock3 size={13} aria-hidden="true" />
                            {remainingText}
                          </span>
                        )}
                      </div>

                      <Link
                        href={detailUrl}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B45B5] hover:text-[#2E3794]"
                      >
                        Ver detalle
                        <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* INVITACIÓN A REGISTRARSE: SOLO VISITANTES */}
        {!isAuthenticated && (
          <div className="mx-auto max-w-[1180px] px-6 pb-[72px] lg:px-0">
            <section className="flex flex-col items-start justify-between gap-8 rounded-[20px] bg-[#0E1A33] px-8 py-10 lg:flex-row lg:items-center lg:px-14 lg:py-12">
              <div className="max-w-[650px]">
                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  Organiza todas tus convocatorias en un único lugar.
                </h2>
                <p className="mt-3 text-base text-[#AEB8CE]">
                  Guarda las que te interesan, sigue tus plazos y consulta
                  tu progreso desde tu espacio personal.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex h-14 shrink-0 items-center gap-2 rounded-xl bg-white px-7 text-base font-semibold text-[#0E1A33] hover:bg-[#F1F3F7]"
              >
                Crear mi cuenta
                <ArrowRight size={19} aria-hidden="true" />
              </Link>
            </section>
          </div>
        )}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="border-t border-[#E3E7EE] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-4 px-6 py-7 text-[13.5px] text-[#646E85] sm:flex-row sm:items-center lg:px-0">
          <div className="flex items-center gap-4">
            <span className="font-bold text-[#131A2C]">Convoca&apos;m</span>
            <span>© 2026</span>
          </div>
          <p>
            Información orientativa. Consulta siempre las fuentes oficiales de
            cada convocatoria.
          </p>
        </div>
      </footer>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatLocation(
  municipality: string | null | undefined,
  county: string | null | undefined,
): string {
  const values = [municipality, county].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  return values.length > 0 ? values.join(" · ") : "Ubicación no disponible";
}
