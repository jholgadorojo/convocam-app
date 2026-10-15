
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

import {
  getUserProfileUseCase,
  listMunicipalitiesUseCase,
  listUserAcademicQualificationsUseCase,
  getUserTerritorialPreferencesUseCase,
  getTerritorialPreferenceOptionsUseCase,
  getUserProfessionalPreferencesUseCase,
  getProfessionalPreferenceOptionsUseCase,
} from "@/composition/user-profile";

import { PersonalDataForm } from "./personal-data-form";
import { ResidenceForm } from "./residence-form";
import { AcademicQualificationsSection } from "./academic-qualifications-section";
import { TerritorialPreferencesSection } from "./territorial-preferences-section";
import { ProfessionalPreferencesSection } from "./professional-preferences-section";

// ============================================================
// APARTADOS DEL PERFIL
// ============================================================

const profileSections = [
  {
    id: "personal",
    title: "Datos personales",
    description: "Nombre, apellidos y correo electrónico.",
    icon: UserRound,
  },
  {
    id: "residence",
    title: "Residencia",
    description: "Municipio, comarca y provincia de residencia.",
    icon: MapPin,
  },
  {
    id: "education",
    title: "Formación académica",
    description: "Titulaciones académicas obtenidas.",
    icon: GraduationCap,
  },
  {
    id: "territories",
    title: "Preferencias territoriales",
    description: "Territorios donde te interesa trabajar.",
    icon: Map,
  },
  {
    id: "professional",
    title: "Preferencias profesionales",
    description: "Tipos de convocatorias que te interesan.",
    icon: BriefcaseBusiness,
  },
];

// ============================================================
// PÁGINA MI PERFIL
// ============================================================

export default async function MyProfilePage() {
  // ==========================================================
  // AUTENTICACIÓN
  // ==========================================================

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/mi-perfil");
  }

  // ==========================================================
  // RECUPERAR DATOS DEL PERFIL
  // ==========================================================

  const profile = await getUserProfileUseCase.execute({
    userId: session.user.id,
  });

  const academicQualifications =
    await listUserAcademicQualificationsUseCase.execute({
      userId: session.user.id,
    });

  // ==========================================================
  // PREFERENCIAS TERRITORIALES
  // ==========================================================

  const [
    territorialPreference,
    territorialOptions,
  ] = await Promise.all([
    getUserTerritorialPreferencesUseCase.execute({
      userId: session.user.id,
    }),

    getTerritorialPreferenceOptionsUseCase.execute(),
  ]);

  // ==========================================================
  // RESIDENCIA DEL OPOSITOR
  // ==========================================================

  const municipalities =
    await listMunicipalitiesUseCase.execute();

  // ==========================================================
  // INTERFAZ
  // ==========================================================

  const [professionalPreference, professionalOptions] =
    await Promise.all([
      getUserProfessionalPreferencesUseCase.execute({
        userId: session.user.id,
      }),

      getProfessionalPreferenceOptionsUseCase.execute(),
    ]);

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      {/* SIDEBAR */}

      <AppSidebar
        isAuthenticated
        activeItem="perfil"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* CABECERA */}

        <AppHeader
          title="Mi perfil"
          user={{
            name: session.user.name,
            email: session.user.email,
          }}
        />

        <main className="flex-1 px-4 py-8 lg:px-6 lg:pb-12">
          <div className="flex flex-col gap-7">
            {/* TÍTULO */}

            <header>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                Mi perfil
              </h1>

              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Gestiona tus datos personales,
                formación académica y preferencias
                como opositor.
              </p>
            </header>

            {/* APARTADOS DEL PERFIL */}

            <div className="flex flex-col gap-4">
              {profileSections.map((section) => {
                const Icon = section.icon;

                return (
                  <section
                    key={section.id}
                    className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm"
                  >
                    {/* CABECERA DE LA TARJETA */}

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF0FC]">
                        <Icon
                          size={20}
                          className="text-[#4F5BD5]"
                        />
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-[17px] font-semibold text-[#131A2C]">
                          {section.title}
                        </h2>

                        <p className="mt-1 text-sm text-[#69738A]">
                          {section.description}
                        </p>
                      </div>
                    </div>

                    {/* =====================================
                        DATOS PERSONALES
                    ===================================== */}

                    {section.id === "personal" && (
                      <PersonalDataForm
                        firstName={profile?.firstName ?? ""}
                        lastName={profile?.lastName ?? ""}
                        email={session.user.email}
                      />
                    )}

                    {/* =====================================
                        RESIDENCIA
                    ===================================== */}

                    {section.id === "residence" && (
                      <ResidenceForm
                        municipalities={municipalities}
                        residenceMunicipalityId={
                          profile?.residenceMunicipalityId ?? null
                        }
                      />
                    )}

                    {/* =====================================
                        FORMACIÓN ACADÉMICA
                    ===================================== */}

                    {section.id === "education" && (
                      <AcademicQualificationsSection
                        qualifications={academicQualifications}
                      />
                    )}

                    {/* =====================================
                        PREFERENCIAS TERRITORIALES
                    ===================================== */}

                    {section.id === "territories" && (
                      <div className="mt-5">
                        <TerritorialPreferencesSection
                          preference={territorialPreference}
                          options={territorialOptions}
                        />
                      </div>
                    )}

                    {/* =====================================
                        PREFERENCIAS PROFESIONALES
                    ===================================== */}
                    {section.id === "professional" && (
                      <div className="mt-5">
                        <ProfessionalPreferencesSection
                          preference={professionalPreference}
                          options={professionalOptions}
                        />
                      </div>
                    )}

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
