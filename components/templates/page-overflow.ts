/** True when measured content exceeds the letter page box. */
export function isPageOverflowing(
  contentHeight: number,
  pageHeight: number,
): boolean {
  if (pageHeight <= 0) return false;
  return contentHeight > pageHeight;
}
