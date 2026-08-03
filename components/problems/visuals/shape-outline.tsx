import { cn } from "@/lib/utils";

export type ShapeKind = "triangle" | "square" | "pentagon" | "hexagon";

export const SHAPE_SIDES: Record<ShapeKind, number> = {
  triangle: 3,
  square: 4,
  pentagon: 5,
  hexagon: 6,
};

export const SHAPE_KINDS = Object.keys(SHAPE_SIDES) as ShapeKind[];

function polygonPoints(sides: number, cx = 50, cy = 50, r = 38): string {
  return Array.from({ length: sides }, (_, i) => {
    const a = (-Math.PI / 2 + (i * 2 * Math.PI) / sides);
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ");
}

export function ShapeOutline({
  shape,
  className,
}: {
  shape: ShapeKind;
  className?: string;
}) {
  const sides = SHAPE_SIDES[shape];
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-14 text-black", className)}
      aria-hidden="true"
    >
      <polygon
        points={polygonPoints(sides)}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
