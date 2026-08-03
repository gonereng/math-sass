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
        "min-h-24 border border-dashed border-black/40 p-2",
        isOver && "border-solid bg-black/5",
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
        "flex items-start gap-1 rounded border border-black/20 bg-white p-2",
        isDragging && "opacity-60",
      )}
    >
      <button
        type="button"
        className="mt-0.5 cursor-grab text-black/50 active:cursor-grabbing"
        aria-label="Reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        {Component ? (
          <Component {...(item.props as object)} />
        ) : (
          <span className="text-sm text-black/60">
            Unknown problem: {item.problemTypeId}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-black/60 hover:text-black"
        aria-label="Remove item"
        // Avoid focus-loss scroll jump when this control unmounts on delete
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRemove}
      >
        <X />
      </Button>
    </li>
  );
}
