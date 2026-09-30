export type CidoSelectionProcessAttributes = {
  institucioDesenvolupat: string;
  latitud: number | null;
  longitud: number | null;
  urlGoogleMaps: string | null;

  idAmbit: number;
  ambit: string;

  titol: string;
  borsaTreball: boolean;
  identificador: string;
  expedient: string | null;
  anyOpo: number | null;

  dataInici: string | null;
  dataFinalitzacio: string | null;
  horaFinalitzacio: string | null;
  observacionsTermini: string | null;

  idSistemaSeleccio: number | null;
  sistemaSeleccio: string | null;

  idTipusPersonal: number | null;
  tipusPersonal: string | null;

  idGrupTitulacio: number | null;
  grupTitulacio: string | null;

  titulacioRequerida: string | null;
  altresRequisits: string | null;

  numPlaces: number | null;

  placesReservadesDiscapacitat: number | null;
  placesReservadesAtur: boolean;
  placesReservadesJoves: boolean;
  placesReservadesDones: boolean;

  dataProva: string | null;
  observacions: string | null;

  urlWeb: string | null;
  accesTramit: string | null;

  idEstat: number;
  estat: string;

  urlCido: string;
  urlSubscripcio: string | null;

  maxDataPublicacioDocument: string | null;
};

export type CidoSelectionProcessResource = {
  id: string;
  type: "oposicions";
  attributes: CidoSelectionProcessAttributes;
};

export type CidoSelectionProcessesResponse = {
  data: CidoSelectionProcessResource[];

  links: {
    first?: string;
    last?: string;
    next?: string;
    self: string;
  };

  meta: {
    totalResourceCount: number;
  };
};
export type CidoSelectionProcessResponse = {
  data: CidoSelectionProcessResource | null;
};