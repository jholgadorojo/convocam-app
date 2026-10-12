import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  BriefcaseBusiness,
  GraduationCap,
  Map,
  MapPin,
  UserRound,
} from "lucide-react";

import { auth } from "@/lib/auth";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

const profileSections = [
  {
    title: "Datos personales",
    description: "Nombre, apellidos y correo electrónico.",
    icon: UserRound,
  },
  {
    title: "Residencia",
    description: "Municipio, comarca y provincia de residencia.",
    icon: MapPin,
  },
  {
    title: "Formación académica",
    description: "Titulaciones académicas obtenidas.",
    icon: GraduationCap,
  },
  {
    title: "Preferencias territoriales",
    description: "Territorios donde te interesa trabajar.",
    icon: Map,
  },
  {
    title: "Preferencias profesionales",
    description: "Tipos de convocatorias que te interesan.",
    icon: BriefcaseBusiness,
  },
];

export default async function MyProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/mi-perfil");
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated
        activeItem="perfil"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Mi perfil"
          user={{
            name: session.user.name,
            email: session.user.email,
          }}
        />

        <main className="flex-1 px-4 py-8 lg:px-6 lg:pb-12">
          <div className="flex flex-col gap-7">
            {/* CABECERA */}
            <header>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                Mi perfil
              </h1>

              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Gestiona tus datos personales, formación
                académica y preferencias como opositor.
              </p>
            </header>

            {/* APARTADOS DEL PERFIL */}
            <div className="flex flex-col gap-4">
              {profileSections.map((section) => {
                const Icon = section.icon;

                return (
                  <section
                    key={section.title}
                    className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF0FC]">
                        <Icon
                          size={20}
                          className="text-[#4F5BD5]"
                        />
                      </div>

                      <div>
                        <h2 className="text-[17px] font-semibold text-[#131A2C]">
                          {section.title}
                        </h2>

                        <p className="mt-1 text-sm text-[#69738A]">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}