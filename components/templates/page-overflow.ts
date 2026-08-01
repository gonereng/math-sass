/** Slack for float vs integer height comparisons (getBoundingClientRect vs scrollHeight). */
export const PAGE_OVERFLOW_EPSILON = 1;

/** True when measured content exceeds the letter page box. */
export function isPageOverflowing(
  contentHeight: number,
  pageHeight: number,
): boolean {
  if (pageHeight <= 0) return false;
  return contentHeight > pageHeight + PAGE_OVERFLOW_EPSILON;
}
