/** US Letter width/height in CSS inches for editor preview. */
export const LETTER_WIDTH_IN = 8.5;
export const LETTER_HEIGHT_IN = 11;

/** Scale factor so an 8.5in-wide page fits in the viewport (never upscale). */
export function fitLetterScale(
  viewportWidthPx: number,
  letterWidthPx: number,
): number {
  if (viewportWidthPx <= 0 || letterWidthPx <= 0) return 1;
  return Math.min(1, viewportWidthPx / letterWidthPx);
}
