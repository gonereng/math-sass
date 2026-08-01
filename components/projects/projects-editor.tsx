"use client";

import { useEffect, useState } from "react";
import { LetterShell } from "@/components/templates/letter-shell";
import { WorksheetPageView } from "@/components/worksheets/worksheet-page-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addProjectSection,
  createProject,
  deleteProject,
  generateProject,
  removeProjectSection,
  reorderProjectSections,
  updateSectionPageCount,
  type ProjectWithDetails,
} from "@/lib/actions/projects";
import { compositionFingerprint } from "@/lib/projects/fingerprint";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TemplateOption = { id: string; name: string };

function replaceProject(
  projects: ProjectWithDetails[],
  updated: ProjectWithDetails,
): ProjectWithDetails[] {
  return projects.map((p) => (p.id === updated.id ? updated : p));
}

export function ProjectsEditor({
  initialProjects,
  templates,
}: {
  initialProjects: ProjectWithDetails[];
  templates: TemplateOption[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialProjects[0]?.id ?? null,
  );
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    null,
  );
  const [addTemplateId, setAddTemplateId] = useState(
    templates[0]?.id ?? "",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProjects(initialProjects);
    setSelectedId((current) => {
      if (current && initialProjects.some((p) => p.id === current)) {
        return current;
      }
      return initialProjects[0]?.id ?? null;
    });
  }, [initialProjects]);

  useEffect(() => {
    setExpandedSectionId(null);
  }, [selectedId]);

  useEffect(() => {
    if (!addTemplateId && templates[0]) {
      setAddTemplateId(templates[0].id);
    }
  }, [templates, addTemplateId]);

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  const currentFingerprint = selected
    ? compositionFingerprint(selected.sections)
    : "";
  const stale =
    !!selected &&
    selected.pages.length > 0 &&
    selected.lastGeneratedFingerprint !== null &&
    selected.lastGeneratedFingerprint !== currentFingerprint;

  async function handleNewProject() {
    setBusy(true);
    try {
      const result = await createProject();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProjects((prev) => [result.project, ...prev]);
      setSelectedId(result.project.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProject() {
    if (!selected) return;
    const deletedId = selected.id;
    setBusy(true);
    try {
      const result = await deleteProject({ projectId: deletedId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProjects((prev) => {
        const next = prev.filter((p) => p.id !== deletedId);
        setSelectedId((current) => {
          if (current !== deletedId) return current;
          return next[0]?.id ?? null;
        });
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleAddSection() {
    if (!selected || !addTemplateId) return;
    setBusy(true);
    try {
      const result = await addProjectSection({
        projectId: selected.id,
        templateId: addTemplateId,
        pageCount: 1,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProjects((prev) => replaceProject(prev, result.project));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveSection(sectionId: string) {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await removeProjectSection({ sectionId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProjects((prev) => replaceProject(prev, result.project));
      setExpandedSectionId((current) =>
        current === sectionId ? null : current,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePageCountChange(
    sectionId: string,
    pageCount: number,
  ) {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await updateSectionPageCount({ sectionId, pageCount });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProjects((prev) => replaceProject(prev, result.project));
    } finally {
      setBusy(false);
    }
  }

  async function handleMoveSection(sectionId: string, direction: "up" | "down") {
    if (!selected) return;
    const sections = selected.sections;
    const index = sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sections.length) return;

    const sectionIds = sections.map((s) => s.id);
    [sectionIds[index], sectionIds[swapIndex]] = [
      sectionIds[swapIndex],
      sectionIds[index],
    ];

    setBusy(true);
    try {
      const result = await reorderProjectSections({
        projectId: selected.id,
        sectionIds,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProjects((prev) => replaceProject(prev, result.project));
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await generateProject({ projectId: selected.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProjects((prev) => replaceProject(prev, result.project));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-4">
      <aside className="flex w-56 shrink-0 flex-col gap-3 border-r pr-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Compose workbook pages
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={handleNewProject}
        >
          New project
        </Button>
        {selected ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={handleDeleteProject}
          >
            Delete project
          </Button>
        ) : null}
        <ul className="flex flex-col gap-1">
          {projects.map((project) => {
            const active = project.id === selectedId;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {project.name}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <aside className="flex w-64 shrink-0 flex-col gap-3 border-r pr-4">
        {selected ? (
          <>
            <h2 className="text-sm font-medium">Sections</h2>
            <ul className="flex flex-col gap-2">
              {selected.sections.map((section, index) => {
                const expanded = expandedSectionId === section.id;
                const name = section.templateSnapshot.templateName;
                return (
                  <li
                    key={section.id}
                    className="rounded-md border border-border"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSectionId(expanded ? null : section.id)
                      }
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                    >
                      <span className="truncate font-medium">{name}</span>
                      <span className="ml-2 shrink-0 text-muted-foreground">
                        ×{section.pageCount}
                      </span>
                    </button>
                    {expanded ? (
                      <div className="flex flex-col gap-2 border-t px-3 py-2">
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="text-muted-foreground">
                            Page count
                          </span>
                          <SectionPageCountInput
                            key={section.id}
                            value={section.pageCount}
                            disabled={busy}
                            onCommit={(pageCount) =>
                              handlePageCountChange(section.id, pageCount)
                            }
                          />
                        </label>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy || index === 0}
                            onClick={() =>
                              handleMoveSection(section.id, "up")
                            }
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={
                              busy || index === selected.sections.length - 1
                            }
                            onClick={() =>
                              handleMoveSection(section.id, "down")
                            }
                          >
                            Down
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => handleRemoveSection(section.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-2">
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                value={addTemplateId}
                disabled={busy || templates.length === 0}
                onChange={(e) => setAddTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                disabled={busy || !addTemplateId}
                onClick={handleAddSection}
              >
                Add section
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select or create a project
          </p>
        )}
      </aside>

      <section className="min-w-0 flex-1 overflow-auto px-2">
        {selected ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={busy || selected.sections.length === 0}
                onClick={handleGenerate}
              >
                Generate
              </Button>
              {stale ? (
                <p
                  role="status"
                  className="text-sm font-medium text-amber-700"
                >
                  Preview may be stale — generate again
                </p>
              ) : null}
            </div>
            {selected.pages.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
                Generate to preview pages
              </div>
            ) : (
              <div className="flex flex-col gap-8 pb-8">
                {selected.pages.map((page) => (
                  <LetterShell key={page.id}>
                    <WorksheetPageView
                      layoutId={page.layoutId}
                      items={page.items}
                    />
                  </LetterShell>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
            No projects yet
          </div>
        )}
      </section>
    </div>
  );
}

function SectionPageCountInput({
  value,
  disabled,
  onCommit,
}: {
  value: number;
  disabled: boolean;
  onCommit: (pageCount: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 50) {
      setDraft(String(value));
      toast.error("Page count must be between 1 and 50");
      return;
    }
    if (parsed !== value) {
      onCommit(parsed);
    }
  }

  return (
    <Input
      type="number"
      min={1}
      max={50}
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
    />
  );
}
