
"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

type ForMeErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ForMeError({
  error,
  reset,
}: ForMeErrorProps) {
  useEffect(() => {
    console.error(
      "Error al cargar la pantalla Para mí:",
      error,
    );
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6F9]">
      {/* Cabecera */}
      <header className="border-b border-[#E3E7EE] bg-white px-6 py-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2.5"
        >
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#4F5BD5] text-sm font-bold text-white">
            C
          </span>

          <span className="text-lg font-bold text-[#131A2C]">
            Convoca&apos;m
          </span>
        </Link>
      </header>

      {/* Mensaje de error */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <section
          role="alert"
          aria-labelledby="para-mi-error-title"
          className="w-full max-w-[560px] rounded-xl border border-[#E3E7EE] bg-white px-6 py-10 text-center shadow-sm sm:px-10"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF4E5]">
            <AlertTriangle
              size={30}
              className="text-[#C47A18]"
            />
          </div>

          <h1
            id="para-mi-error-title"
            className="mt-6 text-[23px] font-semibold tracking-tight text-[#131A2C]"
          >
            No hemos podido cargar «Para mí»
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#4E5870]">
            Se ha producido un problema al consultar
            tus preferencias o recuperar las
            convocatorias que coinciden con tu perfil.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-[#69738A]">
            Puede tratarse de un error temporal.
            Prueba a cargar nuevamente la página.
          </p>

          {/* Acciones */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#4F5BD5] px-5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
            >
              <RotateCcw size={16} />
              Reintentar
            </button>

            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-5 text-sm font-semibold text-[#4E5870] hover:bg-[#F4F6F9]"
            >
              <ArrowLeft size={16} />
              Volver al Dashboard
            </Link>
          </div>

          <p className="mt-7 text-xs text-[#646E85]">
            Si el problema continúa, inténtalo
            de nuevo más tarde.
          </p>
        </section>
      </main>
    </div>
  );
}
