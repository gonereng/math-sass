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
  items: SnapshotItem[];
};

export function buildTemplateSnapshot(template: {
  name: string;
  layoutId: string;
  items: {
    boxId: string;
    problemTypeId: string;
    sortOrder: number;
    rangeMin: number | null;
    rangeMax: number | null;
    props?: unknown;
  }[];
}): TemplateSnapshot {
  return {
    templateName: template.name,
    layoutId: template.layoutId,
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
