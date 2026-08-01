export function canExportPdf(input: {
  pageCount: number;
  fingerprint: string;
  lastGeneratedFingerprint: string | null;
}): { ok: true } | { ok: false; reason: string } {
  if (input.pageCount <= 0 || input.lastGeneratedFingerprint == null) {
    return { ok: false, reason: "Generate first" };
  }
  if (input.lastGeneratedFingerprint !== input.fingerprint) {
    return { ok: false, reason: "Generate again — preview is stale" };
  }
  return { ok: true };
}
