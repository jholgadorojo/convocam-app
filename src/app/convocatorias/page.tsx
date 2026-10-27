import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { Building2, ExternalLink, MapPin, Search, SlidersHorizontal, } from "lucide-react";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TerritoryFilters } from "./territory-filters";
import {
  getSelectionProcessFilterOptionsUseCase,
  listActiveSelectionProcessesUseCase,
  listSelectionProcessMunicipalityMapPointsUseCase,
} from "@/composition/selection-process";
import { getApplicationPeriodPresentation, getOfficialStatusPresentation, } from "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from "@/modules/selection-process/presentation/selection-process-title";
import type {
  SelectionProcessApplicationPeriodFilter,
  SelectionProcessSearchFilters,
  SelectionProcessSort,
} from "@/modules/selection-process/application/selection-process-search-filters";
import {
  SelectionProcessResultsViewToggle,
  type SelectionProcessResultsView,
} from "@/modules/selection-process/presentation/selection-process-results-view-toggle";
import { IcgcMunicipalitiesMap } from "@/modules/user-selection-process/presentation/icgc-municipalities-map";

const FILTER_FORM_ID = "convocatorias-filter-form";

type SearchParams = {
    q?: string;
    page?: string;
    view?: string;
    sort?: string;
    qualificationGroup?: string | string[];
    isJobPool?: string | string[];
    statusId?: string | string[];
    statusFilterApplied?: string;
    applicationPeriod?: string;
    province?: string;
    county?: string;
    municipality?: string;
    radiusKm?: string;
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
    sort: SelectionProcessSort;
    qualificationGroups: string[];
    jobPoolValues: string[];
    statusIds: number[];
    applicationPeriod?: SelectionProcessApplicationPeriodFilter;
    province?: string;
    county?: string;
    municipality?: string;
    radiusKm?: number;
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

export default async function ConvocatoriasPage({ searchParams, }: ConvocatoriasPageProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const isAuthenticated = Boolean(session?.user);
    const params = await searchParams;
    const filterOptions = await getSelectionProcessFilterOptionsUseCase.execute();

/**
 * ==========================================================
 * BÚSQUEDA
 * ==========================================================
 */
    const query = params.q?.trim() ?? "";
    // El listado sigue siendo la vista predeterminada.
    const activeView: SelectionProcessResultsView =
        params.view === "map" ? "map" : "list";
    const requestedSort = parseSelectionProcessSort(params.sort);
    const sort = resolveSelectionProcessSort(requestedSort, Boolean(query));

/**
 * ==========================================================
 * PAGINACIÓN
 * ==========================================================
 */
    const page = parsePositiveInteger(params.page) ?? 1;

/**
 * ==========================================================
 * GRUPO DE TITULACIÓN
 * ==========================================================
 */
    const selectedQualificationGroups = [
        ...new Set(normalizeArray(params.qualificationGroup)
            .map((value) => value.trim())
            .filter(Boolean)),
    ];

/**
 * ==========================================================
 * PLAZA / BOLSA
 * ==========================================================
 */
    const jobPoolValues = [
        ...new Set(normalizeArray(params.isJobPool).filter((value) => value === "true" ||
            value === "false")),
    ];
    const hasRegularPositions = jobPoolValues.includes("false");
    const hasJobPools = jobPoolValues.includes("true");
    const isJobPool = hasRegularPositions ===
        hasJobPools
        ? undefined
        : hasJobPools;

/**
 * ==========================================================
 * ESTADO
 * ==========================================================
 */
    const rawStatusIds = [
        ...new Set(normalizeArray(params.statusId)
            .map((value) => parsePositiveInteger(value))
            .filter((value): value is number => value !== undefined)),
    ];
    const statusFilterApplied = params.statusFilterApplied ===
        "1";
    const defaultStatusIds = filterOptions.statuses
        .filter((status) => {
        const normalizedName = status.name
            .trim()
            .toLocaleLowerCase("ca-ES");
        return (normalizedName ===
            "pendent de termini" ||
            normalizedName ===
                "termini obert");
    })
        .map((status) => status.id);
    const selectedStatusIds = params.statusId !== undefined ||
        statusFilterApplied
        ? rawStatusIds
        : defaultStatusIds;
    const applicationPeriod = parseSelectionProcessApplicationPeriod(params.applicationPeriod);

/**
 * ==========================================================
 * TERRITORIO
 * ==========================================================
 */
    const province = cleanString(params.province);
    const county = cleanString(params.county);
    const municipality = cleanString(params.municipality);
    const radiusKm = municipality
        ? parseRadiusKm(params.radiusKm)
        : undefined;

/**
 * ==========================================================
 * OTROS FILTROS
 * ==========================================================
 */
    const scopeId = parsePositiveInteger(params.scopeId);
    const selectionSystemId = parsePositiveInteger(params.selectionSystemId);
    const personnelTypeId = parsePositiveInteger(params.personnelTypeId);

/**
 * ==========================================================
 * FECHAS
 * ==========================================================
 */
    const applicationEndDateFromValue = cleanString(params.applicationEndDateFrom);
    const applicationEndDateToValue = cleanString(params.applicationEndDateTo);
    const applicationEndDateFrom = parseDate(applicationEndDateFromValue);
    const applicationEndDateTo = parseDate(applicationEndDateToValue);

/**
 * ==========================================================
 * RESERVAS
 * ==========================================================
 */
    const reservedDisability = params.reservedDisability ===
        "true";
    const reservedUnemployed = params.reservedUnemployed ===
        "true";
    const reservedYoung = params.reservedYoung ===
        "true";
    const reservedWomen = params.reservedWomen ===
        "true";
    const currentFilters: CurrentFilterState = {
        sort,
        qualificationGroups: selectedQualificationGroups,
        jobPoolValues,
        statusIds: selectedStatusIds,
        applicationPeriod,
        province,
        county,
        municipality,
        radiusKm,
        scopeId,
        selectionSystemId,
        personnelTypeId,
        applicationEndDateFrom: applicationEndDateFromValue,
        applicationEndDateTo: applicationEndDateToValue,
        reservedDisability,
        reservedUnemployed,
        reservedYoung,
        reservedWomen,
    };
    const resultsUrl = buildPageHref(page, query, currentFilters, activeView);
    const listHref = buildPageHref(page, query, currentFilters, "list");
    const mapHref = buildPageHref(page, query, currentFilters, "map");
    const filterFormKey = buildFilterFormKey(query, page, currentFilters);

/**
 * ==========================================================
 * POSTGRESQL
 * ==========================================================
 */
    // Un mismo objeto de filtros para el listado y los municipios del mapa.
    // Asi ambos muestran las mismas coincidencias, con o sin paginacion.
    const searchFilters: SelectionProcessSearchFilters = {
            sort,
            text: query ||
                undefined,
            qualificationGroup: selectedQualificationGroups.length >
                0
                ? selectedQualificationGroups
                : undefined,
            isJobPool,
            statusId: selectedStatusIds.length >
                0
                ? selectedStatusIds
                : undefined,
            applicationPeriod,
            province,
            county,
            municipality,
            radiusKm,
            scopeId,
            selectionSystemId,
            personnelTypeId,
            applicationEndDateFrom,
            applicationEndDateTo,
            reservedDisability: reservedDisability
                ? true
                : undefined,
            reservedUnemployed: reservedUnemployed
                ? true
                : undefined,
            reservedYoung: reservedYoung
                ? true
                : undefined,
            reservedWomen: reservedWomen
                ? true
                : undefined,
    };

    const result = await listActiveSelectionProcessesUseCase.execute({
        page,
        pageSize: 20,
        filters: searchFilters,
    });

    // La consulta municipal es independiente de la paginacion (20 tarjetas).
    // No se realiza al navegar por el listado para evitar trabajo adicional.
    const municipalityMapPoints = activeView === "map"
        ? await listSelectionProcessMunicipalityMapPointsUseCase.execute(searchFilters)
        : [];

    const mappedCount = municipalityMapPoints.reduce(
        (total, point) => total + point.count,
        0,
    );

    const mapMarkers = municipalityMapPoints.map((point) => ({
        municipality: point.municipality,
        province: point.province,
        latitude: point.latitude,
        longitude: point.longitude,
        count: point.count,
        selected: Boolean(
            municipality &&
            point.municipality.toLocaleLowerCase("ca-ES") === municipality.toLocaleLowerCase("ca-ES") &&
            (!province || point.province.toLocaleLowerCase("ca-ES") === province.toLocaleLowerCase("ca-ES")),
        ),
        // Un marcador abre el listado filtrado por municipio. Se conserva el
        // resto de filtros, pero se limpia la comarca/radio para evitar que
        // el municipio elegido quede excluido por el filtro territorial anterior.
        href: buildPageHref(
            1,
            query,
            {
                ...currentFilters,
                province: point.province || undefined,
                county: undefined,
                municipality: point.municipality,
                radiusKm: undefined,
            },
            "list",
        ),
    }));

    return (<div className="flex min-h-screen bg-[#F4F6F9]">

      <AppSidebar isAuthenticated={isAuthenticated} activeItem="convocatorias"/>

      <div className="flex min-w-0 flex-1 flex-col">

        <AppHeader title="Buscar convocatorias" user={session?.user
            ? {
                name: session.user
                    .name,
                email: session.user
                    .email,
            }
            : undefined}/>

        <main className="flex-1 px-4 py-8 lg:px-6 lg:pb-12">

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

            {/* Buscador */}

            <div className="flex gap-2.5">

              <div className="relative flex-1">

                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C859B]"/>

                <input key={`search-${filterFormKey}`} form={FILTER_FORM_ID} type="search" name="q" maxLength={100} defaultValue={query} placeholder="Busca por puesto, organismo, municipio..." className="h-[52px] w-full rounded-lg border border-[#D5DAE3] bg-white pl-12 pr-4 text-[15px] outline-none focus:border-[#4F5BD5]"/>

              </div>

              <button form={FILTER_FORM_ID} type="submit" className="h-[52px] rounded-[10px] bg-[#4F5BD5] px-7 text-[15px] font-semibold text-white hover:bg-[#3B45B5]">

                Buscar

              </button>

            </div>

            {/* Contenido */}

            <div className="grid items-start gap-7 lg:grid-cols-[300px_minmax(0,1fr)]">

              {/* Filtros */}

              <aside className="rounded-xl border border-[#E3E7EE] bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-[#EEF1F5] px-5 py-4">

                  <h2 className="flex items-center gap-2 text-[15px] font-semibold">

                    <SlidersHorizontal size={16} className="text-[#4E5870]"/>

                    Filtros

                  </h2>

                  <Link href={activeView === "map" ? "/convocatorias?view=map" : "/convocatorias"} className="text-[13.5px] font-semibold text-[#3B45B5] hover:text-[#2E3794]">

                    Limpiar

                  </Link>

                </div>

                <form key={filterFormKey} id={FILTER_FORM_ID} action="/convocatorias">
                  {/* El formulario mantiene la vista al buscar o aplicar filtros. */}
                  {activeView === "map" && (
                    <>
                      <input type="hidden" name="view" value="map" />
                      {/* En el mapa no se muestra el selector de ordenacion. */}
                      <input type="hidden" name="sort" value={sort} />
                    </>
                  )}

                  {/* Tipo */}

                  <FilterSection title="Tipo de convocatoria">

                    <FilterCheckLabel name="isJobPool" value="false" label="Plazas de plantilla" checked={hasRegularPositions}/>

                    <FilterCheckLabel name="isJobPool" value="true" label="Bolsa de trabajo" checked={hasJobPools}/>

                  </FilterSection>

                  {/* Estado oficial CIDO */}

                  <FilterSection title="Estado oficial CIDO">

                    <input type="hidden" name="statusFilterApplied" value="1"/>

                    {filterOptions.statuses.map((status) => (<FilterCheckLabel key={status.id} name="statusId" value={String(status.id)} label={status.name} checked={selectedStatusIds.includes(status.id)}/>))}

                  </FilterSection>

                  {/* Plazo de solicitud */}

                  <FilterSection title="Plazo de solicitud">

                    <FilterSelect name="applicationPeriod" defaultValue={applicationPeriod ??
            ""} emptyLabel="Todos los plazos" options={[
            {
                value: "open",
                label: "Abierto ahora",
            },
            {
                value: "future",
                label: "Próximo a abrir",
            },
            {
                value: "closed",
                label: "Finalizado",
            },
            {
                value: "unknown",
                label: "Sin fechas disponibles",
            },
        ]}/>

                  </FilterSection>

                  {/* Ubicación */}

                  <FilterSection title="Ubicación">

                    <TerritoryFilters key={`territory-${filterFormKey}`} territories={filterOptions.territories} initialProvince={province} initialCounty={county} initialMunicipality={municipality}/>

                    <label className="mt-2 flex flex-col gap-1.5 text-sm text-[#131A2C]">

                      <span className="text-xs font-medium text-[#69738A]">

                        Distancia desde el municipio

                      </span>

                      <select name="radiusKm" defaultValue={radiusKm !==
            undefined
            ? String(radiusKm)
            : ""} className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]">

                        <option value="">

                          Sin límite

                        </option>

                        <option value="5">

                          Hasta 5 km

                        </option>

                        <option value="10">

                          Hasta 10 km

                        </option>

                        <option value="25">

                          Hasta 25 km

                        </option>

                        <option value="50">

                          Hasta 50 km

                        </option>

                        <option value="100">

                          Hasta 100 km

                        </option>

                      </select>

                      <span className="text-xs leading-relaxed text-[#7C859B]">

                        Se calcula en línea recta desde el municipio seleccionado.

                      </span>

                    </label>

                  </FilterSection>

                  {/* Grupo */}

                  <FilterSection title="Grupo de titulación">

                    {filterOptions
            .qualificationGroups
            .length === 0 ? (<p className="text-sm text-[#69738A]">

                        No hay grupos

                        disponibles.

                      </p>) : (filterOptions.qualificationGroups.map((group) => (<FilterCheckLabel key={group} name="qualificationGroup" value={group} label={group} checked={selectedQualificationGroups.includes(group)}/>)))}

                  </FilterSection>

                  {/* Ámbito */}

                  <FilterSection title="Ámbito">

                    <FilterSelect name="scopeId" defaultValue={scopeId !==
            undefined
            ? String(scopeId)
            : ""} emptyLabel="Todos los ámbitos" options={filterOptions.scopes.map((option) => ({
            value: String(option.id),
            label: option.name,
        }))}/>

                  </FilterSection>

                  {/* Sistema */}

                  <FilterSection title="Sistema de selección">

                    <FilterSelect name="selectionSystemId" defaultValue={selectionSystemId !==
            undefined
            ? String(selectionSystemId)
            : ""} emptyLabel="Todos los sistemas" options={filterOptions.selectionSystems.map((option) => ({
            value: String(option.id),
            label: option.name,
        }))}/>

                  </FilterSection>

                  {/* Personal */}

                  <FilterSection title="Tipo de personal">

                    <FilterSelect name="personnelTypeId" defaultValue={personnelTypeId !==
            undefined
            ? String(personnelTypeId)
            : ""} emptyLabel="Todos los tipos" options={filterOptions.personnelTypes.map((option) => ({
            value: String(option.id),
            label: option.name,
        }))}/>

                  </FilterSection>

                  {/* Fechas */}

                  <FilterSection title="Fin del plazo de solicitud">

                    <label className="flex flex-col gap-1.5 text-sm text-[#131A2C]">

                      <span className="text-xs font-medium text-[#69738A]">

                        Desde

                      </span>

                      <input type="date" name="applicationEndDateFrom" defaultValue={applicationEndDateFromValue ??
            ""} className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm outline-none focus:border-[#4F5BD5]"/>

                    </label>

                    <label className="flex flex-col gap-1.5 text-sm text-[#131A2C]">

                      <span className="text-xs font-medium text-[#69738A]">

                        Hasta

                      </span>

                      <input type="date" name="applicationEndDateTo" defaultValue={applicationEndDateToValue ??
            ""} className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm outline-none focus:border-[#4F5BD5]"/>

                    </label>

                  </FilterSection>

                  {/* Reservas */}

                  <FilterSection title="Reservas">

                    <FilterCheckLabel name="reservedDisability" value="true" label="Personas con discapacidad" checked={reservedDisability}/>

                    <FilterCheckLabel name="reservedUnemployed" value="true" label="Personas desempleadas" checked={reservedUnemployed}/>

                    <FilterCheckLabel name="reservedYoung" value="true" label="Jóvenes" checked={reservedYoung}/>

                    <FilterCheckLabel name="reservedWomen" value="true" label="Mujeres" checked={reservedWomen}/>

                  </FilterSection>

                  <div className="p-5">

                    <button type="submit" className="w-full rounded-lg bg-[#4F5BD5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3B45B5]">

                      Aplicar filtros

                    </button>

                  </div>

                </form>

              </aside>

              {/* Resultados */}

              <section className="flex min-w-0 flex-col gap-4">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                  <div>

                    <h2 className="text-[17px] font-semibold text-[#131A2C]">

                      Convocatorias

                    </h2>

                    <p className="mt-1 text-sm text-[#69738A]">

                      {result.totalItems}{" "}

                      convocatorias

                      encontradas

                    </p>

                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                  <SelectionProcessResultsViewToggle
                    activeView={activeView}
                    listHref={listHref}
                    mapHref={mapHref}
                  />
                  {activeView === "list" && (
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="flex min-w-[230px] flex-col gap-1.5 text-sm text-[#131A2C]">

                      <span className="text-xs font-medium text-[#69738A]">

                        Ordenar por

                      </span>

                      <select form={FILTER_FORM_ID} name="sort" defaultValue={sort} className="h-10 rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]">

                        <option value="relevance">

                          Relevancia

                        </option>

                        <option value="publication-desc">

                          Última publicación oficial

                        </option>

                        <option value="deadline-asc">

                          Plazo: finaliza antes

                        </option>

                        <option value="deadline-desc">

                          Plazo: finaliza después

                        </option>

                        <option value="municipality-asc">

                          Municipio: A → Z

                        </option>

                      </select>

                    </label>

                    <button form={FILTER_FORM_ID} type="submit" className="h-10 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]">

                      Ordenar

                    </button>
                  </div>
                  )}
                  </div>

                </div>

              {activeView === "map" && (
                <div className="rounded-xl border border-[#E3E7EE] bg-white p-4 shadow-sm">
                  {mapMarkers.length > 0 ? (
                    <>
                      <p className="mb-3 text-sm text-[#4E5870]">
                        Selecciona un municipio para ver sus convocatorias en el listado.
                        Puedes ampliar el mapa y acercarte a los marcadores agrupados.
                      </p>
                      <IcgcMunicipalitiesMap
                        markers={mapMarkers}
                        mode="search"
                        height={580}
                      />
                      {mappedCount < result.totalItems && (
                        <p className="mt-3 text-xs leading-relaxed text-[#69738A]">
                          {result.totalItems - mappedCount} convocatorias coincidentes no tienen
                          ubicación municipal representable en el mapa; siguen disponibles en el listado.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                      <MapPin size={28} className="text-[#7C859B]" aria-hidden="true" />
                      <p className="text-base font-semibold text-[#131A2C]">
                        {result.totalItems === 0
                          ? "No se han encontrado convocatorias"
                          : "No hay municipios con coordenadas disponibles"}
                      </p>
                      <p className="max-w-lg text-sm text-[#69738A]">
                        {result.totalItems === 0
                          ? "Prueba con otros criterios de búsqueda."
                          : "Las convocatorias encontradas siguen disponibles en el listado."}
                      </p>
                    </div>
                  )}
                </div>
              )}

                {activeView === "list" && (result.items.length ===
            0 ? (<div className="rounded-xl border border-[#E3E7EE] bg-white p-8 text-center shadow-sm">

                    <Search size={30} className="mx-auto text-[#7C859B]"/>

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

                  </div>) : (result.items.map((convocatoria) => {
            const officialStatus = getOfficialStatusPresentation(convocatoria.status, convocatoria.statusId);
            const applicationPeriod = getApplicationPeriodPresentation(convocatoria.applicationStartDate, convocatoria.applicationEndDate);
            const hasReservations = hasReservedPlaces(convocatoria.reservedPlaces);
            return (<article key={convocatoria.id} className="overflow-hidden rounded-xl border border-[#E3E7EE] bg-white shadow-sm transition-shadow hover:shadow-md">

                          <div className="flex flex-col gap-5 p-5">

                            {/* Badges */}

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1FA] bg-[#EEF0FC] px-3 text-xs font-semibold text-[#3B45B5]">

                                {convocatoria.isJobPool
                    ? "Bolsa de trabajo"
                    : "Plaza de plantilla"}

                              </span>

                              <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${officialStatus.badgeClassName}`}>

                                <span className={`h-1.5 w-1.5 rounded-full ${officialStatus.dotClassName}`}/>

                                Oficial: {officialStatus.label}

                              </span>

                              <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${applicationPeriod.badgeClassName}`}>

                                <span className={`h-1.5 w-1.5 rounded-full ${applicationPeriod.dotClassName}`}/>

                                Solicitudes: {buildApplicationPeriodBadgeText(applicationPeriod)}

                              </span>

                            </div>

                            {/* Título */}

                            <div>

                              <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.01em] text-[#131A2C]">

                                {formatSelectionProcessTitle(convocatoria.title)}

                              </h3>

                              <div className="mt-3 flex flex-col gap-2 text-sm text-[#4E5870]">

                                <div className="flex items-start gap-2">

                                  <Building2 size={16} className="mt-0.5 shrink-0 text-[#7C859B]"/>

                                  <span>

                                    {convocatoria
                    .institution
                    ?.name ??
                    "Organismo no disponible"}

                                  </span>

                                </div>

                                <div className="flex items-start gap-2">

                                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#7C859B]"/>

                                  <span>

                                    {formatLocation(convocatoria
                    .institution
                    ?.municipality, convocatoria
                    .institution
                    ?.county, convocatoria
                    .institution
                    ?.province)}

                                  </span>

                                </div>

                              </div>

                            </div>

                            {/* Información */}

                            <div className="grid overflow-hidden rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] sm:grid-cols-2 xl:grid-cols-3">

                              <ResultInfoItem label="Plazas" value={formatNumberOfPositions(convocatoria.numberOfPositions, convocatoria.isJobPool)}/>

                              <ResultInfoItem label="Grupo" value={convocatoria.qualificationGroup ??
                    "No especificado"}/>

                              <ResultInfoItem label="Personal" value={convocatoria.personnelType ??
                    "No especificado"}/>

                              <ResultInfoItem label="Sistema" value={convocatoria.selectionSystem ??
                    "No especificado"}/>

                              <ResultInfoItem label="Ámbito" value={convocatoria.scope ||
                    "No especificado"}/>

                              <ResultInfoItem label="Fin del plazo de solicitud" value={convocatoria.applicationEndDate
                    ? formatDate(convocatoria.applicationEndDate)
                    : "No disponible"}/>

                            </div>

                            {/* Reservas */}

                            {hasReservations && (<div className="flex flex-wrap items-center gap-2">

                                <span className="mr-1 text-xs font-semibold uppercase tracking-[0.04em] text-[#7C859B]">

                                  Reservas

                                </span>

                                {convocatoria
                        .reservedPlaces
                        .disability !==
                        null &&
                        convocatoria
                            .reservedPlaces
                            .disability >
                            0 && (<ReservationBadge>

                                      Discapacidad:{" "}

                                      {convocatoria
                            .reservedPlaces
                            .disability}

                                    </ReservationBadge>)}

                                {convocatoria
                        .reservedPlaces
                        .unemployed && (<ReservationBadge>

                                    Personas

                                    desempleadas

                                  </ReservationBadge>)}

                                {convocatoria
                        .reservedPlaces
                        .youngPeople && (<ReservationBadge>

                                    Jóvenes

                                  </ReservationBadge>)}

                                {convocatoria
                        .reservedPlaces
                        .women && (<ReservationBadge>

                                    Mujeres

                                  </ReservationBadge>)}

                              </div>)}

                            {/* Acciones */}

                            <div className="flex flex-wrap items-center gap-3 border-t border-[#EEF1F5] pt-4">

                              <Link href={`/convocatorias/${convocatoria.id}?returnTo=${encodeURIComponent(resultsUrl)}`} className="inline-flex items-center justify-center rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]">

                                Ver detalle

                              </Link>

                              <a href={convocatoria.cidoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]">

                                Ver convocatoria

                                oficial

                                <ExternalLink size={14}/>

                              </a>

                            </div>

                          </div>

                        </article>);
        })))}

                {/* Paginación: exclusivamente para la vista listado. */}

                {activeView === "list" && result.totalPages >
            1 && (<div className="flex items-center justify-between rounded-xl border border-[#E3E7EE] bg-white px-5 py-4 shadow-sm">

                    <div className="text-sm text-[#4E5870]">

                      Página{" "}

                      <span className="font-semibold text-[#131A2C]">

                        {result.page}

                      </span>{" "}

                      de{" "}

                      <span className="font-semibold text-[#131A2C]">

                        {result.totalPages}

                      </span>

                    </div>

                    <div className="flex gap-2">

                      {result.page >
                1 ? (<Link href={buildPageHref(result.page -
                    1, query, currentFilters)} className="rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#131A2C] hover:bg-[#F4F6F9]">

                          Anterior

                        </Link>) : (<span className="cursor-not-allowed rounded-lg border border-[#E3E7EE] bg-[#F4F6F9] px-4 py-2 text-sm font-semibold text-[#A0A7B5]">

                          Anterior

                        </span>)}

                      {result.page <
                result.totalPages ? (<Link href={buildPageHref(result.page +
                    1, query, currentFilters)} className="rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]">

                          Siguiente

                        </Link>) : (<span className="cursor-not-allowed rounded-lg bg-[#E3E7EE] px-4 py-2 text-sm font-semibold text-[#A0A7B5]">

                          Siguiente

                        </span>)}

                    </div>

                  </div>)}

              </section>

            </div>

          </div>

        </main>

      </div>

    </div>);
}

/**

 * ============================================================

 * RESULTADOS

 * ============================================================

 */

type ResultInfoItemProps = {
    label: string;
    value: string;
};

function ResultInfoItem({ label, value, }: ResultInfoItemProps) {
    return (<div className="min-w-0 border-b border-r border-[#E7EAF0] px-4 py-3">

      <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">

        {label}

      </p>

      <p className="mt-1 break-words text-[13.5px] font-medium leading-snug text-[#131A2C]">

        {value}

      </p>

    </div>);
}

function ReservationBadge({ children, }: {
    children: ReactNode;
}) {
    return (<span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1E8] bg-[#F4F6F9] px-3 text-xs font-medium text-[#4E5870]">

      {children}

    </span>);
}

function hasReservedPlaces(reservedPlaces: {
    disability: number | null;
    unemployed: boolean;
    youngPeople: boolean;
    women: boolean;
}): boolean {
    return ((reservedPlaces.disability ??
        0) > 0 ||
        reservedPlaces.unemployed ||
        reservedPlaces.youngPeople ||
        reservedPlaces.women);
}

function formatNumberOfPositions(numberOfPositions: number | null, isJobPool: boolean): string {
    if (isJobPool) {
        return "—";
    }
    if (numberOfPositions === null ||
        numberOfPositions <= 0) {
        return "Sin definir";
    }
    return String(numberOfPositions);
}

function buildApplicationPeriodBadgeText(period: ReturnType<typeof getApplicationPeriodPresentation>): string {
    if (period.state ===
        "open") {
        if (period.label ===
            "Finaliza hoy") {
            return period.label;
        }
        return `${period.label} · ${period.detail}`;
    }
    if (period.state ===
        "future") {
        return `${period.label} · ${period.detail}`;
    }
    return period.label;
}

/**

 * ============================================================

 * QUERY PARAMS

 * ============================================================

 */

function normalizeArray(value: string | string[] | undefined): string[] {
    if (value === undefined) {
        return [];
    }
    return Array.isArray(value)
        ? value
        : [value];
}

function cleanString(value: string | undefined): string | undefined {
    const cleaned = value?.trim();
    return cleaned
        ? cleaned
        : undefined;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
    if (!value) {
        return undefined;
    }
    const number = Number(value);
    if (!Number.isInteger(number) ||
        number < 1) {
        return undefined;
    }
    return number;
}

function parseRadiusKm(value: string | undefined): number | undefined {
    if (!value) {
        return undefined;
    }
    const radius = Number(value);
    const allowedRadiusValues = [
        5,
        10,
        25,
        50,
        100,
    ];
    return allowedRadiusValues.includes(radius)
        ? radius
        : undefined;
}

function parseSelectionProcessApplicationPeriod(value: string | undefined): SelectionProcessApplicationPeriodFilter | undefined {
    if (value === "open" ||
        value === "future" ||
        value === "closed" ||
        value === "unknown") {
        return value;
    }
    return undefined;
}

function parseSelectionProcessSort(value: string | undefined): SelectionProcessSort | undefined {
    const allowedSortValues: SelectionProcessSort[] = [
        "relevance",
        "publication-desc",
        "deadline-asc",
        "deadline-desc",
        "municipality-asc",
    ];
    return allowedSortValues.includes(value as SelectionProcessSort)
        ? (value as SelectionProcessSort)
        : undefined;
}

function resolveSelectionProcessSort(sort: SelectionProcessSort | undefined, hasTextSearch: boolean): SelectionProcessSort {
    if (sort === undefined) {
        return hasTextSearch
            ? "relevance"
            : "deadline-asc";
    }
    if (sort === "relevance" &&
        !hasTextSearch) {
        return "deadline-asc";
    }
    return sort;
}

function parseDate(value: string | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime())
        ? undefined
        : date;
}

/**

 * ============================================================

 * URLS

 * ============================================================

 */

function buildPageHref(
    page: number,
    query: string,
    filters: CurrentFilterState,
    view: SelectionProcessResultsView = "list",
): string {
    const params = new URLSearchParams();
    if (view === "map") {
        params.set("view", "map");
    }
    if (query) {
        params.set("q", query);
    }
    appendFiltersToParams(params, filters);
    params.set("page", String(page));
    return `/convocatorias?${params.toString()}`;
}

function buildFilterFormKey(query: string, page: number, filters: CurrentFilterState): string {
    return JSON.stringify({
        query,
        page,
        sort: filters.sort,
        qualificationGroups: filters.qualificationGroups,
        jobPoolValues: filters.jobPoolValues,
        statusIds: filters.statusIds,
        applicationPeriod: filters.applicationPeriod,
        province: filters.province,
        county: filters.county,
        municipality: filters.municipality,
        radiusKm: filters.radiusKm,
        scopeId: filters.scopeId,
        selectionSystemId: filters.selectionSystemId,
        personnelTypeId: filters.personnelTypeId,
        applicationEndDateFrom: filters.applicationEndDateFrom,
        applicationEndDateTo: filters.applicationEndDateTo,
        reservedDisability: filters.reservedDisability,
        reservedUnemployed: filters.reservedUnemployed,
        reservedYoung: filters.reservedYoung,
        reservedWomen: filters.reservedWomen,
    });
}

function appendFiltersToParams(params: URLSearchParams, filters: CurrentFilterState) {
    params.set("sort", filters.sort);
    filters.qualificationGroups.forEach((group) => {
        params.append("qualificationGroup", group);
    });
    filters.jobPoolValues.forEach((value) => {
        params.append("isJobPool", value);
    });
    params.set("statusFilterApplied", "1");
    filters.statusIds.forEach((statusId) => {
        params.append("statusId", String(statusId));
    });
    if (filters.applicationPeriod) {
        params.set("applicationPeriod", filters.applicationPeriod);
    }
    if (filters.province) {
        params.set("province", filters.province);
    }
    if (filters.county) {
        params.set("county", filters.county);
    }
    if (filters.municipality) {
        params.set("municipality", filters.municipality);
    }
    if (filters.radiusKm !==
        undefined) {
        params.set("radiusKm", String(filters.radiusKm));
    }
    if (filters.scopeId !==
        undefined) {
        params.set("scopeId", String(filters.scopeId));
    }
    if (filters.selectionSystemId !==
        undefined) {
        params.set("selectionSystemId", String(filters.selectionSystemId));
    }
    if (filters.personnelTypeId !==
        undefined) {
        params.set("personnelTypeId", String(filters.personnelTypeId));
    }
    if (filters.applicationEndDateFrom) {
        params.set("applicationEndDateFrom", filters.applicationEndDateFrom);
    }
    if (filters.applicationEndDateTo) {
        params.set("applicationEndDateTo", filters.applicationEndDateTo);
    }
    if (filters.reservedDisability) {
        params.set("reservedDisability", "true");
    }
    if (filters.reservedUnemployed) {
        params.set("reservedUnemployed", "true");
    }
    if (filters.reservedYoung) {
        params.set("reservedYoung", "true");
    }
    if (filters.reservedWomen) {
        params.set("reservedWomen", "true");
    }
}

/**

 * ============================================================

 * FORMATO

 * ============================================================

 */

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

function formatLocation(municipality: string | null | undefined, county: string | null | undefined, province: string | null | undefined): string {
    const values = [
        municipality,
        county,
        province,
    ].filter((value): value is string => typeof value ===
        "string" &&
        value.length > 0);
    return values.length >
        0
        ? values.join(" · ")
        : "Ubicación no disponible";
}

/**

 * ============================================================

 * COMPONENTES DE FILTROS

 * ============================================================

 */

type FilterSectionProps = {
    title: string;
    children: ReactNode;
};

function FilterSection({ title, children, }: FilterSectionProps) {
    return (<fieldset className="border-b border-[#EEF1F5] px-5 py-4">

      <legend className="mb-3 text-[13.5px] font-semibold text-[#131A2C]">

        {title}

      </legend>

      <div className="flex flex-col gap-2.5">

        {children}

      </div>

    </fieldset>);
}

type FilterCheckLabelProps = {
    name: string;
    value: string;
    label: string;
    checked: boolean;
};

function FilterCheckLabel({ name, value, label, checked, }: FilterCheckLabelProps) {
    return (<label className="flex min-h-[30px] cursor-pointer items-start gap-2.5 text-sm text-[#131A2C]">

      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-[#D5DAE3]"/>

      <span>

        {label}

      </span>

    </label>);
}

type FilterSelectOption = {
    value: string;
    label: string;
};

type FilterSelectProps = {
    name: string;
    defaultValue: string;
    emptyLabel: string;
    options: FilterSelectOption[];
};

function FilterSelect({ name, defaultValue, emptyLabel, options, }: FilterSelectProps) {
    return (<select name={name} defaultValue={defaultValue} className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]">

      <option value="">

        {emptyLabel}

      </option>

      {options.map((option) => (<option key={option.value} value={option.value}>

            {option.label}

          </option>))}

    </select>);
}
