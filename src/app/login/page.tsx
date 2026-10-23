import { Suspense } from "react";
import Link from "next/link";

import { AuthSidePanel } from "@/components/auth/auth-side-panel";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-white">
      <AuthSidePanel
        title="Tu portal personal de oposiciones."
        description="Busca convocatorias, guarda las que te interesan y sigue cada proceso hasta el final."
      />

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-7">
            <h1 className="text-3xl font-semibold tracking-tight text-[#131A2C]">
              Inicia sesión
            </h1>

            <p className="mt-2 text-[15px] text-[#4E5870]">
              Accede a tus convocatorias.
            </p>
          </div>

          <Suspense
            fallback={
              <p role="status" className="text-sm text-[#69738A]">
                Cargando formulario de acceso...
              </p>
            }
          >
            <LoginForm />
          </Suspense>

          <div className="my-7 h-px bg-[#EEF1F5]" />

          <p className="text-center text-[14.5px] text-[#4E5870]">
            ¿Todavía no tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#3B45B5] hover:underline"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
