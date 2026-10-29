import { z } from "zod";

// Solo se declaran los campos que usa el mapper: zod
// descarta el resto, así que un cambio en un campo que
// no usamos no invalida la convocatoria.
const nullableString = z.string().nullable();
const nullableInt = z.number().int().nullable();
const nullableDate = z.iso.date().nullable();

export const cidoSelectionProcessResourceSchema = z.object({
  id: z.string().min(1),
  type: z.literal("oposicions"),
  attributes: z.object({
    institucioDesenvolupat: z.string(),

    idAmbit: z.number().int(),
    ambit: z.string(),

    titol: z.string(),
    borsaTreball: z.boolean(),
    identificador: z.string(),
    expedient: nullableString,
    anyOpo: nullableInt,

    dataInici: nullableDate,
    dataFinalitzacio: nullableDate,
    horaFinalitzacio: nullableString,
    observacionsTermini: nullableString,

    idSistemaSeleccio: nullableInt,
    sistemaSeleccio: nullableString,

    idTipusPersonal: nullableInt,
    tipusPersonal: nullableString,

    idGrupTitulacio: nullableInt,
    grupTitulacio: nullableString,

    titulacioRequerida: nullableString,
    altresRequisits: nullableString,

    numPlaces: nullableInt,

    placesReservadesDiscapacitat: nullableInt,
    placesReservadesAtur: z.boolean(),
    placesReservadesJoves: z.boolean(),
    placesReservadesDones: z.boolean(),

    dataProva: nullableDate,
    observacions: nullableString,

    urlWeb: nullableString,
    accesTramit: nullableString,

    idEstat: z.number().int(),
    estat: z.string(),

    urlCido: z.string(),

    maxDataPublicacioDocument: nullableDate,
  }),
});

export type CidoSelectionProcessResource = z.infer<
  typeof cidoSelectionProcessResourceSchema
>;

export type CidoSelectionProcessAttributes =
  CidoSelectionProcessResource["attributes"];

// En la lista solo se valida el envoltorio: cada
// convocatoria se valida por separado en
// CidoSelectionProcessSource para que una mal formada
// no impida sincronizar el resto de la página.
export const cidoSelectionProcessesResponseSchema = z.object({
  data: z.array(z.unknown()),

  meta: z.object({
    totalResourceCount: z.number().int().nonnegative(),
  }),
});

export type CidoSelectionProcessesResponse = z.infer<
  typeof cidoSelectionProcessesResponseSchema
>;

export const cidoSelectionProcessResponseSchema = z.object({
  data: cidoSelectionProcessResourceSchema.nullable(),
});

export type CidoSelectionProcessResponse = z.infer<
  typeof cidoSelectionProcessResponseSchema
>;
