export function compositionFingerprint(
  sections: { id: string; pageCount: number; sortOrder: number }[],
): string {
  const normalized = sections
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => `${s.id}:${s.pageCount}`)
    .join("|");
  return normalized;
}
