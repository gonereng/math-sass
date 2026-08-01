import { describe, expect, it } from "vitest";
import { canExportPdf } from "./can-export-pdf";

describe("canExportPdf", () => {
  it("allows export when pages exist and fingerprint matches", () => {
    expect(
      canExportPdf({
        pageCount: 3,
        fingerprint: "a:1|b:2",
        lastGeneratedFingerprint: "a:1|b:2",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects when there are no pages", () => {
    expect(
      canExportPdf({
        pageCount: 0,
        fingerprint: "a:1",
        lastGeneratedFingerprint: "a:1",
      }),
    ).toEqual({ ok: false, reason: "Generate first" });
  });

  it("rejects when never generated (null fingerprint)", () => {
    expect(
      canExportPdf({
        pageCount: 2,
        fingerprint: "a:1",
        lastGeneratedFingerprint: null,
      }),
    ).toEqual({ ok: false, reason: "Generate first" });
  });

  it("rejects when preview is stale", () => {
    expect(
      canExportPdf({
        pageCount: 2,
        fingerprint: "a:2",
        lastGeneratedFingerprint: "a:1",
      }),
    ).toEqual({
      ok: false,
      reason: "Generate again — preview is stale",
    });
  });
});
