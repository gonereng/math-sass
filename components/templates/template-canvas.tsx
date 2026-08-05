"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { problemTypes } from "@/components/problems/registry";
import {
  getLayout,
  getLayoutClassName,
} from "@/components/templates/layouts";
import type { TemplateWithItems } from "@/lib/actions/templates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TemplateItem = TemplateWithItems["items"][number];

type TemplateCanvasProps = {
  template: TemplateWithItems;
  onRemoveItem: (id: string) => void;
};

/**
 * Same layout density as WorksheetPageView so template preview matches Generate.
 * Drag/delete controls are hover overlays and do not add vertical chrome.
 */
export function TemplateCanvas({
  template,
  onRemoveItem,
}: TemplateCanvasProps) {
  const layout = getLayout(template.layoutId);

  return (
    <div className={getLayoutClassName(layout.id)}>
      {layout.boxes.map((box) => {
        const items = template.items
          .filter((item) => item.boxId === box.id)
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <DropBox
            key={box.id}
            boxId={box.id}
            items={items}
            onRemoveItem={onRemoveItem}
          />
        );
      })}
    </div>
  );
}

function DropBox({
  boxId,
  items,
  onRemoveItem,
}: {
  boxId: string;
  items: TemplateItem[];
  onRemoveItem: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: boxId,
    data: { boxId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Match WorksheetPageView box sizing; dashed border is editor-only affordance
        "min-h-24 border border-dashed border-black/25 p-2",
        isOver && "border-solid border-black/50 bg-black/5",
      )}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <SortableTemplateItem
              key={item.id}
              item={item}
              onRemove={() => onRemoveItem(item.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
}

function SortableTemplateItem({
  item,
  onRemove,
}: {
  item: TemplateItem;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { boxId: item.boxId, type: "item" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const problemType = problemTypes.find((p) => p.id === item.problemTypeId);
  const Component = problemType?.Component;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative w-full",
        isDragging && "opacity-60",
      )}
    >
      <div className="absolute top-0 right-0 left-0 z-10 flex items-start justify-between opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          className="cursor-grab rounded bg-white/90 p-0.5 text-black/50 shadow-sm active:cursor-grabbing"
          aria-label="Reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="bg-white/90 text-black/60 shadow-sm hover:text-black"
          aria-label="Remove item"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      {Component ? (
        <Component {...(item.props as object)} />
      ) : (
        <span className="text-sm text-black/60">
          Unknown problem: {item.problemTypeId}
        </span>
      )}
    </li>
  );
}
