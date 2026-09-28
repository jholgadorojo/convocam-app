import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Search,
} from "lucide-react";

import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#131A2C]">
      {/* CABECERA */}
      <header className="flex h-[72px] items-center justify-between border-b border-[#E3E7EE] bg-white px-6 lg:px-16">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#4F5BD5]">
              <span className="text-sm font-bold text-white">
                C
              </span>
            </div>

            <span className="text-lg font-bold">
              Convoca&apos;m
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className="flex h-9 items-center rounded-lg bg-[#F1F3F7] px-3 text-[14.5px] font-semibold"
            >
              Inicio
            </Link>

            <Link
              href="/dashboard"
              className="flex h-9 items-center rounded-lg px-3 text-[14.5px] font-medium text-[#4E5870] hover:bg-[#F1F3F7]"
            >
              Explorar
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
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[#E3E7EE] bg-white px-6 py-20 lg:px-16 lg:py-[88px]">
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
              Tu portal personal de convocatorias públicas
            </p>

            <h1 className="max-w-[820px] text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[56px]">
              Encuentra, guarda y sigue tus próximas oportunidades públicas
            </h1>

            <p className="mt-5 max-w-[660px] text-lg leading-relaxed text-[#4E5870]">
              Convoca&apos;m te ayuda a localizar procesos selectivos,
              bolsas de trabajo y convocatorias públicas en Catalunya,
              y a organizar todo su seguimiento en un único lugar.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#4F5BD5] px-8 text-base font-semibold text-white shadow-sm hover:bg-[#3B45B5]"
              >
                Explorar Convoca&apos;m
                <ArrowRight size={18} />
              </Link>

              {!isAuthenticated && (
                <Link
                  href="/login?returnTo=/dashboard"
                  className="flex h-14 items-center justify-center rounded-xl border border-[#D5DAE3] bg-white px-8 text-base font-semibold text-[#131A2C] hover:bg-[#F4F6F9]"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>

            <p className="mt-4 text-sm text-[#7C859B]">
              No necesitas registrarte para buscar convocatorias.
            </p>
          </div>
        </section>

        {/* QUÉ PUEDE HACER CONVOCAM */}
        <section className="mx-auto max-w-[1180px] px-6 py-16 lg:px-0">
          <div className="mb-8 text-center">
            <h2 className="text-[28px] font-semibold tracking-tight">
              Todo el proceso en un mismo sitio
            </h2>

            <p className="mt-2 text-[15px] text-[#4E5870]">
              Empieza buscando libremente y crea una cuenta solo cuando
              quieras guardar y seguir una convocatoria.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<Search size={22} />}
              title="Busca"
              description="Encuentra convocatorias por puesto, organismo, municipio, grupo profesional o tipo de proceso."
            />

            <FeatureCard
              icon={<Bookmark size={22} />}
              title="Guarda"
              description="Conserva las convocatorias que te interesan y crea tu propio espacio personal."
            />

            <FeatureCard
              icon={<CalendarDays size={22} />}
              title="Sigue"
              description="Controla plazos, pruebas, publicaciones y los siguientes pasos de cada proceso."
            />
          </div>
        </section>

        {/* PREVIEW DEL PRODUCTO */}
        <section className="mx-auto max-w-[1180px] px-6 pb-16 lg:px-0">
          <div className="overflow-hidden rounded-[20px] border border-[#E3E7EE] bg-white shadow-sm">
            <div className="border-b border-[#E3E7EE] px-7 py-6">
              <p className="text-sm font-semibold text-[#3B45B5]">
                Convoca&apos;m
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Tu recorrido como opositor, organizado
              </h2>

              <p className="mt-2 max-w-[700px] text-[15px] text-[#4E5870]">
                Convoca&apos;m evolucionará para ayudarte no solo a
                encontrar una convocatoria, sino también a saber qué
                tienes pendiente y cuál es tu próximo paso.
              </p>
            </div>

            <div className="grid gap-px bg-[#E3E7EE] md:grid-cols-3">
              <PreviewItem
                number="01"
                title="Encuentra una oportunidad"
                text="Busca procesos selectivos y bolsas de trabajo."
              />

              <PreviewItem
                number="02"
                title="Guárdala"
                text="Añádela a tus convocatorias personales."
              />

              <PreviewItem
                number="03"
                title="Sigue el proceso"
                text="Controla fechas, estados y tareas pendientes."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mb-[72px] flex max-w-[1180px] flex-col items-start justify-between gap-8 rounded-[20px] bg-[#0E1A33] px-8 py-10 lg:flex-row lg:items-center lg:px-14 lg:py-12">
          <div className="max-w-[650px]">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Empieza explorando las convocatorias.
            </h2>

            <p className="mt-3 text-base text-[#AEB8CE]">
              Puedes utilizar Convoca&apos;m sin cuenta. Cuando quieras
              guardar una convocatoria, podrás crear tu espacio personal.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="flex h-14 shrink-0 items-center gap-2 rounded-xl bg-white px-7 text-base font-semibold text-[#0E1A33]"
          >
            Ir al dashboard
            <ArrowRight size={19} />
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#E3E7EE] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-4 px-6 py-7 text-[13.5px] text-[#7C859B] sm:flex-row sm:items-center lg:px-0">
          <div className="flex items-center gap-4">
            <span className="font-bold text-[#131A2C]">
              Convoca&apos;m
            </span>

            <span>© 2026</span>
          </div>

          <p>
            Información orientativa. Consulta siempre las fuentes
            oficiales de cada convocatoria.
          </p>
        </div>
      </footer>
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-[#E3E7EE] bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EEF0FC] text-[#3B45B5]">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-[#4E5870]">
        {description}
      </p>
    </article>
  );
}

type PreviewItemProps = {
  number: string;
  title: string;
  text: string;
};

function PreviewItem({
  number,
  title,
  text,
}: PreviewItemProps) {
  return (
    <article className="bg-white p-7">
      <span className="text-sm font-bold text-[#4F5BD5]">
        {number}
      </span>

      <h3 className="mt-4 text-base font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-[#4E5870]">
        {text}
      </p>
    </article>
  );
}