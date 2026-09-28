import { headers } from "next/headers";
import { Search, SlidersHorizontal } from "lucide-react";

import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function ConvocatoriasPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated={isAuthenticated}
        activeItem="convocatorias"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Buscar convocatorias"
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
          <div className="flex flex-col gap-6">
            <header>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                Buscar convocatorias
              </h1>

              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Procesos selectivos, oposiciones y bolsas de trabajo
                de acceso libre en Catalunya.
              </p>
            </header>

            {/* Buscador */}
            <form
              action="/convocatorias"
              className="flex gap-2.5"
            >
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C859B]"
                />

                <input
                  type="search"
                  name="q"
                  placeholder="Busca por puesto, organismo, municipio..."
                  className="h-[52px] w-full rounded-lg border border-[#D5DAE3] bg-white pl-12 pr-4 text-[15px] outline-none focus:border-[#4F5BD5]"
                />
              </div>

              <button
                type="submit"
                className="h-[52px] rounded-[10px] bg-[#4F5BD5] px-7 text-[15px] font-semibold text-white hover:bg-[#3B45B5]"
              >
                Buscar
              </button>
            </form>

            {/* Contenido */}
            <div className="grid items-start gap-7 lg:grid-cols-[272px_minmax(0,1fr)]">
              {/* Filtros */}
              <aside className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#EEF1F5] px-5 py-4">
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                    <SlidersHorizontal
                      size={16}
                      className="text-[#4E5870]"
                    />

                    Filtros
                  </h2>

                  <button className="text-[13.5px] font-semibold text-[#3B45B5]">
                    Limpiar
                  </button>
                </div>

                <FilterSection title="Tipo de convocatoria">
                  <FilterCheckbox label="Plazas de plantilla" />
                  <FilterCheckbox label="Bolsa de trabajo" />
                </FilterSection>

                <FilterSection title="Administración">
                  <FilterCheckbox label="Ayuntamientos" />
                  <FilterCheckbox label="Generalitat de Catalunya" />
                  <FilterCheckbox label="Diputaciones" />
                  <FilterCheckbox label="Consejos comarcales" />
                  <FilterCheckbox label="Otros organismos públicos" />
                </FilterSection>

                <FilterSection title="Grupo">
                  <div className="flex flex-wrap gap-1.5">
                    {["A1", "A2", "B", "C1", "C2", "AP"].map(
                      (group) => (
                        <button
                          key={group}
                          type="button"
                          className="h-8 min-w-11 rounded-lg border border-[#D5DAE3] bg-white px-2.5 text-[13.5px] font-semibold"
                        >
                          {group}
                        </button>
                      ),
                    )}
                  </div>
                </FilterSection>
              </aside>

              {/* Resultados */}
              <section>
                <div className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
                  <Search
                    size={30}
                    className="mx-auto text-[#7C859B]"
                  />

                  <h2 className="mt-4 text-lg font-semibold text-[#131A2C]">
                    Busca convocatorias
                  </h2>

                  <p className="mx-auto mt-2 max-w-[480px] text-sm leading-relaxed text-[#4E5870]">
                    Utiliza el buscador y los filtros para encontrar
                    oportunidades que te interesen.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

type FilterSectionProps = {
  title: string;
  children: React.ReactNode;
};

function FilterSection({
  title,
  children,
}: FilterSectionProps) {
  return (
    <fieldset className="border-b border-[#EEF1F5] px-5 py-4">
      <legend className="mb-2 text-[13.5px] font-semibold text-[#131A2C]">
        {title}
      </legend>

      <div className="flex flex-col gap-2">
        {children}
      </div>
    </fieldset>
  );
}

function FilterCheckbox({
  label,
}: {
  label: string;
}) {
  return (
    <label className="flex min-h-[30px] cursor-pointer items-center gap-2.5 text-sm text-[#131A2C]">
      <input
        type="checkbox"
        className="h-[18px] w-[18px] rounded border-[#D5DAE3]"
      />

      {label}
    </label>
  );
}