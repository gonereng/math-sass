"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AnswerKeyPage } from "@/components/projects/answer-key-page";
import { LetterShell } from "@/components/templates/letter-shell";
import { WorksheetPageView } from "@/components/worksheets/worksheet-page-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addProjectSection,
  deleteProject,
  generateProject,
  removeProjectSection,
  reorderProjectSections,
  updateProjectBackground,
  updateProjectName,
  updateSectionPageCount,
  type ProjectWithDetails,
} from "@/lib/actions/projects";
import { canExportPdf } from "@/lib/projects/can-export-pdf";
import { chunkPages } from "@/lib/projects/chunk-pages";
import { exportLetterPagesToPdf, exportSectionFirstPagesToPdf } from "@/lib/projects/export-letter-pdf";
import { compositionFingerprint } from "@/lib/projects/fingerprint";
import {
  DEFAULT_SHEET_HEADER_LOCALE,
  SHEET_HEADER_LOCALE_OPTIONS,
  isSheetHeaderLocaleId,
  type SheetHeaderLocaleId,
} from "@/lib/i18n/sheet-header-locales";
import {
  SHEET_BACKGROUND_OPTIONS,
  isSheetBackgroundId,
} from "@/lib/sheet-backgrounds";
import { toast } from "sonner";

type TemplateOption = { id: string; name: string };

