import Link from "next/link";

import { AuthSidePanel } from "@/components/auth/auth-side-panel";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen bg-white">
      <AuthSidePanel
        title="Todas tus oposiciones, organizadas."
        description="Guarda convocatorias, indica en qué punto estás y ten siempre a mano las fechas importantes."
      />

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