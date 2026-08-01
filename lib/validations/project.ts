import { z } from "zod";

export const pageCountSchema = z.coerce.number().int().min(1).max(50);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const addSectionSchema = z.object({
  projectId: z.string().min(1),
  templateId: z.string().min(1),
  pageCount: pageCountSchema.default(1),
});

export const updateSectionPageCountSchema = z.object({
  sectionId: z.string().min(1),
  pageCount: pageCountSchema,
});

export const reorderSectionsSchema = z.object({
  projectId: z.string().min(1),
  sectionIds: z.array(z.string().min(1)).min(1),
});

export const removeSectionSchema = z.object({
  sectionId: z.string().min(1),
});

export const generateProjectSchema = z.object({
  projectId: z.string().min(1),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().min(1),
});
