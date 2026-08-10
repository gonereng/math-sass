export const SHEET_BACKGROUNDS = {
  blank: {
    id: "blank",
    label: "Blank",
    src: null as string | null,
    showPageBorder: true,
  },
  "kids-frame": {
    id: "kids-frame",
    label: "Kids frame",
    src: "/backgrounds/kids-frame.jpg",
    showPageBorder: false,
  },
} as const;

export type SheetBackgroundId = keyof typeof SHEET_BACKGROUNDS;
export type SheetBackground = (typeof SHEET_BACKGROUNDS)[SheetBackgroundId];

export const DEFAULT_SHEET_BACKGROUND_ID: SheetBackgroundId = "blank";

export const SHEET_BACKGROUND_OPTIONS = Object.values(
  SHEET_BACKGROUNDS,
) as SheetBackground[];

export function isSheetBackgroundId(value: string): value is SheetBackgroundId {
  return value in SHEET_BACKGROUNDS;
}

export function getSheetBackground(
  id: SheetBackgroundId | string = DEFAULT_SHEET_BACKGROUND_ID,
): SheetBackground {
  if (isSheetBackgroundId(id)) return SHEET_BACKGROUNDS[id];
  return SHEET_BACKGROUNDS.blank;
}
