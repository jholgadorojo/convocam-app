export type CidoInstitutionAttributes = {
  institucioDesenvolupat: string;
  institucioAbreujat: string | null;
  institucioActiva: boolean;

  latitud: number | null;
  longitud: number | null;
  urlGoogleMaps: string | null;

  codiIne: string | number | null;
  adreca: string | null;
  codiPostal: string | number | null;

  municipi: string | null;

  codiComarca: string | number | null;
  comarca: string | null;

  codiProvincia: string | number | null;
  provincia: string | null;

  urlPerfilContractant: string | null;

  soc: string | number | null;
  sepe: string | number | null;
};

export type CidoInstitutionResource = {
  id: string;
  type: "institucions";
  attributes: CidoInstitutionAttributes;
};

export type CidoInstitutionResponse = {
  data: CidoInstitutionResource | null;
};