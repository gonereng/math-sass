"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compositionFingerprint } from "@/lib/projects/fingerprint";
import {
  isSupportedProblemType,
  propsFromRange,
} from "@/lib/projects/generate-props";
import {
  assertSnapshotRanges,
  buildTemplateSnapshot,
  normalizeTemplateSnapshot,
  templateItemsHaveRanges,
  type TemplateSnapshot,
} from "@/lib/projects/snapshot";
import {
  addSectionSchema,
  createProjectSchema,
  deleteProjectSchema,
  generateProjectSchema,
  removeSectionSchema,
  pageCountSchema,
  reorderSectionsSchema,
  updateProjectNameSchema,
  updateSectionPageCountSchema,
} from "@/lib/validations/project";

export type GeneratedPageItem = {
  boxId: string;
  problemTypeId: string;
  sortOrder: number;
  props: Record<string, number>;
};

export type ProjectWithDetails = {
  id: string;
  name: string;
  updatedAt: string;
  lastGeneratedFingerprint: string | null;
  sections: {
    id: string;
    sortOrder: number;
    pageCount: number;
    templateSnapshot: TemplateSnapshot;
    sourceTemplateId: string | null;
  }[];
  pages: {
    id: string;
    sectionId: string;
    pageIndex: number;
    layoutId: string;
    items: GeneratedPageItem[];
  }[];
};

const UNEXPECTED = "Something went wrong";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function parseSnapshot(raw: unknown): TemplateSnapshot {
  return normalizeTemplateSnapshot(raw);
}

function mapProject(project: {
  id: string;
  name: string;
  updatedAt: Date;
  lastGeneratedFingerprint: string | null;
  sections: {
    id: string;
    sortOrder: number;
    pageCount: number;
    templateSnapshot: unknown;
    sourceTemplateId: string | null;
  }[];
  pages: {
    id: string;
    sectionId: string;
    pageIndex: number;
    layoutId: string;
    items: unknown;
  }[];
}): ProjectWithDetails {
  return {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt.toISOString(),
    lastGeneratedFingerprint: project.lastGeneratedFingerprint,
    sections: project.sections
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        id: s.id,
        sortOrder: s.sortOrder,
        pageCount: s.pageCount,
        templateSnapshot: parseSnapshot(s.templateSnapshot),
        sourceTemplateId: s.sourceTemplateId,
      })),
    pages: project.pages
      .slice()
      .sort((a, b) => a.pageIndex - b.pageIndex)
      .map((p) => ({
        id: p.id,
        sectionId: p.sectionId,
        pageIndex: p.pageIndex,
        layoutId: p.layoutId,
        items: p.items as GeneratedPageItem[],
      })),
  };
}

async function loadProjectForUser(
  projectId: string,
  userId: string,
): Promise<ProjectWithDetails | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: { sections: true, pages: true },
  });
  return project ? mapProject(project) : null;
}

export async function listProjects(): Promise<ProjectWithDetails[]> {
  const userId = await requireUserId();
  if (!userId) return [];
  const projects = await prisma.project.findMany({
    where: { userId },
    include: { sections: true, pages: true },
    orderBy: { updatedAt: "desc" },
  });
  return projects.map(mapProject);
}

export async function getProject(
  projectId: string,
): Promise<ProjectWithDetails | null> {
  const userId = await requireUserId();
  if (!userId) return null;
  return loadProjectForUser(projectId, userId);
}