export function ProjectsEditor({
  initialProject,
  templates = [],
}: {
  initialProject: ProjectWithDetails;
  templates?: TemplateOption[];
}) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    null,
  );
  const [addTemplateId, setAddTemplateId] = useState(
    () => templates?.[0]?.id ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialProject.name);
  const [headerLocale, setHeaderLocale] = useState<SheetHeaderLocaleId>(
    DEFAULT_SHEET_HEADER_LOCALE,
  );
  const [pendingSectionsPdf, setPendingSectionsPdf] = useState(false);

  useEffect(() => {
    setProject(initialProject);
    setTitleDraft(initialProject.name);
  }, [initialProject]);

  useEffect(() => {
    setExpandedSectionId(null);
  }, [project.id]);

  useEffect(() => {
    const firstId = templates?.[0]?.id;
    if (!addTemplateId && firstId) {
      setAddTemplateId(firstId);
    }
  }, [templates, addTemplateId]);

  const sections = project.sections ?? [];
  const pages = project.pages ?? [];

  const currentFingerprint = compositionFingerprint(sections);
  const stale =
    pages.length > 0 &&
    project.lastGeneratedFingerprint !== null &&
    project.lastGeneratedFingerprint !== currentFingerprint;
  const exportGate = canExportPdf({
    pageCount: pages.length,
    fingerprint: currentFingerprint,
    lastGeneratedFingerprint: project.lastGeneratedFingerprint,
  });

  useEffect(() => {
    const LETTER_CONTENT_PX = 11 * 96 - 2 * 0.5 * 96;

    function applyPrintScale() {
      const root = document.querySelector("[data-print-root]");
      if (!root) return;
      const pages = root.querySelectorAll<HTMLElement>(".print-page");
      pages.forEach((page) => {
        const content = page.querySelector<HTMLElement>(
          ".letter-shell__content",
        );
        if (!content) return;
        const contentHeight = content.scrollHeight;
        const scale =
          contentHeight > LETTER_CONTENT_PX
            ? Math.min(1, (LETTER_CONTENT_PX * 0.98) / contentHeight)
            : 1;
        content.style.setProperty("--print-scale", String(scale));
      });
    }

    function clearPrintScale() {
      document
        .querySelectorAll<HTMLElement>(".letter-shell__content")
        .forEach((el) => el.style.removeProperty("--print-scale"));
    }

    window.addEventListener("beforeprint", applyPrintScale);
    window.addEventListener("afterprint", clearPrintScale);
    return () => {
      window.removeEventListener("beforeprint", applyPrintScale);
      window.removeEventListener("afterprint", clearPrintScale);
    };
  }, [project.id, pages.length, project.lastGeneratedFingerprint]);

  async function handleDeleteProject() {
    setBusy(true);
    try {
      const result = await deleteProject({ projectId: project.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // replace only — push+refresh remounts the shell and loops /api/auth/session
      router.replace("/projects");
    } finally {
      setBusy(false);
    }
  }

  async function commitTitle() {
    const next = titleDraft.trim();
    setEditingTitle(false);
    if (!next) {
      setTitleDraft(project.name);
      toast.error("Name is required");
      return;
    }
    if (next === project.name) {
      setTitleDraft(project.name);
      return;
    }
    setBusy(true);
    try {
      const result = await updateProjectName({
        projectId: project.id,
        name: next,
      });
      if (!result.ok) {
        setTitleDraft(project.name);
        toast.error(result.error);
        return;
      }
      setProject(result.project);
      setTitleDraft(result.project.name);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddSection() {
    if (!addTemplateId) return;
    setBusy(true);
    try {
      const result = await addProjectSection({
        projectId: project.id,
        templateId: addTemplateId,
        pageCount: 1,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProject(result.project);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveSection(sectionId: string) {
    setBusy(true);
    try {
      const result = await removeProjectSection({ sectionId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProject(result.project);
      setExpandedSectionId((current) =>
        current === sectionId ? null : current,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePageCountChange(sectionId: string, pageCount: number) {
    setBusy(true);
    try {
      const result = await updateSectionPageCount({ sectionId, pageCount });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProject(result.project);
    } finally {
      setBusy(false);
    }
  }

  async function handleBackgroundChange(next: string) {
    if (!isSheetBackgroundId(next)) return;
    setBusy(true);
    try {
      const result = await updateProjectBackground({
        projectId: project.id,
        backgroundId: next,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProject(result.project);
    } finally {
      setBusy(false);
    }
  }

  async function handleMoveSection(
    sectionId: string,
    direction: "up" | "down",
  ) {
    const sections = project.sections;
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
        projectId: project.id,
        sectionIds,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProject(result.project);
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    setBusy(true);
    try {
      const result = await generateProject({ projectId: project.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProject(result.project);
      setPendingSectionsPdf(true);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!pendingSectionsPdf) return;
    if (pages.length === 0) {
      setPendingSectionsPdf(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      // Wait for LetterShell to mount and finish first layout pass.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;

      const root = document.querySelector<HTMLElement>("[data-print-root]");
      if (!root) {
        setPendingSectionsPdf(false);
        return;
      }

      try {
        await exportSectionFirstPagesToPdf({
          root,
          fileName: project.name.trim() || "worksheet",
        });
      } catch (err) {
        console.error(err);
        toast.error("Could not create sections PDF");
      } finally {
        if (!cancelled) setPendingSectionsPdf(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingSectionsPdf, pages, project.name]);

  async function handleExportPdf() {
    const root = document.querySelector<HTMLElement>("[data-print-root]");
    if (!root) {
      toast.error("Nothing to export");
      return;
    }
    setBusy(true);
    setExportingPdf(true);
    try {
      await exportLetterPagesToPdf({
        root,
        fileName: project.name.trim() || "worksheet",
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not create PDF");
    } finally {
      setExportingPdf(false);
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-2rem)] flex-col gap-4 overflow-hidden">
      <div
        data-print-hide
        className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href="/projects"
            aria-label="Back to projects"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          {editingTitle ? (
            <Input
              autoFocus
              value={titleDraft}
              disabled={busy}
              onChange={(e) => setTitleDraft(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={() => {
                void commitTitle();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
                if (e.key === "Escape") {
                  setTitleDraft(project.name);
                  setEditingTitle(false);
                }
              }}
              className="h-auto max-w-xl flex-1 rounded-lg border-border px-2 py-1 text-2xl font-semibold tracking-tight"
              aria-label="Project name"
            />
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setTitleDraft(project.name);
                setEditingTitle(true);
              }}
              className="min-w-0 truncate rounded-lg px-2 py-1 text-left text-2xl font-semibold tracking-tight text-foreground hover:bg-muted/60"
            >
              {project.name}
            </button>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={handleDeleteProject}
        >
          Delete project
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <aside
          data-print-hide
          className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border pr-4"
        >
          <h2 className="text-sm font-medium">Sections</h2>
          <ul className="flex flex-col gap-2">
            {sections.map((section, index) => {
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
                        <span className="text-muted-foreground">Page count</span>
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
                          onClick={() => handleMoveSection(section.id, "up")}
                        >
                          Up
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            busy || index === sections.length - 1
                          }
                          onClick={() => handleMoveSection(section.id, "down")}
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
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            data-print-hide
            className="flex shrink-0 flex-wrap items-center gap-3 pb-4"
          >
            <Button
              type="button"
              disabled={busy || sections.length === 0}
              onClick={handleGenerate}
            >
              Generate
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !exportGate.ok}
              aria-busy={exportingPdf}
              onClick={() => {
                void handleExportPdf();
              }}
            >
              {exportingPdf ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Generating
                </>
              ) : (
                "Export PDF"
              )}
            </Button>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="shrink-0">Header</span>
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
                value={headerLocale}
                aria-label="Sheet header language"
                onChange={(e) => {
                  if (isSheetHeaderLocaleId(e.target.value)) {
                    setHeaderLocale(e.target.value);
                  }
                }}
              >
                {SHEET_HEADER_LOCALE_OPTIONS.map((locale) => (
                  <option key={locale.id} value={locale.id}>
                    {locale.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="shrink-0">Background</span>
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
                value={project.backgroundId}
                disabled={busy}
                onChange={(e) => {
                  void handleBackgroundChange(e.target.value);
                }}
              >
                {SHEET_BACKGROUND_OPTIONS.map((background) => (
                  <option key={background.id} value={background.id}>
                    {background.label}
                  </option>
                ))}
              </select>
            </label>
            {stale ? (
              <p
                role="status"
                className="text-sm font-medium text-amber-700"
              >
                Preview may be stale — generate again
              </p>
            ) : null}
            {!exportGate.ok && !stale ? (
              <p className="text-sm text-muted-foreground">
                {exportGate.reason}
              </p>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-2">
            {pages.length === 0 ? (
              <div
                data-print-hide
                className="flex min-h-64 items-center justify-center text-sm text-muted-foreground"
              >
                Generate to preview pages
              </div>
            ) : (
              <div className="flex flex-col gap-8 pb-8" data-print-root>
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="print-page"
                    data-print-kind="worksheet"
                    data-section-id={page.sectionId}
                  >
                    <LetterShell
                      headerLocale={headerLocale}
                      backgroundId={project.backgroundId}
                    >
                      <WorksheetPageView
                        layoutId={page.layoutId}
                        items={page.items}
                      />
                    </LetterShell>
                  </div>
                ))}
                {chunkPages(pages, 2).map((group, groupIndex) => (
                  <div
                    key={`answer-key-${groupIndex}`}
                    className="print-page"
                    data-print-kind="answer-key"
                  >
                    <LetterShell headerLocale={headerLocale}>
                      <AnswerKeyPage
                        cells={group.map((page, i) => ({
                          label: `Page ${groupIndex * 2 + i + 1}`,
                          layoutId: page.layoutId,
                          items: page.items,
                        }))}
                      />
                    </LetterShell>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
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
