import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHEET_HEADER_LOCALE,
  SHEET_HEADER_LOCALES,
  getSheetHeaderLabels,
  isSheetHeaderLocaleId,
} from "./sheet-header-locales";

describe("sheet header locales", () => {
  it("defaults to English", () => {
    expect(DEFAULT_SHEET_HEADER_LOCALE).toBe("en");
    expect(getSheetHeaderLabels().name).toBe("Name");
    expect(getSheetHeaderLabels().classLabel).toBe("Class");
    expect(getSheetHeaderLabels().date).toBe("Date");
  });

  it("includes French and German translations", () => {
    expect(SHEET_HEADER_LOCALES.fr).toMatchObject({
      name: "Nom",
      classLabel: "Classe",
      date: "Date",
    });
    expect(SHEET_HEADER_LOCALES.de).toMatchObject({
      name: "Name",
      classLabel: "Klasse",
      date: "Datum",
    });
  });

  it("validates locale ids", () => {
    expect(isSheetHeaderLocaleId("en")).toBe(true);
    expect(isSheetHeaderLocaleId("fr")).toBe(true);
    expect(isSheetHeaderLocaleId("de")).toBe(true);
    expect(isSheetHeaderLocaleId("es")).toBe(false);
  });
});
