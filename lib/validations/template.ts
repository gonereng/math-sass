import { z } from "zod";

export const minMaxSchema = z
  .object({
    min: z.coerce.number().int(),
    max: z.coerce.number().int(),
    count: z.coerce.number().int().min(1).max(50),
  })
  .refine((d) => d.min <= d.max, {
    message: "Min must be less than or equal to max",
    path: ["max"],
  });

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  layoutId: z.string().optional(),
});

export const updateLayoutSchema = z.object({
  templateId: z.string().min(1),
  layoutId: z.enum(["two-columns", "grid-2x2"]),
});

export const updateTemplateNameSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
});

export const deleteTemplateSchema = z.object({
  templateId: z.string().min(1),
});

export type MinMaxInput = z.infer<typeof minMaxSchema>;
