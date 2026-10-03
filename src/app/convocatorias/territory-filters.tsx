"use client";

import {
  useMemo,
  useState,
} from "react";

type Territory = {
  province: string;
  county: string | null;
  municipality: string | null;
};

type TerritoryFiltersProps = {
  territories: Territory[];

  initialProvince?: string;
  initialCounty?: string;
  initialMunicipality?: string;
};

export function TerritoryFilters({
  territories,
  initialProvince,
  initialCounty,
  initialMunicipality,
}: TerritoryFiltersProps) {
  const [province, setProvince] =
    useState(initialProvince ?? "");

  const [county, setCounty] =
    useState(initialCounty ?? "");

  const [
    municipality,
    setMunicipality,
  ] = useState(
    initialMunicipality ?? "",
  );

  /*
   * Provincias existentes
   */
  const provinces = useMemo(() => {
    return uniqueSorted(
      territories.map(
        (territory) =>
          territory.province,
      ),
    );
  }, [territories]);

  /*
   * Solo comarcas de la provincia
   * seleccionada.
   */
  const counties = useMemo(() => {
    if (!province) {
      return [];
    }

    return uniqueSorted(
      territories
        .filter(
          (territory) =>
            territory.province ===
            province,
        )
        .map(
          (territory) =>
            territory.county,
        ),
    );
  }, [
    territories,
    province,
  ]);

  /*
   * Solo municipios de la comarca
   * seleccionada.
   */
  const municipalities =
    useMemo(() => {
      if (
        !province ||
        !county
      ) {
        return [];
      }

      return uniqueSorted(
        territories
          .filter(
            (territory) =>
              territory.province ===
                province &&
              territory.county ===
                county,
          )
          .map(
            (territory) =>
              territory.municipality,
          ),
      );
    }, [
      territories,
      province,
      county,
    ]);

  function handleProvinceChange(
    value: string,
  ) {
    setProvince(value);

    /*
     * Una comarca anterior puede
     * pertenecer a otra provincia.
     */
    setCounty("");
    setMunicipality("");
  }

  function handleCountyChange(
    value: string,
  ) {
    setCounty(value);

    /*
     * El municipio depende de comarca.
     */
    setMunicipality("");
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Provincia */}
      <select
        name="province"
        value={province}
        onChange={(event) =>
          handleProvinceChange(
            event.target.value,
          )
        }
        className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none focus:border-[#4F5BD5]"
      >
        <option value="">
          Todas las provincias
        </option>

        {provinces.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </select>

      {/* Comarca */}
      <select
        name="county"
        value={county}
        disabled={!province}
        onChange={(event) =>
          handleCountyChange(
            event.target.value,
          )
        }
        className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none disabled:cursor-not-allowed disabled:bg-[#F4F6F9] disabled:text-[#9AA2B2] focus:border-[#4F5BD5]"
      >
        <option value="">
          {province
            ? "Todas las comarcas"
            : "Selecciona una provincia"}
        </option>

        {counties.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </select>

      {/* Municipio */}
      <select
        name="municipality"
        value={municipality}
        disabled={
          !province ||
          !county
        }
        onChange={(event) =>
          setMunicipality(
            event.target.value,
          )
        }
        className="h-10 w-full rounded-lg border border-[#D5DAE3] bg-white px-3 text-sm text-[#131A2C] outline-none disabled:cursor-not-allowed disabled:bg-[#F4F6F9] disabled:text-[#9AA2B2] focus:border-[#4F5BD5]"
      >
        <option value="">
          {county
            ? "Todos los municipios"
            : "Selecciona una comarca"}
        </option>

        {municipalities.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </select>
    </div>
  );
}

function uniqueSorted(
  values: Array<
    string | null | undefined
  >,
): string[] {
  return [
    ...new Set(
      values
        .map(
          (value) =>
            value?.trim(),
        )
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
              "string" &&
            value.length > 0,
        ),
    ),
  ].sort((a, b) =>
    a.localeCompare(
      b,
      "ca",
    ),
  );
}