import {
  DEFAULT_CONTENT_INSET_IN,
  DEFAULT_SHEET_BACKGROUND_ID,
  clampContentInsetIn,
  getSheetBackground,
  isSheetBackgroundId,
} from "@/lib/sheet-backgrounds";

export type SnapshotItem = {
  boxId: string;
  problemTypeId: string;
  sortOrder: number;
  rangeMin: number;
  rangeMax: number;
};

export type TemplateSnapshot = {
  templateName: string;
  layoutId: string;
  backgroundId: string;
  contentInsetIn: number;
  items: SnapshotItem[];
};

export function buildTemplateSnapshot(template: {
  name: string;
  layoutId: string;
  backgroundId?: string;
  contentInsetIn?: number;
  items: {
    boxId: string;
    problemTypeId: string;
    sortOrder: number;
    rangeMin: number | null;
    rangeMax: number | null;
    props?: unknown;
  }[];
}): TemplateSnapshot {
  const background = getSheetBackground(
    template.backgroundId ?? DEFAULT_SHEET_BACKGROUND_ID,
  );
  return {
    templateName: template.name,
    layoutId: template.layoutId,
    backgroundId: background.id,
    contentInsetIn: clampContentInsetIn(
      template.contentInsetIn ?? background.defaultContentInsetIn,
    ),
    items: template.items
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        if (item.rangeMin == null || item.rangeMax == null) {
          throw new Error("Missing ranges");
        }
        return {
          boxId: item.boxId,
          problemTypeId: item.problemTypeId,
          sortOrder: item.sortOrder,
          rangeMin: item.rangeMin,
          rangeMax: item.rangeMax,
        };
      }),
  };
}

/** Normalize stored JSON (including older snapshots missing appearance fields). */
export function normalizeTemplateSnapshot(raw: unknown): TemplateSnapshot {
  const s = (raw ?? {}) as Partial<TemplateSnapshot> & {
    items?: SnapshotItem[];
  };
  const backgroundId = isSheetBackgroundId(String(s.backgroundId ?? ""))
    ? String(s.backgroundId)
    : DEFAULT_SHEET_BACKGROUND_ID;
  return {
    templateName: typeof s.templateName === "string" ? s.templateName : "",
    layoutId: typeof s.layoutId === "string" ? s.layoutId : "two-columns",
    backgroundId,
    contentInsetIn: clampContentInsetIn(
      typeof s.contentInsetIn === "number"
        ? s.contentInsetIn
        : DEFAULT_CONTENT_INSET_IN,
    ),
    items: Array.isArray(s.items) ? s.items : [],
  };
}

export function assertSnapshotRanges(
  snapshot: TemplateSnapshot,
): { ok: true } | { ok: false; error: string } {
  for (const item of snapshot.items) {
    if (
      typeof item.rangeMin !== "number" ||
      typeof item.rangeMax !== "number" ||
      !Number.isInteger(item.rangeMin) ||
      !Number.isInteger(item.rangeMax) ||
      item.rangeMin > item.rangeMax
    ) {
      return {
        ok: false,
        error:
          "Every problem needs a min/max range. Re-add problems on the template.",
      };
    }
  }
  return { ok: true };
}

/** True when every item has non-null integer ranges with min ≤ max. */
export function templateItemsHaveRanges(
  items: { rangeMin: number | null; rangeMax: number | null }[],
): boolean {
  return items.every(
    (item) =>
      typeof item.rangeMin === "number" &&
      typeof item.rangeMax === "number" &&
      Number.isInteger(item.rangeMin) &&
      Number.isInteger(item.rangeMax) &&
      item.rangeMin <= item.rangeMax,
  );
}
