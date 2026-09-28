import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen bg-white">
      {/* PANEL IZQUIERDO */}
      <aside className="relative hidden w-[600px] flex-col justify-between overflow-hidden bg-[#0E1A33] px-14 py-11 lg:flex">
        {/* Círculos decorativos */}
        <div className="absolute -bottom-[140px] -right-[140px] h-[460px] w-[460px] rounded-full border border-[#22314F]" />
        <div className="absolute -bottom-[60px] -right-[60px] h-[300px] w-[300px] rounded-full border border-[#22314F]" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#4F5BD5]">
            <span className="text-sm font-bold text-white">C</span>
          </div>

          <span className="text-lg font-bold text-white">
            Convoca&apos;m
          </span>
        </div>

        {/* Contenido central */}
        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="max-w-[430px] text-4xl font-semibold leading-tight text-white">
              Todas tus oposiciones, organizadas.
            </h2>

            <p className="max-w-[420px] text-base leading-relaxed text-[#AEB8CE]">
              Guarda convocatorias, indica en qué punto estás y ten siempre
              a mano las fechas importantes.
            </p>
          </div>

          {/* Tarjeta de próximas fechas */}
          <div className="w-[400px] rounded-[14px] bg-white shadow-2xl">
            <p className="px-5 pb-1 pt-4 text-sm font-semibold text-[#131A2C]">
              Próximas fechas
            </p>

            <div className="px-5 pb-3">
              <DateItem
                day="23"
                month="SEP"
                type="Fin de inscripción"
                title="Administrativo/a C1"
                organization="Generalitat de Catalunya"
                urgent
              />

              <div className="h-px bg-[#EEF1F5]" />

              <DateItem
                day="30"
                month="SEP"
                type="Fin de inscripción"
                title="Administrativo/a C1"
                organization="Ajuntament de Granollers"
              />

              <div className="h-px bg-[#EEF1F5]" />

              <DateItem
                day="04"
                month="OCT"
                type="Prueba"
                title="Auxiliar administrativo/a"
                organization="Ajuntament de Cardedeu"
              />
            </div>
          </div>
        </div>

        <p className="relative text-[13px] text-[#7D89A6]">
          © 2026 Convoca&apos;m
        </p>
      </aside>

      {/* PANEL DERECHO */}
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-7">
            <h1 className="text-3xl font-semibold tracking-tight text-[#131A2C]">
              Crea tu cuenta
            </h1>

            <p className="mt-2 text-[15px] text-[#4E5870]">
              Es gratuito y solo necesitas un correo electrónico.
            </p>
          </div>

          <RegisterForm />

          <div className="my-7 h-px bg-[#EEF1F5]" />

          <p className="text-center text-[14.5px] text-[#4E5870]">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#3B45B5] hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

type DateItemProps = {
  day: string;
  month: string;
  type: string;
  title: string;
  organization: string;
  urgent?: boolean;
};

function DateItem({
  day,
  month,
  type,
  title,
  organization,
  urgent = false,
}: DateItemProps) {
  return (
    <div className="flex items-center gap-3.5 py-3">
      <div
        className={
          urgent
            ? "flex h-[54px] w-[50px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#FDF1DC] text-[#8F5307]"
            : "flex h-[54px] w-[50px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#EEF0FC] text-[#3B45B5]"
        }
      >
        <span className="text-xl font-bold leading-none">{day}</span>

        <span className="mt-1 text-[11px] font-bold tracking-wider">
          {month}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#4E5870]">
          {type}
          {urgent && (
            <span className="ml-2 text-[#8F5307]">
              · en 5 días
            </span>
          )}
        </p>

        <p className="truncate text-sm font-semibold text-[#131A2C]">
          {title}
        </p>

        <p className="truncate text-[13px] text-[#7C859B]">
          {organization}
        </p>
      </div>
    </div>
  );
}