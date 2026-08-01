import { z } from "zod";

export const minMaxSchema = z
  .object({
    min: z.coerce.number().int(),
    max: z.coerce.number().int(),
  })
  .refine((d) => d.min <= d.max, {
    message: "Min must be less than or equal to max",
    path: ["max"],
  });

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  layoutId: z.string().optional(),
});

export type MinMaxInput = z.infer<typeof minMaxSchema>;
