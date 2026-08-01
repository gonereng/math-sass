"use client";

import { useEffect, useState } from "react";
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
import { MinMaxDialog } from "@/components/templates/min-max-dialog";
import { ProblemPalette } from "@/components/templates/problem-palette";
import { TemplateCanvas } from "@/components/templates/template-canvas";
import { problemTypes } from "@/components/problems/registry";
import { Button } from "@/components/ui/button";
import {
  addTemplateItem,
  createTemplate,
  reorderTemplateItems,
  removeTemplateItem,
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

  async function handleRemoveItem(id: string) {
    if (!selected) return;
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
        <aside className="flex w-56 shrink-0 flex-col gap-3 border-r pr-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Templates</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Compose worksheet layouts
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
          <ul className="flex flex-col gap-1">
            {templates.map((template) => {
              const active = template.id === selectedId;
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(template.id)}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {template.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="min-w-0 flex-1 overflow-auto px-2">
          {selected ? (
            <LetterShell>
              <TemplateCanvas
                template={selected}
                onRemoveItem={handleRemoveItem}
              />
            </LetterShell>
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
