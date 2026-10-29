import { z } from "zod";

export const cidoSubjectAreaResourceSchema = z.object({
  id: z.string().min(1),
  type: z.literal("materies"),
  attributes: z.object({
    materia: z.string(),
    idModul: z.number().int(),
  }),
});

export type CidoSubjectAreaResource = z.infer<
  typeof cidoSubjectAreaResourceSchema
>;

export type CidoSubjectAreaAttributes =
  CidoSubjectAreaResource["attributes"];

export const cidoSubjectAreasResponseSchema = z.object({
  data: z.array(cidoSubjectAreaResourceSchema),
});

export type CidoSubjectAreasResponse = z.infer<
  typeof cidoSubjectAreasResponseSchema
>;
