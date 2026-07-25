import { z } from "zod";

export const leadSchema = z.object({
  email: z.string().email("email inválido"),
  source: z.string().max(50).optional().default("landing"),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, "termo obrigatório").max(120, "termo muito longo"),
});

export const trendingQuerySchema = z
  .object({
    category: z.string().min(3, "categoria inválida").max(40, "categoria muito longa"),
    minPrice: z.coerce.number().min(0, "preço mínimo inválido").optional(),
    maxPrice: z.coerce.number().min(0, "preço máximo inválido").optional(),
    sellerId: z.string().min(1).max(40).optional(),
    minPosition: z.coerce.number().int().positive().max(200).optional(),
    q: z.string().min(2, "termo muito curto").max(60, "termo muito longo").optional(),
    sort: z.enum(["position", "price_asc", "price_desc"]).optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.minPrice != null &&
      val.maxPrice != null &&
      val.maxPrice < val.minPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxPrice"],
        message: "maxPrice deve ser >= minPrice",
      });
    }
  });
