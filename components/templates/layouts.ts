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

/** Layouts exposed in the Templates editor switcher. */
export const SWITCHABLE_LAYOUT_IDS = ["two-columns", "grid-2x2"] as const;

export type SwitchableLayoutId = (typeof SWITCHABLE_LAYOUT_IDS)[number];

export function isSwitchableLayoutId(id: string): id is SwitchableLayoutId {
  return (SWITCHABLE_LAYOUT_IDS as readonly string[]).includes(id);
}

export function getLayoutClassName(layoutId: string): string {
  switch (getLayout(layoutId).id) {
    case "two-columns":
      // items-start: column height follows content (no stretch-to-match sibling)
      return "grid grid-cols-2 items-start gap-4";
    case "grid-2x2":
      // Auto rows (not 1fr 1fr): each row sizes to its own content so an empty
      // bottom row does not inherit the top row's height and false-trip overflow.
      return "grid grid-cols-2 items-start gap-4";
    case "single-column":
    default:
      return "flex flex-col gap-4";
  }
}
