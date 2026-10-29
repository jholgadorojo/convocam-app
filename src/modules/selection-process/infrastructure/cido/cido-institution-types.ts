import { z } from "zod";

// CIDO envía los códigos como número, pero se aceptan
// también como texto: el mapper normaliza ambos.
const nullableCode = z.union([z.string(), z.number()]).nullable();
const nullableString = z.string().nullable();

export const cidoInstitutionResourceSchema = z.object({
  id: z.string().min(1),
  type: z.literal("institucions"),
  attributes: z.object({
    institucioDesenvolupat: z.string(),
    institucioAbreujat: nullableString,
    institucioActiva: z.boolean(),

    latitud: z.number().nullable(),
    longitud: z.number().nullable(),

    codiIne: nullableCode,
    adreca: nullableString,
    codiPostal: nullableCode,

    municipi: nullableString,

    codiComarca: nullableCode,
    comarca: nullableString,

    codiProvincia: nullableCode,
    provincia: nullableString,

    urlPerfilContractant: nullableString,

    soc: nullableCode,
    sepe: nullableCode,
  }),
});

export type CidoInstitutionResource = z.infer<
  typeof cidoInstitutionResourceSchema
>;

export type CidoInstitutionAttributes =
  CidoInstitutionResource["attributes"];

export const cidoInstitutionResponseSchema = z.object({
  data: cidoInstitutionResourceSchema.nullable(),
});

export type CidoInstitutionResponse = z.infer<
  typeof cidoInstitutionResponseSchema
>;
