import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SlidersHorizontal,
  Target,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  listSelectionProcessesForMeUseCase,
} from "@/composition/selection-process";
import {
  getUserProfessionalPreferencesUseCase,
  getUserTerritorialPreferencesUseCase,
} from "@/composition/user-profile";
import { ForMeEmptyState } from "./for-me-empty-state";
import {
  getMatchReasons,
  parsePage,
} from "./for-me-presentation";
import { ForMeResults } from "./for-me-results";

type ForMePageProps = {
  searchParams: Promise<{
    page?: string | string[];
    municipality?: string | string[];
    province?: string | string[];
  }>;
};

export default async function ForMePage({ searchParams }: ForMePageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?returnTo=/para-mi");
  }

  const params = await searchParams;
  const requestedPage = parsePage(params.page);
  const selectedMunicipality =
    typeof params.municipality === "string"
      ? params.municipality.trim() || null
      : null;
  const selectedProvince =
    selectedMunicipality && typeof params.province === "string"
      ? params.province.trim() || null
      : null;
  const userId = session.user.id;

  const [result, territorialPreferences, professionalPreferences] =
    await Promise.all([
      listSelectionProcessesForMeUseCase.execute({
        userId,
        page: requestedPage,
        // Se excluyen en SQL: listado, total, paginacion y mapa comparten el filtro.
        excludeFollowed: true,
        municipality: selectedMunicipality ?? undefined,
        province: selectedProvince ?? undefined,
        includeMunicipalityMapPoints: true,
      }),
      getUserTerritorialPreferencesUseCase.execute({ userId }),
      getUserProfessionalPreferencesUseCase.execute({ userId }),
    ]);

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar isAuthenticated activeItem="para-mi" />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Para mí"
          user={{
            name: session.user.name,
            email: session.user.email,
          }}
        />

        <main className="flex-1 px-4 py-8 lg:px-6 lg:pb-12">
          <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Target size={23} className="text-[#4F5BD5]" />
                  <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                    Para mí
                  </h1>
                </div>
                <p className="mt-1.5 max-w-[720px] text-[15px] text-[#4E5870]">
                  Convocatorias que coinciden con las preferencias que has
                  guardado en tu perfil y que todavía no sigues.
                </p>
              </div>

              <Link
                href="/mi-perfil"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
              >
                <SlidersHorizontal size={16} />
                Editar mis preferencias
              </Link>
            </header>

            {result.kind === "preferences-not-configured" ? (
              <ForMeEmptyState
                icon={<Target size={32} className="mx-auto text-[#646E85]" />}
                title="Configura tus preferencias"
                description="Selecciona tus preferencias territoriales o profesionales para descubrir convocatorias relacionadas con tus intereses."
                actionHref="/mi-perfil"
                actionLabel="Ir a Mi perfil"
              />
            ) : result.page.items.length === 0 && !selectedMunicipality ? (
              <ForMeEmptyState
                title="No hay nuevas convocatorias para ti"
                description="No hay convocatorias pendientes de seguir que encajen con tus preferencias en los estados oficiales «Pendiente de plazo» o «Plazo abierto». Puede que ya las sigas todas o que no haya nuevas oportunidades compatibles."
                actionHref="/mi-perfil"
                actionLabel="Revisar mis preferencias"
              />
            ) : (
              <ForMeResults
                pageData={result.page}
                mapPoints={result.municipalityMapPoints ?? []}
                selectedMunicipality={selectedMunicipality}
                selectedProvince={selectedProvince}
                matchReasons={getMatchReasons(
                  territorialPreferences,
                  professionalPreferences,
                )}
                showTerritorialNote={
                  territorialPreferences?.scope === "SELECTED_TERRITORIES"
                }
              />
            )}

            {result.kind === "results" && (
              <p className="text-xs leading-relaxed text-[#69738A]">
                Estas coincidencias se calculan con los datos publicados por CIDO
                y tus preferencias. No garantizan que cumplas todos los requisitos
                de participación; revisa siempre las bases oficiales.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
