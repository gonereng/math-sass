"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { problemTypes } from "@/components/problems/registry";
import { cn } from "@/lib/utils";

export function ProblemPalette() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Problems</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Drag a type onto a drop box
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {problemTypes.map((type) => (
          <li key={type.id}>
            <PaletteItem
              problemTypeId={type.id}
              name={type.name}
              description={type.description}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaletteItem({
  problemTypeId,
  name,
  description,
}: {
  problemTypeId: string;
  name: string;
  description: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${problemTypeId}`,
      data: { from: "palette", problemTypeId },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full cursor-grab rounded-md border bg-background px-3 py-2 text-left shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
      {...listeners}
      {...attributes}
    >
      <span className="block text-sm font-medium">{name}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        {description}
      </span>
    </button>
  );
}
