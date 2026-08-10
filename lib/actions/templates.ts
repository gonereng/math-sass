"use server";

import { redirect } from "next/navigation";
import {
  DEFAULT_LAYOUT_ID,
  getLayout,
} from "@/components/templates/layouts";
import { problemTypes } from "@/components/problems/registry";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propsFromRange } from "@/lib/projects/generate-props";
import {
  createTemplateSchema,
  deleteTemplateSchema,
  minMaxSchema,
  updateLayoutSchema,
  updateTemplateBackgroundSchema,
  updateTemplateContentInsetSchema,
  updateTemplateNameSchema,
} from "@/lib/validations/template";
import { getSheetBackground } from "@/lib/sheet-backgrounds";

export type TemplateWithItems = {
  id: string;
  name: string;
  layoutId: string;
  backgroundId: string;
  contentInsetIn: number;
  items: {
    id: string;
    boxId: string;
    problemTypeId: string;
    props: unknown;
    sortOrder: number;
    rangeMin: number | null;
    rangeMax: number | null;
  }[];
};

type ActionError = { ok: false; error: string };

const UNEXPECTED = "Something went wrong";

function mapTemplate(template: {
  id: string;
  name: string;
  layoutId: string;
  backgroundId: string;
  contentInsetIn: number;
  items: {
    id: string;
    boxId: string;
    problemTypeId: string;
    props: unknown;
    sortOrder: number;
    rangeMin: number | null;
    rangeMax: number | null;
  }[];
}): TemplateWithItems {
  return {
    id: template.id,
    name: template.name,
    layoutId: template.layoutId,
    backgroundId: template.backgroundId,
    contentInsetIn: template.contentInsetIn,
    items: template.items.map((item) => ({
      id: item.id,
      boxId: item.boxId,
      problemTypeId: item.problemTypeId,
      props: item.props,
      sortOrder: item.sortOrder,
      rangeMin: item.rangeMin,
      rangeMax: item.rangeMax,
    })),
  };
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function listTemplatesForUser(
  userId: string,
): Promise<TemplateWithItems[]> {
  const templates = await prisma.template.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  return templates.map(mapTemplate);
}

export async function ensureSampleTemplate(): Promise<TemplateWithItems[]> {
  const userId = await requireUserId();
  if (!userId) {
    redirect("/login");
  }

  const existing = await prisma.template.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (existing.length > 0) {
    return existing.map(mapTemplate);
  }

  await prisma.template.create({
    data: {
      name: "Addition practice",
      layoutId: DEFAULT_LAYOUT_ID,
      userId,
    },
  });

  return listTemplatesForUser(userId);
}

export async function createTemplate(
  input?: { name?: string; layoutId?: string },
): Promise<
  | { ok: true; template: TemplateWithItems }
  | ActionError
> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: UNEXPECTED };
  }

  const parsed = createTemplateSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { ok: false, error: UNEXPECTED };
  }

  const name = parsed.data.name ?? "Untitled template";
  const layoutId = parsed.data.layoutId ?? DEFAULT_LAYOUT_ID;
  const layout = getLayout(layoutId);
  if (layout.id !== layoutId) {
    return { ok: false, error: UNEXPECTED };
  }

  try {
    const template = await prisma.template.create({
      data: {
        name,
        layoutId,
        userId,
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
    return { ok: true, template: mapTemplate(template) };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function updateTemplateName(input: {
  templateId: string;
  name: string;
}): Promise<{ ok: true; template: TemplateWithItems } | ActionError> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: UNEXPECTED };
  }

  const parsed = updateTemplateNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Name is required" };
  }

  try {
    const result = await prisma.template.updateMany({
      where: { id: parsed.data.templateId, userId },
      data: { name: parsed.data.name },
    });
    if (result.count === 0) {
      return { ok: false, error: UNEXPECTED };
    }
    const template = await prisma.template.findFirst({
      where: { id: parsed.data.templateId, userId },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!template) {
      return { ok: false, error: UNEXPECTED };
    }
    return { ok: true, template: mapTemplate(template) };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function deleteTemplate(input: {
  templateId: string;
}): Promise<{ ok: true } | ActionError> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: UNEXPECTED };
  }

  const parsed = deleteTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: UNEXPECTED };
  }

  try {
    const result = await prisma.template.deleteMany({
      where: { id: parsed.data.templateId, userId },
    });
    if (result.count === 0) {
      return { ok: false, error: UNEXPECTED };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function addTemplateItem(input: {
  templateId: string;
  boxId: string;
  problemTypeId: string;
  min: number;
  max: number;
  count: number;
}): Promise<
  | {
      ok: true;
      items: {
        id: string;
        boxId: string;
        problemTypeId: string;
        props: unknown;
        sortOrder: number;
        rangeMin: number | null;
        rangeMax: number | null;
      }[];
    }
  | ActionError
> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: UNEXPECTED };
  }

  const parsed = minMaxSchema.safeParse({
    min: input.min,
    max: input.max,
    count: input.count,
  });
  if (!parsed.success) {
    return { ok: false, error: UNEXPECTED };
  }

  const problemType = problemTypes.find((p) => p.id === input.problemTypeId);
  if (!problemType) {
    return { ok: false, error: UNEXPECTED };
  }

  try {
    const template = await prisma.template.findFirst({
      where: { id: input.templateId, userId },
    });
    if (!template) {
      return { ok: false, error: UNEXPECTED };
    }

    const layout = getLayout(template.layoutId);
    if (!layout.boxes.some((b) => b.id === input.boxId)) {
      return { ok: false, error: UNEXPECTED };
    }

    const { min, max, count } = parsed.data;

    const maxExisting = await prisma.templateItem.findFirst({
      where: { templateId: input.templateId, boxId: input.boxId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const baseOrder = (maxExisting?.sortOrder ?? -1) + 1;

    const created = await prisma.$transaction(
      Array.from({ length: count }, (_, i) => {
        const props = propsFromRange(
          input.problemTypeId,
          min,
          max,
        ) as Prisma.InputJsonValue;
        return prisma.templateItem.create({
          data: {
            templateId: input.templateId,
            boxId: input.boxId,
            problemTypeId: input.problemTypeId,
            props,
            sortOrder: baseOrder + i,
            rangeMin: min,
            rangeMax: max,
          },
        });
      }),
    );

    return {
      ok: true,
      items: created.map((item) => ({
        id: item.id,
        boxId: item.boxId,
        problemTypeId: item.problemTypeId,
        props: item.props,
        sortOrder: item.sortOrder,
        rangeMin: item.rangeMin,
        rangeMax: item.rangeMax,
      })),
    };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function reorderTemplateItems(input: {
  templateId: string;
  boxId: string;
  orderedIds: string[];
}): Promise<{ ok: true } | ActionError> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: UNEXPECTED };
  }

  try {
    const template = await prisma.template.findFirst({
      where: { id: input.templateId, userId },
      include: {
        items: {
          where: { boxId: input.boxId },
          select: { id: true },
        },
      },
    });
    if (!template) {
      return { ok: false, error: UNEXPECTED };
    }

    const ownedIds = new Set(template.items.map((i) => i.id));
    if (
      input.orderedIds.length !== ownedIds.size ||
      !input.orderedIds.every((id) => ownedIds.has(id))
    ) {
      return { ok: false, error: UNEXPECTED };
    }

    await prisma.$transaction(
      input.orderedIds.map((id, index) =>
        prisma.templateItem.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return { ok: true };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function removeTemplateItem(input: {
  id: string;
}): Promise<{ ok: true } | ActionError> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: UNEXPECTED };
  }

  try {
    const item = await prisma.templateItem.findFirst({
      where: {
        id: input.id,
        template: { userId },
      },
      select: { id: true },
    });
    if (!item) {
      return { ok: false, error: UNEXPECTED };
    }

    await prisma.templateItem.delete({ where: { id: item.id } });
    return { ok: true };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function updateTemplateLayout(input: {
  templateId: string;
  layoutId: string;
}): Promise<
  | { ok: true; template: TemplateWithItems }
  | ActionError
> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: UNEXPECTED };
  }

  const parsed = updateLayoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: UNEXPECTED };
  }

  const newLayout = getLayout(parsed.data.layoutId);
  if (newLayout.id !== parsed.data.layoutId) {
    return { ok: false, error: UNEXPECTED };
  }

  const validBoxIds = new Set(newLayout.boxes.map((b) => b.id));
  const fallbackBoxId = newLayout.boxes[0]?.id;
  if (!fallbackBoxId) {
    return { ok: false, error: UNEXPECTED };
  }

  try {
    const template = await prisma.template.findFirst({
      where: { id: parsed.data.templateId, userId },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!template) {
      return { ok: false, error: UNEXPECTED };
    }

    if (template.layoutId === parsed.data.layoutId) {
      return { ok: true, template: mapTemplate(template) };
    }

    const keptInFallback = template.items.filter(
      (item) => item.boxId === fallbackBoxId,
    );
    const orphaned = template.items.filter(
      (item) => !validBoxIds.has(item.boxId),
    );

    await prisma.$transaction(async (tx) => {
      await tx.template.update({
        where: { id: template.id },
        data: { layoutId: parsed.data.layoutId },
      });

      let nextOrder = keptInFallback.length;
      for (const item of orphaned) {
        await tx.templateItem.update({
          where: { id: item.id },
          data: { boxId: fallbackBoxId, sortOrder: nextOrder },
        });
        nextOrder += 1;
      }
    });

    const updated = await prisma.template.findFirst({
      where: { id: template.id, userId },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!updated) {
      return { ok: false, error: UNEXPECTED };
    }

    return { ok: true, template: mapTemplate(updated) };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function updateTemplateBackground(input: {
  templateId: string;
  backgroundId: string;
}): Promise<{ ok: true; template: TemplateWithItems } | ActionError> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: UNEXPECTED };
  }

  const parsed = updateTemplateBackgroundSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid background" };
  }

  try {
    const background = getSheetBackground(parsed.data.backgroundId);
    const result = await prisma.template.updateMany({
      where: { id: parsed.data.templateId, userId },
      data: {
        backgroundId: parsed.data.backgroundId,
        contentInsetIn: background.defaultContentInsetIn,
      },
    });
    if (result.count === 0) {
      return { ok: false, error: UNEXPECTED };
    }

    const template = await prisma.template.findFirst({
      where: { id: parsed.data.templateId, userId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!template) {
      return { ok: false, error: UNEXPECTED };
    }

    return { ok: true, template: mapTemplate(template) };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function updateTemplateContentInset(input: {
  templateId: string;
  contentInsetIn: number;
}): Promise<{ ok: true; template: TemplateWithItems } | ActionError> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: UNEXPECTED };
  }

  const parsed = updateTemplateContentInsetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid inset" };
  }

  try {
    const result = await prisma.template.updateMany({
      where: { id: parsed.data.templateId, userId },
      data: { contentInsetIn: parsed.data.contentInsetIn },
    });
    if (result.count === 0) {
      return { ok: false, error: UNEXPECTED };
    }

    const template = await prisma.template.findFirst({
      where: { id: parsed.data.templateId, userId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!template) {
      return { ok: false, error: UNEXPECTED };
    }

    return { ok: true, template: mapTemplate(template) };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}
