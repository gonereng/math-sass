"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { LetterShell } from "@/components/templates/letter-shell";
import {
  SWITCHABLE_LAYOUT_IDS,
  getLayout,
  isSwitchableLayoutId,
} from "@/components/templates/layouts";
import { MinMaxDialog } from "@/components/templates/min-max-dialog";
import { ProblemPalette } from "@/components/templates/problem-palette";
import { TemplateCanvas } from "@/components/templates/template-canvas";
import { problemTypes } from "@/components/problems/registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addTemplateItem,
  createTemplate,
  deleteTemplate,
  reorderTemplateItems,
  removeTemplateItem,
  updateTemplateLayout,
  updateTemplateName,
  type TemplateWithItems,
} from "@/lib/actions/templates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PendingDrop = {
  boxId: string;
  problemTypeId: string;
};

export function TemplatesEditor({
  initialTemplates,
}: {
  initialTemplates: TemplateWithItems[];
}) {
  const [templates, setTemplates] =
    useState<TemplateWithItems[]>(initialTemplates);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTemplates[0]?.id ?? null,
  );
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pageOverflowing, setPageOverflowing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const canvasScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setPageOverflowing(false);
    setEditingTitle(false);
  }, [selectedId]);

  useEffect(() => {
    setTemplates(initialTemplates);
    setSelectedId((current) => {
      if (current && initialTemplates.some((t) => t.id === current)) {
        return current;
      }
      return initialTemplates[0]?.id ?? null;
    });
  }, [initialTemplates]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (selected && !editingTitle) {
      setTitleDraft(selected.name);
    }
  }, [selected, editingTitle]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const pendingTypeName = problemTypes.find(
    (p) => p.id === pendingDrop?.problemTypeId,
  )?.name;

  async function handleNewTemplate() {
    setBusy(true);
    try {
      const result = await createTemplate();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTemplates((prev) => [...prev, result.template]);
      setSelectedId(result.template.id);
    } finally {
      setBusy(false);
    }
  }

  async function commitTitle() {
    if (!selected) {
      setEditingTitle(false);
      return;
    }
    const next = titleDraft.trim();
    setEditingTitle(false);
    if (!next) {
      setTitleDraft(selected.name);
      toast.error("Name is required");
      return;
    }
    if (next === selected.name) {
      setTitleDraft(selected.name);
      return;
    }
    setBusy(true);
    try {
      const result = await updateTemplateName({
        templateId: selected.id,
        name: next,
      });
      if (!result.ok) {
        setTitleDraft(selected.name);
        toast.error(result.error);
        return;
      }
      setTemplates((prev) =>
        prev.map((t) => (t.id === selected.id ? result.template : t)),
      );
      setTitleDraft(result.template.name);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTemplate() {
    if (!selected) return;
    const deletedId = selected.id;
    setBusy(true);
    try {
      const result = await deleteTemplate({ templateId: deletedId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const nextTemplates = templates.filter((t) => t.id !== deletedId);
      setTemplates(nextTemplates);
      setSelectedId(nextTemplates[0]?.id ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveItem(id: string) {
    if (!selected) return;
    const scroller = canvasScrollRef.current;
    const scrollTop = scroller?.scrollTop ?? 0;
    const previous = templates;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? { ...t, items: t.items.filter((item) => item.id !== id) }
          : t,
      ),
    );
    const result = await removeTemplateItem({ id });
    if (!result.ok) {
      setTemplates(previous);
      toast.error(result.error);
    }
    requestAnimationFrame(() => {
      if (scroller) scroller.scrollTop = scrollTop;
    });
  }

  async function handleConfirmMinMax({
    min,
    max,
  }: {
    min: number;
    max: number;
  }): Promise<boolean> {
    if (!selected || !pendingDrop) return false;
    setBusy(true);
    try {
      const result = await addTemplateItem({
        templateId: selected.id,
        boxId: pendingDrop.boxId,
        problemTypeId: pendingDrop.problemTypeId,
        min,
        max,
      });
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? { ...t, items: [...t.items, result.item] }
            : t,
        ),
      );
      setPendingDrop(null);
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function handleLayoutChange(layoutId: string) {
    if (!selected || !isSwitchableLayoutId(layoutId)) return;
    if (selected.layoutId === layoutId) return;

    setBusy(true);
    try {
      const result = await updateTemplateLayout({
        templateId: selected.id,
        layoutId,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTemplates((prev) =>
        prev.map((t) => (t.id === selected.id ? result.template : t)),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !selected) return;

    const fromPalette = active.data.current?.from === "palette";
    const overBoxId = over.data.current?.boxId as string | undefined;

    if (fromPalette) {
      if (!overBoxId) return;
      const problemTypeId = active.data.current?.problemTypeId as
        | string
        | undefined;
      if (!problemTypeId) return;
      setPendingDrop({ boxId: overBoxId, problemTypeId });
      setDialogOpen(true);
      return;
    }

    const activeBoxId = active.data.current?.boxId as string | undefined;
    if (!activeBoxId || !overBoxId || activeBoxId !== overBoxId) return;
    if (active.id === over.id) return;

    const boxItems = selected.items
      .filter((item) => item.boxId === activeBoxId)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const oldIndex = boxItems.findIndex((item) => item.id === active.id);
    if (oldIndex === -1) return;

    let newIndex = boxItems.findIndex((item) => item.id === over.id);
    if (newIndex === -1) {
      // Dropped on the box itself — move to end
      newIndex = boxItems.length - 1;
    }
    if (oldIndex === newIndex) return;

    const orderedIds = arrayMove(
      boxItems.map((item) => item.id),
      oldIndex,
      newIndex,
    );

    const previous = templates;
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== selected.id) return t;
        const otherItems = t.items.filter((item) => item.boxId !== activeBoxId);
        const reordered = orderedIds.map((id, sortOrder) => {
          const item = boxItems.find((i) => i.id === id)!;
          return { ...item, sortOrder };
        });
        return { ...t, items: [...otherItems, ...reordered] };
      }),
    );

    const result = await reorderTemplateItems({
      templateId: selected.id,
      boxId: activeBoxId,
      orderedIds,
    });
    if (!result.ok) {
      setTemplates(previous);
      toast.error(result.error);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-[calc(100vh-4rem)] gap-4">
        <aside className="flex w-56 shrink-0 flex-col gap-3 border-r border-border pr-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Templates
            </h1>
            <p className="mt-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
              Page recipes
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={handleNewTemplate}
          >
            New template
          </Button>
          <ul className="flex flex-col gap-0.5">
            {templates.map((template) => {
              const active = template.id === selectedId;
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(template.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "border border-border bg-card font-medium text-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
                        : "border border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    {template.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section
          ref={canvasScrollRef}
          className="min-w-0 flex-1 overflow-auto px-2"
        >
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
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
                          setTitleDraft(selected.name);
                          setEditingTitle(false);
                        }
                      }}
                      className="h-auto max-w-xl rounded-lg border-border px-2 py-1 text-base font-semibold tracking-tight"
                      aria-label="Template name"
                    />
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setTitleDraft(selected.name);
                        setEditingTitle(true);
                      }}
                      className="min-w-0 truncate rounded-lg px-2 py-1 text-left text-base font-semibold tracking-tight text-foreground hover:bg-muted/60"
                    >
                      {selected.name}
                    </button>
                  )}
                  <p className="px-2 text-xs text-muted-foreground">
                    Layout for this page
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="inline-flex rounded-md border bg-background p-0.5"
                    role="group"
                    aria-label="Page layout"
                  >
                    {SWITCHABLE_LAYOUT_IDS.map((layoutId) => {
                      const layout = getLayout(layoutId);
                      const active = selected.layoutId === layoutId;
                      return (
                        <button
                          key={layoutId}
                          type="button"
                          disabled={busy}
                          aria-pressed={active}
                          onClick={() => handleLayoutChange(layoutId)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                            active
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {layout.name}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={handleDeleteTemplate}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="min-h-[2.75rem]">
                {pageOverflowing ? (
                  <div
                    role="status"
                    className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
                  >
                    Content exceeds one page
                  </div>
                ) : null}
              </div>
              <LetterShell onOverflowChange={setPageOverflowing}>
                <TemplateCanvas
                  template={selected}
                  onRemoveItem={handleRemoveItem}
                />
              </LetterShell>
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
              No templates yet
            </div>
          )}
        </section>

        <aside className="w-56 shrink-0 border-l pl-4">
          <ProblemPalette />
        </aside>
      </div>

      <MinMaxDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setPendingDrop(null);
        }}
        onConfirm={handleConfirmMinMax}
        problemTypeName={pendingTypeName}
      />
    </DndContext>
  );
}
