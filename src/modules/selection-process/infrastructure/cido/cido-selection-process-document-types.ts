import { z } from "zod";

const nullableString = z.string().nullable();

export const cidoSelectionProcessDocumentResourceSchema = z.object({
  id: z.string().min(1),
  type: z.literal("documents"),
  attributes: z.object({
    dataPublicacio: z.iso.date(),
    resum: z.string(),
    anunciant: nullableString,

    idButlleti: z.number().int(),
    butlleti: z.string(),
    numButlleti: z.number().int().nullable(),

    dataEntrada: z.iso.date(),

    idFase: z.number().int(),
    fase: z.string(),
    observacionsFase: nullableString,

    urlPdf: nullableString,
    urlHtml: nullableString,
  }),
});

export type CidoSelectionProcessDocumentResource = z.infer<
  typeof cidoSelectionProcessDocumentResourceSchema
>;

export type CidoSelectionProcessDocumentAttributes =
  CidoSelectionProcessDocumentResource["attributes"];

export const cidoSelectionProcessDocumentsResponseSchema = z.object({
  data: z.array(cidoSelectionProcessDocumentResourceSchema),
});

export type CidoSelectionProcessDocumentsResponse = z.infer<
  typeof cidoSelectionProcessDocumentsResponseSchema
>;
