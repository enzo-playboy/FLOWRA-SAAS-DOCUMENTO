import { z } from "zod";

export const leadSchema = z.object({
  email: z.string().email("email inválido"),
  source: z.string().max(50).optional().default("landing"),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, "termo obrigatório").max(120, "termo muito longo"),
});
