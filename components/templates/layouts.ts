export const DEFAULT_LAYOUT_ID = "two-columns" as const;

export type LayoutBox = { id: string };
export type LayoutPreset = {
  id: string;
  name: string;
  boxes: LayoutBox[];
};

export const layoutPresets: LayoutPreset[] = [
  {
    id: "single-column",
    name: "Single column",
    boxes: [{ id: "main" }],
  },
  {
    id: "two-columns",
    name: "Two columns",
    boxes: [{ id: "col-left" }, { id: "col-right" }],
  },
  {
    id: "grid-2x2",
    name: "2×2 grid",
    boxes: [
      { id: "cell-0" },
      { id: "cell-1" },
      { id: "cell-2" },
      { id: "cell-3" },
    ],
  },
];

export function getLayout(layoutId: string): LayoutPreset {
  const found = layoutPresets.find((l) => l.id === layoutId);
  if (!found) {
    return layoutPresets.find((l) => l.id === DEFAULT_LAYOUT_ID)!;
  }
  return found;
}