export async function createProject(
  input?: { name?: string },
): Promise<{ ok: true; project: ProjectWithDetails } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = createProjectSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  try {
    const project = await prisma.project.create({
      data: {
        userId,
        name: parsed.data.name ?? "Untitled project",
      },
      include: { sections: true, pages: true },
    });
    revalidatePath("/projects");
    return { ok: true, project: mapProject(project) };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function deleteProject(
  input: { projectId: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = deleteProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  try {
    const result = await prisma.project.deleteMany({
      where: { id: parsed.data.projectId, userId },
    });
    if (result.count === 0) return { ok: false, error: UNEXPECTED };
    revalidatePath("/projects");
    return { ok: true };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function updateProjectName(
  input: { projectId: string; name: string },
): Promise<{ ok: true; project: ProjectWithDetails } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = updateProjectNameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Name is required" };
  try {
    const result = await prisma.project.updateMany({
      where: { id: parsed.data.projectId, userId },
      data: { name: parsed.data.name },
    });
    if (result.count === 0) return { ok: false, error: UNEXPECTED };
    const project = await loadProjectForUser(parsed.data.projectId, userId);
    if (!project) return { ok: false, error: UNEXPECTED };
    revalidatePath("/projects");
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, project };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function addProjectSection(
  input: { projectId: string; templateId: string; pageCount?: number },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = addSectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  try {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId },
      include: { sections: true },
    });
    if (!project) return { ok: false, error: UNEXPECTED };

    const template = await prisma.template.findFirst({
      where: { id: parsed.data.templateId, userId },
      include: { items: true },
    });
    if (!template) return { ok: false, error: "Template not found" };

    if (!templateItemsHaveRanges(template.items)) {
      return {
        ok: false,
        error:
          "This template has problems without min/max ranges. Re-add those problems on the Templates page.",
      };
    }

    const snapshot = buildTemplateSnapshot(template);
    const ranges = assertSnapshotRanges(snapshot);
    if (!ranges.ok) return { ok: false, error: ranges.error };

    const maxOrder = project.sections.reduce(
      (m, s) => Math.max(m, s.sortOrder),
      -1,
    );

    await prisma.projectSection.create({
      data: {
        projectId: project.id,
        sortOrder: maxOrder + 1,
        pageCount: parsed.data.pageCount,
        templateSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        sourceTemplateId: template.id,
      },
    });

    const updated = await loadProjectForUser(project.id, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function updateSectionPageCount(
  input: { sectionId: string; pageCount: number },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = updateSectionPageCountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid page count" };

  try {
    const section = await prisma.projectSection.findFirst({
      where: { id: parsed.data.sectionId, project: { userId } },
    });
    if (!section) return { ok: false, error: UNEXPECTED };

    await prisma.projectSection.update({
      where: { id: section.id },
      data: { pageCount: parsed.data.pageCount },
    });

    const updated = await loadProjectForUser(section.projectId, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function reorderProjectSections(
  input: { projectId: string; sectionIds: string[] },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = reorderSectionsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  try {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId },
      include: { sections: true },
    });
    if (!project) return { ok: false, error: UNEXPECTED };

    const { sectionIds } = parsed.data;
    if (new Set(sectionIds).size !== sectionIds.length) {
      return { ok: false, error: "Invalid input" };
    }

    const ids = new Set(project.sections.map((s) => s.id));
    if (
      sectionIds.length !== ids.size ||
      !sectionIds.every((id) => ids.has(id))
    ) {
      return { ok: false, error: UNEXPECTED };
    }

    await prisma.$transaction(
      parsed.data.sectionIds.map((id, sortOrder) =>
        prisma.projectSection.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );

    const updated = await loadProjectForUser(project.id, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function removeProjectSection(
  input: { sectionId: string },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = removeSectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: UNEXPECTED };

  try {
    const section = await prisma.projectSection.findFirst({
      where: { id: parsed.data.sectionId, project: { userId } },
    });
    if (!section) return { ok: false, error: UNEXPECTED };

    await prisma.projectSection.delete({ where: { id: section.id } });

    const updated = await loadProjectForUser(section.projectId, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function generateProject(
  input: { projectId: string },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = generateProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: UNEXPECTED };

  try {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId },
      include: { sections: true },
    });
    if (!project) return { ok: false, error: UNEXPECTED };
    if (project.sections.length === 0) {
      return { ok: false, error: "Add at least one section before generating" };
    }

    const sections = project.sections
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);

    for (const section of sections) {
      const pageCount = pageCountSchema.safeParse(section.pageCount);
      if (!pageCount.success) {
        return { ok: false, error: "Invalid page count" };
      }

      const snapshot = parseSnapshot(section.templateSnapshot);
      const check = assertSnapshotRanges(snapshot);
      if (!check.ok) return { ok: false, error: check.error };

      for (const item of snapshot.items) {
        if (!isSupportedProblemType(item.problemTypeId)) {
          return {
            ok: false,
            error: `Unsupported problem type: ${item.problemTypeId}`,
          };
        }
      }
    }

    const pagesData: {
      projectId: string;
      sectionId: string;
      pageIndex: number;
      layoutId: string;
      items: Prisma.InputJsonValue;
    }[] = [];

    let pageIndex = 0;
    for (const section of sections) {
      let snapshot = parseSnapshot(section.templateSnapshot);

      if (section.sourceTemplateId) {
        const live = await prisma.template.findFirst({
          where: { id: section.sourceTemplateId, userId },
          include: { items: true },
        });
        if (live) {
          snapshot = {
            ...snapshot,
            backgroundId: live.backgroundId,
            contentInsetIn: live.contentInsetIn,
          };
          await prisma.projectSection.update({
            where: { id: section.id },
            data: {
              templateSnapshot: snapshot as unknown as Prisma.InputJsonValue,
            },
          });
        }
      }

      for (let n = 0; n < section.pageCount; n++) {
        const items = snapshot.items.map((item) => ({
          boxId: item.boxId,
          problemTypeId: item.problemTypeId,
          sortOrder: item.sortOrder,
          props: propsFromRange(
            item.problemTypeId,
            item.rangeMin,
            item.rangeMax,
          ),
        }));
        pagesData.push({
          projectId: project.id,
          sectionId: section.id,
          pageIndex,
          layoutId: snapshot.layoutId,
          items: items as unknown as Prisma.InputJsonValue,
        });
        pageIndex += 1;
      }
    }

    const fingerprint = compositionFingerprint(
      sections.map((s) => ({
        id: s.id,
        pageCount: s.pageCount,
        sortOrder: s.sortOrder,
      })),
    );

    await prisma.$transaction([
      prisma.generatedPage.deleteMany({ where: { projectId: project.id } }),
      prisma.generatedPage.createMany({ data: pagesData }),
      prisma.project.update({
        where: { id: project.id },
        data: { lastGeneratedFingerprint: fingerprint },
      }),
    ]);

    const updated = await loadProjectForUser(project.id, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}
