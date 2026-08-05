/**
 * Letter-page header blanks (Name / Class / Date).
 * Add a new entry here to support another language in the project editor.
 */
export const SHEET_HEADER_LOCALES = {
  en: {
    id: "en",
    label: "English",
    name: "Name",
    classLabel: "Class",
    date: "Date",
  },
  fr: {
    id: "fr",
    label: "Français",
    name: "Nom",
    classLabel: "Classe",
    date: "Date",
  },
  de: {
    id: "de",
    label: "Deutsch",
    name: "Name",
    classLabel: "Klasse",
    date: "Datum",
  },
} as const;

export type SheetHeaderLocaleId = keyof typeof SHEET_HEADER_LOCALES;

export type SheetHeaderLabels =
  (typeof SHEET_HEADER_LOCALES)[SheetHeaderLocaleId];

export const DEFAULT_SHEET_HEADER_LOCALE: SheetHeaderLocaleId = "en";

export const SHEET_HEADER_LOCALE_OPTIONS = Object.values(
  SHEET_HEADER_LOCALES,
) as SheetHeaderLabels[];

export function isSheetHeaderLocaleId(
  value: string,
): value is SheetHeaderLocaleId {
  return value in SHEET_HEADER_LOCALES;
}

export function getSheetHeaderLabels(
  localeId: SheetHeaderLocaleId = DEFAULT_SHEET_HEADER_LOCALE,
): SheetHeaderLabels {
  return SHEET_HEADER_LOCALES[localeId] ?? SHEET_HEADER_LOCALES.en;
}
