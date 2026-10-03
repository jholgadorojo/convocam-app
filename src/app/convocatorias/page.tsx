import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

import {
  getSelectionProcessFilterOptionsUseCase,
  listActiveSelectionProcessesUseCase,
} from "@/composition/selection-process";

type SearchParams = {
  q?: string;
  page?: string;

  qualificationGroup?:
    | string
    | string[];
};

type ConvocatoriasPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ConvocatoriasPage({
  searchParams,
}: ConvocatoriasPageProps) {
  const session =
    await auth.api.getSession({
      headers: await headers(),
    });

  const isAuthenticated =
    Boolean(session?.user);

  const params = await searchParams;

  /*
   * Texto del buscador
   */
  const query =
    params.q?.trim() ?? "";

  /*
   * Grupos seleccionados
   */
  const rawQualificationGroups =
    params.qualificationGroup === undefined
      ? []
      : Array.isArray(
            params.qualificationGroup,
          )
        ? params.qualificationGroup
        : [params.qualificationGroup];

  const selectedQualificationGroups = [
    ...new Set(
      rawQualificationGroups
        .map((group) => group.trim())
        .filter(Boolean),
    ),
  ];

  /*
   * Página actual
   */
  const requestedPage = Number(
    params.page ?? "1",
  );

  const page =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  /*
   * Datos reales de PostgreSQL
   */
  const [result, filterOptions] =
    await Promise.all([
      listActiveSelectionProcessesUseCase.execute(
        {
          page,
          pageSize: 20,

          filters: {
            text:
              query || undefined,

            qualificationGroup:
              selectedQualificationGroups
                .length > 0
                ? selectedQualificationGroups
                : undefined,
          },
        },
      ),

      getSelectionProcessFilterOptionsUseCase.execute(),
    ]);

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated={
          isAuthenticated
        }
        activeItem="convocatorias"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Buscar convocatorias"
          user={
            session?.user
              ? {
                  name:
                    session.user.name,
                  email:
                    session.user.email,
                }
              : undefined
          }
        />

        <main className="flex-1 px-6 py-8 lg:px-10 lg:pb-12">
          <div className="flex flex-col gap-6">

            {/* Cabecera */}
            <header>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
                Buscar convocatorias
              </h1>

              <p className="mt-1.5 text-[15px] text-[#4E5870]">
                Procesos selectivos,
                oposiciones y bolsas de
                trabajo de acceso libre en
                Catalunya.
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
                  defaultValue={query}
                  placeholder="Busca por puesto, organismo, municipio..."
                  className="h-[52px] w-full rounded-lg border border-[#D5DAE3] bg-white pl-12 pr-4 text-[15px] outline-none focus:border-[#4F5BD5]"
                />
              </div>

              {selectedQualificationGroups.map(
                (group) => (
                  <input
                    key={group}
                    type="hidden"
                    name="qualificationGroup"
                    value={group}
                  />
                ),
              )}

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

                  <Link
                    href={
                      query
                        ? `/convocatorias?q=${encodeURIComponent(
                            query,
                          )}`
                        : "/convocatorias"
                    }
                    className="text-[13.5px] font-semibold text-[#3B45B5]"
                  >
                    Limpiar
                  </Link>
                </div>

                <form action="/convocatorias">

                  {/* Conservamos búsqueda */}
                  {query && (
                    <input
                      type="hidden"
                      name="q"
                      value={query}
                    />
                  )}

                  {/* Tipo convocatoria */}
                  <FilterSection title="Tipo de convocatoria">
                    <FilterCheckbox
                      label="Plazas de plantilla"
                    />

                    <FilterCheckbox
                      label="Bolsa de trabajo"
                    />
                  </FilterSection>

                  {/* Administración */}
                  <FilterSection title="Administración">
                    <FilterCheckbox
                      label="Ayuntamientos"
                    />

                    <FilterCheckbox
                      label="Generalitat de Catalunya"
                    />

                    <FilterCheckbox
                      label="Diputaciones"
                    />

                    <FilterCheckbox
                      label="Consejos comarcales"
                    />

                    <FilterCheckbox
                      label="Otros organismos públicos"
                    />
                  </FilterSection>

                  {/* Grupo real */}
                  <FilterSection title="Grupo">
                    {filterOptions
                      .qualificationGroups
                      .length === 0 ? (
                      <p className="text-sm text-[#69738A]">
                        No hay grupos
                        disponibles.
                      </p>
                    ) : (
                      filterOptions
                        .qualificationGroups
                        .map(
                          (group) => (
                            <label
                              key={
                                group
                              }
                              className="flex cursor-pointer items-start gap-2.5 text-sm text-[#131A2C]"
                            >
                              <input
                                type="checkbox"
                                name="qualificationGroup"
                                value={
                                  group
                                }
                                defaultChecked={selectedQualificationGroups.includes(
                                  group,
                                )}
                                className="mt-0.5 h-[18px] w-[18px] rounded border-[#D5DAE3]"
                              />

                              <span>
                                {group}
                              </span>
                            </label>
                          ),
                        )
                    )}
                  </FilterSection>

                  {/* Botón filtros */}
                  <div className="p-5">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[#4F5BD5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                    >
                      Aplicar filtros
                    </button>
                  </div>

                </form>
              </aside>

              {/* Resultados */}
              <section className="flex min-w-0 flex-col gap-4">

                <div>
                  <h2 className="text-[17px] font-semibold text-[#131A2C]">
                    Convocatorias
                  </h2>

                  <p className="mt-1 text-sm text-[#69738A]">
                    {result.totalItems}{" "}
                    convocatorias encontradas
                  </p>
                </div>

                {/* Sin resultados */}
                {result.items.length === 0 ? (
                  <div className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
                    <Search
                      size={30}
                      className="mx-auto text-[#7C859B]"
                    />

                    <h2 className="mt-4 text-lg font-semibold text-[#131A2C]">
                      No se han encontrado
                      convocatorias
                    </h2>

                    <p className="mx-auto mt-2 max-w-[480px] text-sm leading-relaxed text-[#4E5870]">
                      Prueba con otros
                      criterios de búsqueda.
                    </p>
                  </div>
                ) : (
                  result.items.map(
                    (convocatoria) => (
                      <article
                        key={
                          convocatoria.id
                        }
                        className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4">

                          {/* Cabecera tarjeta */}
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-[#EEF0FF] px-2 py-1 text-xs font-semibold text-[#4F5BD5]">
                                {convocatoria
                                  .isJobPool
                                  ? "Bolsa de trabajo"
                                  : "Plaza"}
                              </span>

                              <span className="rounded-md bg-[#F4F6F9] px-2 py-1 text-xs font-medium text-[#4E5870]">
                                {
                                  convocatoria.status
                                }
                              </span>
                            </div>

                            <h3 className="text-[17px] font-semibold leading-snug text-[#131A2C]">
                              {
                                convocatoria.title
                              }
                            </h3>
                          </div>

                          {/* Información */}
                          <div className="grid gap-2 text-sm text-[#4E5870] md:grid-cols-2">

                            <div className="flex items-start gap-2">
                              <Building2
                                size={16}
                                className="mt-0.5 shrink-0"
                              />

                              <span>
                                {convocatoria
                                  .institution
                                  ?.name ??
                                  "Organismo no disponible"}
                              </span>
                            </div>

                            <div className="flex items-start gap-2">
                              <MapPin
                                size={16}
                                className="mt-0.5 shrink-0"
                              />

                              <span>
                                {formatLocation(
                                  convocatoria
                                    .institution
                                    ?.municipality,
                                  convocatoria
                                    .institution
                                    ?.county,
                                  convocatoria
                                    .institution
                                    ?.province,
                                )}
                              </span>
                            </div>

                            <div className="flex items-start gap-2">
                              <BriefcaseBusiness
                                size={16}
                                className="mt-0.5 shrink-0"
                              />

                              <span>
                                {convocatoria
                                  .qualificationGroup ??
                                  "Grupo no especificado"}
                              </span>
                            </div>

                            <div className="flex items-start gap-2">
                              <CalendarDays
                                size={16}
                                className="mt-0.5 shrink-0"
                              />

                              <span>
                                {convocatoria
                                  .applicationEndDate
                                  ? `Finaliza el ${formatDate(
                                      convocatoria.applicationEndDate,
                                    )}`
                                  : "Fecha límite pendiente"}
                              </span>
                            </div>

                          </div>

                          {/* Enlace */}
                          <div className="border-t border-[#EEF1F5] pt-4">
                            <a
                              href={
                                convocatoria.cidoUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-[#3B45B5] hover:underline"
                            >
                              Ver convocatoria
                              oficial
                            </a>
                          </div>

                        </div>
                      </article>
                    ),
                  )
                )}

                {/* Paginación */}
                {result.totalPages > 1 && (
                  <div className="flex items-center justify-between rounded-xl border border-[#E3E7EE] bg-white px-5 py-4 shadow-sm">

                    <div className="text-sm text-[#4E5870]">
                      Página{" "}
                      <span className="font-semibold text-[#131A2C]">
                        {result.page}
                      </span>{" "}
                      de{" "}
                      <span className="font-semibold text-[#131A2C]">
                        {
                          result.totalPages
                        }
                      </span>
                    </div>

                    <div className="flex gap-2">

                      {/* Anterior */}
                      {result.page > 1 ? (
                        <Link
                          href={buildPageHref(
                            result.page -
                              1,
                            query,
                            selectedQualificationGroups,
                          )}
                          className="rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#131A2C] hover:bg-[#F4F6F9]"
                        >
                          Anterior
                        </Link>
                      ) : (
                        <span className="cursor-not-allowed rounded-lg border border-[#E3E7EE] bg-[#F4F6F9] px-4 py-2 text-sm font-semibold text-[#A0A7B5]">
                          Anterior
                        </span>
                      )}

                      {/* Siguiente */}
                      {result.page <
                      result.totalPages ? (
                        <Link
                          href={buildPageHref(
                            result.page +
                              1,
                            query,
                            selectedQualificationGroups,
                          )}
                          className="rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                        >
                          Siguiente
                        </Link>
                      ) : (
                        <span className="cursor-not-allowed rounded-lg bg-[#E3E7EE] px-4 py-2 text-sm font-semibold text-[#A0A7B5]">
                          Siguiente
                        </span>
                      )}

                    </div>
                  </div>
                )}

              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/*
 * Genera la URL de una página
 * conservando búsqueda y grupos.
 */
function buildPageHref(
  page: number,
  query: string,
  qualificationGroups: string[],
): string {
  const params =
    new URLSearchParams();

  if (query) {
    params.set(
      "q",
      query,
    );
  }

  qualificationGroups.forEach(
    (group) => {
      params.append(
        "qualificationGroup",
        group,
      );
    },
  );

  params.set(
    "page",
    String(page),
  );

  return `/convocatorias?${params.toString()}`;
}

/*
 * Formatear fecha
 */
function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "es-ES",
  ).format(date);
}

/*
 * Formatear ubicación
 */
function formatLocation(
  municipality:
    | string
    | null
    | undefined,
  county:
    | string
    | null
    | undefined,
  province:
    | string
    | null
    | undefined,
): string {
  const values = [
    municipality,
    county,
    province,
  ].filter(
    (value): value is string =>
      typeof value === "string" &&
      value.length > 0,
  );

  return values.length > 0
    ? values.join(" · ")
    : "Ubicación no disponible";
}

/*
 * Sección de filtros
 */
type FilterSectionProps = {
  title: string;
  children: ReactNode;
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

/*
 * Checkbox todavía visual.
 *
 * Lo utilizaremos en los siguientes
 * filtros.
 */
type FilterCheckboxProps = {
  label: string;
};

function FilterCheckbox({
  label,
}: FilterCheckboxProps) {
  return (
    <label className="flex min-h-[30px] cursor-pointer items-center gap-2.5 text-sm text-[#131A2C]">
      <input
        type="checkbox"
        className="h-[18px] w-[18px] rounded border-[#D5DAE3]"
      />

      <span>{label}</span>
    </label>
  );
}