/**
 * Resumen territorial de convocatorias utilizado por el mapa de «Para mí».
 *
 * Cada punto agrupa las convocatorias que cumplen las preferencias del
 * opositor para un municipio y una provincia, independientemente de la
 * paginación del listado.
 *
 * Las coordenadas representan una ubicación válida dentro del municipio
 * derivada de los organismos convocantes. Los municipios sin coordenadas
 * disponibles no se podrán representar como marcadores.
 */
export type SelectionProcessMunicipalityMapPoint = {
  municipality: string;
  province: string;
  latitude: number;
  longitude: number;
  count: number;
};
