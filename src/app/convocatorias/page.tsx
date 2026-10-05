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
import { TerritoryFilters } from "./territory-filters";
import {
  getSelectionProcessFilterOptionsUseCase,
  listActiveSelectionProcessesUseCase,
} from "@/composition/selection-process";

const FILTER_FORM_ID =
  "convocatorias-filter-form";

type SearchParams = {
  q?: string;
  page?: string;

  qualificationGroup?: string | string[];
  isJobPool?: string | string[];

  statusId?: string;

  province?: string;
  county?: string;
  municipality?: string;

  scopeId?: string;
  selectionSystemId?: string;
  personnelTypeId?: string;

  applicationEndDateFrom?: string;
  applicationEndDateTo?: string;

  reservedDisability?: string;
  reservedUnemployed?: string;
  reservedYoung?: string;
  reservedWomen?: string;
};

type ConvocatoriasPageProps = {
  searchParams: Promise<SearchParams>;
};

type CurrentFilterState = {
  qualificationGroups: string[];
  jobPoolValues: string[];

  statusId?: number;

  province?: string;
  county?: string;
  municipality?: string;

  scopeId?: number;
  selectionSystemId?: number;
  personnelTypeId?: number;

  applicationEndDateFrom?: string;
  applicationEndDateTo?: string;

  reservedDisability: boolean;
  reservedUnemployed: boolean;
  reservedYoung: boolean;
  reservedWomen: boolean;
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

  const params =
    await searchParams;

  /*
   * Búsqueda libre.
   */
  const query =
    params.q?.trim() ?? "";

  /*
   * Página.
   */
  const page =
    parsePositiveInteger(
      params.page,
    ) ?? 1;

  /*
   * Grupos de titulación.
   */
  const selectedQualificationGroups = [
    ...new Set(
      normalizeArray(
        params.qualificationGroup,
      )
        .map(
          (value) =>
            value.trim(),
        )
        .filter(Boolean),
    ),
  ];

  /*
   * Plaza / bolsa.
   */
  const jobPoolValues = [
    ...new Set(
      normalizeArray(
        params.isJobPool,
      ).filter(
        (value) =>
          value === "true" ||
          value === "false",
      ),
    ),
  ];

  const hasRegularPositions =
    jobPoolValues.includes(
      "false",
    );

  const hasJobPools =
    jobPoolValues.includes(
      "true",
    );

  /*
   * Si ambos están marcados o ninguno
   * está marcado, no filtramos.
   */
  const isJobPool =
    hasRegularPositions ===
    hasJobPools
      ? undefined
      : hasJobPools;

  /*
   * Estado.
   */
  const statusId =
    parsePositiveInteger(
      params.statusId,
    );

  /*
   * Ubicación.
   */
  const province =
    cleanString(
      params.province,
    );

  const county =
    cleanString(
      params.county,
    );

  const municipality =
    cleanString(
      params.municipality,
    );

  /*
   * Otros filtros CIDO.
   */
  const scopeId =
    parsePositiveInteger(
      params.scopeId,
    );

  const selectionSystemId =
    parsePositiveInteger(
      params.selectionSystemId,
    );

  const personnelTypeId =
    parsePositiveInteger(
      params.personnelTypeId,
    );

  /*
   * Fechas.
   */
  const applicationEndDateFromValue =
    cleanString(
      params.applicationEndDateFrom,
    );

  const applicationEndDateToValue =
    cleanString(
      params.applicationEndDateTo,
    );

  const applicationEndDateFrom =
    parseDate(
      applicationEndDateFromValue,
    );

  const applicationEndDateTo =
    parseDate(
      applicationEndDateToValue,
    );

  /*
   * Reservas.
   */
  const reservedDisability =
    params.reservedDisability ===
    "true";

  const reservedUnemployed =
    params.reservedUnemployed ===
    "true";

  const reservedYoung =
    params.reservedYoung ===
    "true";

  const reservedWomen =
    params.reservedWomen ===
    "true";

  /*
   * Estado actual de filtros.
   */
  const currentFilters:
    CurrentFilterState = {
      qualificationGroups:
        selectedQualificationGroups,

      jobPoolValues,

      statusId,

      province,
      county,
      municipality,

      scopeId,
      selectionSystemId,
      personnelTypeId,

      applicationEndDateFrom:
        applicationEndDateFromValue,

      applicationEndDateTo:
        applicationEndDateToValue,

      reservedDisability,
      reservedUnemployed,
      reservedYoung,
      reservedWomen,
    };

  /*
   * URL exacta del listado actual.
   *
   * Se utiliza para volver desde
   * el detalle conservando filtros
   * y página.
   */
  const resultsUrl =
    buildPageHref(
      page,
      query,
      currentFilters,
    );

  /*
   * Key para reconstruir los controles
   * cuando cambian los parámetros.
   *
   * Es especialmente útil al pulsar
   * "Limpiar".
   */
  const filterFormKey =
    buildFilterFormKey(
      query,
      page,
      currentFilters,
    );

  /*
   * Consulta PostgreSQL.
   */
  const [
    result,
    filterOptions,
  ] =
    await Promise.all([
      listActiveSelectionProcessesUseCase.execute(
        {
          page,
          pageSize: 20,

          filters: {
            text:
              query ||
              undefined,

            qualificationGroup:
              selectedQualificationGroups.length >
              0
                ? selectedQualificationGroups
                : undefined,

            isJobPool,

            statusId,

            province,
            county,
            municipality,

            scopeId,
            selectionSystemId,
            personnelTypeId,

            applicationEndDateFrom,
            applicationEndDateTo,

            reservedDisability:
              reservedDisability
                ? true
                : undefined,

            reservedUnemployed:
              reservedUnemployed
                ? true
                : undefined,

            reservedYoung:
              reservedYoung
                ? true
                : undefined,

            reservedWomen:
              reservedWomen
                ? true
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
                    session.user
                      .name,

                  email:
                    session.user
                      .email,
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
                trabajo de acceso libre
                en Catalunya.
              </p>
            </header>

            {/*
             * BUSCADOR
             *
             * Aunque visualmente está fuera
             * del formulario lateral, tanto
             * el input como el botón están
             * asociados al formulario mediante
             * el atributo "form".
             */}
            <div className="flex gap-2.5">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C859B]"
                />

                <input
                  key={`search-${filterFormKey}`}
                  form={
                    FILTER_FORM_ID
                  }
                  type="search"
                  name="q"
                  defaultValue={
                    query
                  }
                  placeholder="Busca por puesto, organismo, municipio..."
                  className="h-[52px] w-full rounded-lg border border-[#D5DAE3] bg-white pl-12 pr-4 text-[15px] outline-none focus:border-[#4F5BD5]"
                />
              </div>

              <button
                form={
                  FILTER_FORM_ID
                }
                type="submit"
                className="h-[52px] rounded-[10px] bg-[#4F5BD5] px-7 text-[15px] font-semibold text-white hover:bg-[#3B45B5]"
              >
                Buscar
              </button>
            </div>

            {/* Contenido */}
            <div className="grid items-start gap-7 lg:grid-cols-[300px_minmax(0,1fr)]">
              {/* Filtros */}
              <aside className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#EEF1F5] px-5 py-4">
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                    <SlidersHorizontal
                      size={
                        16
                      }
                      className="text-[#4E5870]"
                    />

                    Filtros
                  </h2>

                  {/*
                   * Limpia absolutamente todo:
                   * texto, filtros y página.
                   */}
                  <Link
                    href="/convocatorias"
                    className="text-[13.5px] font-semibold text-[#3B45B5]"
                  >
                    Limpiar
                  </Link>
                </div>

                {/*
                 * ÚNICO FORMULARIO DE BÚSQUEDA.
                 *
                 * El input "q" de arriba pertenece
                 * también a este formulario gracias
                 * a form={FILTER_FORM_ID}.
                 */}
                <form
                  key={
                    filterFormKey
                  }
                  id={
                    FILTER_FORM_ID
                  }
                  action="/convocatorias"
                >
                  {/* Tipo */}
                  <FilterSection title="Tipo de convocatoria">
                    <FilterCheckLabel
                      name="isJobPool"
                      value="false"
                      label="Plazas de plantilla"
                      checked={
                        hasRegularPositions
                      }
                    />

                    <FilterCheckLabel
                      name="isJobPool"
                      value="true"
                      label="Bolsa de trabajo"
                      checked={
                        hasJobPools
                      }
                    />
                  </FilterSection>

                  {/* Estado */}
                  <FilterSection title="Estado">
                    <FilterSelect
                      name="statusId"
                      defaultValue={
                        statusId !==
                        undefined
                          ? String(
                              statusId,
                            )
                          : ""
                      }
                      emptyLabel="Todos los estados"
                      options={filterOptions.statuses.map(
                        (
                          option,
                        ) => ({
                          value:
                            String(
                              option.id,
                            ),

                          label:
                            option.name,
                        }),
                      )}
                    />
                  </FilterSection>

                  {/* Ubicación */}
                  <FilterSection title="Ubicación">
                    <TerritoryFilters
                      key={`territory-${filterFormKey}`}
                      territories={
                        filterOptions.territories
                      }
                      initialProvince={
                        province
                      }
                      initialCounty={
                        county
                      }
                      initialMunicipality={
                        municipality
                      }
                    />
                  </FilterSection>

                  {/* Grupo */}
                  <FilterSection title="Grupo de titulación">
                    {filterOptions
                      .qualificationGroups
                      .length ===
                    0 ? (
                      <p className="text-sm text-[#69738A]">
                        No hay grupos
                        disponibles.
                      </p>
                    ) : (
                      filterOptions.qualificationGroups.map(
                        (
                          group,
                        ) => (
                          <FilterCheckLabel
                            key={
                              group
                            }
                            name="qualificationGroup"
                            value={
                              group
                            }
                            label={
                              group
                            }
                            checked={selectedQualificationGroups.includes(
                              group,
                            )}
                          />
                        ),
                      )
                    )}
                  </FilterSection>

                  {/* Ámbito */}
                  <FilterSection title="Ámbito">
                    <FilterSelect
                      name="scopeId"
                      defaultValue={
                        scopeId !==
                        undefined
                          ? String(
                              scopeId,
                            )
                          : ""
                      }
                      emptyLabel="Todos los ámbitos"
                      options={filterOptions.scopes.map(
                        (
                          option,
                        ) => ({
                          value:
                            String(
                              option.id,
                            ),

                          label:
                            option.name,
                        }),
                      )}
                    />
                  </FilterSection>

                  {/* Sistema selección */}
                  <FilterSection title="Sistema de selección">
                    <FilterSelect
                      name="selectionSystemId"
                      defaultValue={
                        selectionSystemId !==
                        undefined
                          ? String(
                              selectionSystemId,
                            )
                          : ""
                      }
                      emptyLabel="Todos los sistemas"
                      options={filterOptions.selectionSystems.map(
                        (
                          option,
                        ) => ({
                          value:
                            String(
                              option.id,
                            ),

                          label:
                            option.name,
                        }),
                      )}
                    />
                  </FilterSection>

                  {/* Tipo personal */}
                  <FilterSection title="Tipo de personal">
                    <FilterSelect
                      name="personnelTypeId"
                      defaultValue={
                        personnelTypeId !==
                        undefined
                          ? String(
                              personnelTypeId,
                            )
                          : ""
                      }
                      emptyLabel="Todos los tipos"
                      options={filterOptions.personnelTypes.map(
                        (
                          option,
                        ) => ({
                          value:
                            String(
                              option.id,
                            ),

                          label:
                            option.name,
                        }),
                      )}
                    />
                  </FilterSection>

                  {/* Fechas */}
                  <FilterSection title="Fecha límite">
                    <label className="flex flex-col gap-1.5 text-sm text-[#131A2C]">
                      <span className="text-xs font-medium text-[#69738A]">
                        Desde
                      </span>

                      <input
                        type="date"
                        name="applicationEndDateFrom"
                        defaultValue={
                          applicationEndDateFromValue ??
                          ""
                        }
                        className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm outline-none focus:border-[#4F5BD5]"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm text-[#131A2C]">
                      <span className="text-xs font-medium text-[#69738A]">
                        Hasta
                      </span>

                      <input
                        type="date"
                        name="applicationEndDateTo"
                        defaultValue={
                          applicationEndDateToValue ??
                          ""
                        }
                        className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm outline-none focus:border-[#4F5BD5]"
                      />
                    </label>
                  </FilterSection>

                  {/* Reservas */}
                  <FilterSection title="Reservas">
                    <FilterCheckLabel
                      name="reservedDisability"
                      value="true"
                      label="Personas con discapacidad"
                      checked={
                        reservedDisability
                      }
                    />

                    <FilterCheckLabel
                      name="reservedUnemployed"
                      value="true"
                      label="Personas desempleadas"
                      checked={
                        reservedUnemployed
                      }
                    />

                    <FilterCheckLabel
                      name="reservedYoung"
                      value="true"
                      label="Jóvenes"
                      checked={
                        reservedYoung
                      }
                    />

                    <FilterCheckLabel
                      name="reservedWomen"
                      value="true"
                      label="Mujeres"
                      checked={
                        reservedWomen
                      }
                    />
                  </FilterSection>

                  {/* Aplicar */}
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
                    {
                      result.totalItems
                    }{" "}
                    convocatorias
                    encontradas
                  </p>
                </div>

                {result.items.length ===
                0 ? (
                  <div className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">
                    <Search
                      size={
                        30
                      }
                      className="mx-auto text-[#7C859B]"
                    />

                    <h2 className="mt-4 text-lg font-semibold text-[#131A2C]">
                      No se han
                      encontrado
                      convocatorias
                    </h2>

                    <p className="mx-auto mt-2 max-w-[480px] text-sm leading-relaxed text-[#4E5870]">
                      Prueba con otros
                      criterios de
                      búsqueda.
                    </p>
                  </div>
                ) : (
                  result.items.map(
                    (
                      convocatoria,
                    ) => (
                      <article
                        key={
                          convocatoria.id
                        }
                        className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-[#EEF0FF] px-2 py-1 text-xs font-semibold text-[#4F5BD5]">
                                {convocatoria.isJobPool
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

                          <div className="grid gap-2 text-sm text-[#4E5870] md:grid-cols-2">
                            <div className="flex items-start gap-2">
                              <Building2
                                size={
                                  16
                                }
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
                                size={
                                  16
                                }
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
                                size={
                                  16
                                }
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
                                size={
                                  16
                                }
                                className="mt-0.5 shrink-0"
                              />

                              <span>
                                {convocatoria.applicationEndDate
                                  ? `Finaliza el ${formatDate(
                                      convocatoria.applicationEndDate,
                                    )}`
                                  : "Fecha límite pendiente"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 border-t border-[#EEF1F5] pt-4">
                            <Link
                              href={`/convocatorias/${convocatoria.id}?returnTo=${encodeURIComponent(
                                resultsUrl,
                              )}`}
                              className="inline-flex items-center justify-center rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]"
                            >
                              Ver detalle
                            </Link>

                            <a
                              href={
                                convocatoria.cidoUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
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
                {result.totalPages >
                  1 && (
                  <div className="flex items-center justify-between rounded-xl border border-[#E3E7EE] bg-white px-5 py-4 shadow-sm">
                    <div className="text-sm text-[#4E5870]">
                      Página{" "}
                      <span className="font-semibold text-[#131A2C]">
                        {
                          result.page
                        }
                      </span>{" "}
                      de{" "}
                      <span className="font-semibold text-[#131A2C]">
                        {
                          result.totalPages
                        }
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {result.page >
                      1 ? (
                        <Link
                          href={buildPageHref(
                            result.page -
                              1,
                            query,
                            currentFilters,
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

                      {result.page <
                      result.totalPages ? (
                        <Link
                          href={buildPageHref(
                            result.page +
                              1,
                            query,
                            currentFilters,
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
 * Convierte query param en array.
 */
function normalizeArray(
  value:
    | string
    | string[]
    | undefined,
): string[] {
  if (
    value === undefined
  ) {
    return [];
  }

  return Array.isArray(
    value,
  )
    ? value
    : [value];
}

/*
 * Limpia strings.
 */
function cleanString(
  value:
    | string
    | undefined,
): string | undefined {
  const cleaned =
    value?.trim();

  return cleaned
    ? cleaned
    : undefined;
}

/*
 * Convierte IDs.
 */
function parsePositiveInteger(
  value:
    | string
    | undefined,
): number | undefined {
  if (!value) {
    return undefined;
  }

  const number =
    Number(value);

  if (
    !Number.isInteger(
      number,
    ) ||
    number < 1
  ) {
    return undefined;
  }

  return number;
}

/*
 * Convierte YYYY-MM-DD en Date.
 */
function parseDate(
  value:
    | string
    | undefined,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  return Number.isNaN(
    date.getTime(),
  )
    ? undefined
    : date;
}

/*
 * Genera URL conservando búsqueda,
 * filtros y página.
 */
function buildPageHref(
  page: number,
  query: string,
  filters: CurrentFilterState,
): string {
  const params =
    new URLSearchParams();

  if (query) {
    params.set(
      "q",
      query,
    );
  }

  appendFiltersToParams(
    params,
    filters,
  );

  params.set(
    "page",
    String(page),
  );

  return `/convocatorias?${params.toString()}`;
}

/*
 * Key utilizada para reconstruir
 * los controles cuando cambian
 * los parámetros.
 */
function buildFilterFormKey(
  query: string,
  page: number,
  filters: CurrentFilterState,
): string {
  return JSON.stringify({
    query,
    page,

    qualificationGroups:
      filters.qualificationGroups,

    jobPoolValues:
      filters.jobPoolValues,

    statusId:
      filters.statusId,

    province:
      filters.province,

    county:
      filters.county,

    municipality:
      filters.municipality,

    scopeId:
      filters.scopeId,

    selectionSystemId:
      filters.selectionSystemId,

    personnelTypeId:
      filters.personnelTypeId,

    applicationEndDateFrom:
      filters.applicationEndDateFrom,

    applicationEndDateTo:
      filters.applicationEndDateTo,

    reservedDisability:
      filters.reservedDisability,

    reservedUnemployed:
      filters.reservedUnemployed,

    reservedYoung:
      filters.reservedYoung,

    reservedWomen:
      filters.reservedWomen,
  });
}

/*
 * Añade filtros a URLSearchParams.
 */
function appendFiltersToParams(
  params: URLSearchParams,
  filters: CurrentFilterState,
) {
  filters.qualificationGroups.forEach(
    (
      group,
    ) => {
      params.append(
        "qualificationGroup",
        group,
      );
    },
  );

  filters.jobPoolValues.forEach(
    (
      value,
    ) => {
      params.append(
        "isJobPool",
        value,
      );
    },
  );

  if (
    filters.statusId !==
    undefined
  ) {
    params.set(
      "statusId",
      String(
        filters.statusId,
      ),
    );
  }

  if (
    filters.province
  ) {
    params.set(
      "province",
      filters.province,
    );
  }

  if (
    filters.county
  ) {
    params.set(
      "county",
      filters.county,
    );
  }

  if (
    filters.municipality
  ) {
    params.set(
      "municipality",
      filters.municipality,
    );
  }

  if (
    filters.scopeId !==
    undefined
  ) {
    params.set(
      "scopeId",
      String(
        filters.scopeId,
      ),
    );
  }

  if (
    filters.selectionSystemId !==
    undefined
  ) {
    params.set(
      "selectionSystemId",
      String(
        filters.selectionSystemId,
      ),
    );
  }

  if (
    filters.personnelTypeId !==
    undefined
  ) {
    params.set(
      "personnelTypeId",
      String(
        filters.personnelTypeId,
      ),
    );
  }

  if (
    filters.applicationEndDateFrom
  ) {
    params.set(
      "applicationEndDateFrom",
      filters.applicationEndDateFrom,
    );
  }

  if (
    filters.applicationEndDateTo
  ) {
    params.set(
      "applicationEndDateTo",
      filters.applicationEndDateTo,
    );
  }

  if (
    filters.reservedDisability
  ) {
    params.set(
      "reservedDisability",
      "true",
    );
  }

  if (
    filters.reservedUnemployed
  ) {
    params.set(
      "reservedUnemployed",
      "true",
    );
  }

  if (
    filters.reservedYoung
  ) {
    params.set(
      "reservedYoung",
      "true",
    );
  }

  if (
    filters.reservedWomen
  ) {
    params.set(
      "reservedWomen",
      "true",
    );
  }
}

function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "es-ES",
  ).format(date);
}

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
    (
      value,
    ): value is string =>
      typeof value ===
        "string" &&
      value.length > 0,
  );

  return values.length >
    0
    ? values.join(
        " · ",
      )
    : "Ubicación no disponible";
}

/*
 * Sección visual.
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
      <legend className="mb-3 text-[13.5px] font-semibold text-[#131A2C]">
        {title}
      </legend>

      <div className="flex flex-col gap-2.5">
        {children}
      </div>
    </fieldset>
  );
}

/*
 * Checkbox reutilizable.
 */
type FilterCheckLabelProps = {
  name: string;
  value: string;
  label: string;
  checked: boolean;
};

function FilterCheckLabel({
  name,
  value,
  label,
  checked,
}: FilterCheckLabelProps) {
  return (
    <label className="flex min-h-[30px] cursor-pointer items-start gap-2.5 text-sm text-[#131A2C]">
      <input
        type="checkbox"
        name={
          name
        }
        value={
          value
        }
        defaultChecked={
          checked
        }
        className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-[#D5DAE3]"
      />

      <span>
        {label}
      </span>
    </label>
  );
}

/*
 * Select reutilizable.
 */
type FilterSelectOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  name: string;
  defaultValue: string;
  emptyLabel: string;
  options:
    FilterSelectOption[];
};

function FilterSelect({
  name,
  defaultValue,
  emptyLabel,
  options,
}: FilterSelectProps) {
  return (
    <select
      name={
        name
      }
      defaultValue={
        defaultValue
      }
      className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]"
    >
      <option value="">
        {
          emptyLabel
        }
      </option>

      {options.map(
        (
          option,
        ) => (
          <option
            key={
              option.value
            }
            value={
              option.value
            }
          >
            {
              option.label
            }
          </option>
        ),
      )}
    </select>
  );
}