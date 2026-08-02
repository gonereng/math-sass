/** Short date for projects table (e.g. "Aug 2, 2026"). */
export function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
