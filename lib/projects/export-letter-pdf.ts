import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  LETTER_HEIGHT_IN,
  LETTER_WIDTH_IN,
} from "@/components/templates/letter-fit-scale";

function prepareShellForCapture(shell: HTMLElement): () => void {
  const prev = {
    transform: shell.style.transform,
    width: shell.style.width,
    height: shell.style.height,
    minHeight: shell.style.minHeight,
    overflow: shell.style.overflow,
  };
  shell.style.transform = "none";
  shell.style.width = `${LETTER_WIDTH_IN}in`;
  shell.style.height = `${LETTER_HEIGHT_IN}in`;
  shell.style.minHeight = `${LETTER_HEIGHT_IN}in`;
  shell.style.overflow = "hidden";

  const wash = shell.querySelector<HTMLElement>("[data-overflow-wash]");
  const washDisplay = wash?.style.display;
  if (wash) wash.style.display = "none";

  const content = shell.querySelector<HTMLElement>(".letter-shell__content");
  const contentPrev = content
    ? {
        overflow: content.style.overflow,
        transform: content.style.transform,
      }
    : null;
  if (content) {
    content.style.overflow = "hidden";
    content.style.transform = "none";
  }

  return () => {
    shell.style.transform = prev.transform;
    shell.style.width = prev.width;
    shell.style.height = prev.height;
    shell.style.minHeight = prev.minHeight;
    shell.style.overflow = prev.overflow;
    if (wash) wash.style.display = washDisplay ?? "";
    if (content && contentPrev) {
      content.style.overflow = contentPrev.overflow;
      content.style.transform = contentPrev.transform;
    }
  };
}

async function captureShellPng(shell: HTMLElement): Promise<string> {
  const restore = prepareShellForCapture(shell);
  try {
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    return await toPng(shell, {
      cacheBust: true,
      pixelRatio: 2,
      width: Math.round(LETTER_WIDTH_IN * 96),
      height: Math.round(LETTER_HEIGHT_IN * 96),
      style: {
        transform: "none",
        width: `${LETTER_WIDTH_IN}in`,
        height: `${LETTER_HEIGHT_IN}in`,
      },
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        return !node.hasAttribute("data-overflow-wash");
      },
    });
  } finally {
    restore();
  }
}

async function buildPdfFromShells(shells: HTMLElement[]): Promise<jsPDF> {
  if (shells.length === 0) {
    throw new Error("No pages to export");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: [LETTER_WIDTH_IN, LETTER_HEIGHT_IN],
    compress: true,
  });

  for (let i = 0; i < shells.length; i++) {
    const dataUrl = await captureShellPng(shells[i]!);
    if (i > 0) {
      pdf.addPage([LETTER_WIDTH_IN, LETTER_HEIGHT_IN], "portrait");
    }
    pdf.addImage(
      dataUrl,
      "PNG",
      0,
      0,
      LETTER_WIDTH_IN,
      LETTER_HEIGHT_IN,
      undefined,
      "FAST",
    );
  }

  return pdf;
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function baseFileName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, "").trim() || "worksheet";
}

/** Worksheet shells in DOM order (excludes answer-key pages). */
export function getWorksheetShells(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      '.print-page[data-print-kind="worksheet"] .letter-shell',
    ),
  ];
}

/**
 * First worksheet page of each section, in section order.
 * Falls back to all worksheets if section markers are missing.
 */
export function getFirstPagePerSectionShells(root: HTMLElement): HTMLElement[] {
  const pages = [
    ...root.querySelectorAll<HTMLElement>(
      '.print-page[data-print-kind="worksheet"]',
    ),
  ];
  const firstPages = pickFirstElementPerSection(pages);
  const shells = firstPages
    .map((page) => page.querySelector<HTMLElement>(".letter-shell"))
    .filter((shell): shell is HTMLElement => shell != null);

  if (shells.length > 0) return shells;
  return getWorksheetShells(root);
}

/** Keeps the first element for each `data-section-id`, in encounter order. */
export function pickFirstElementPerSection(
  pages: HTMLElement[],
): HTMLElement[] {
  const seen = new Set<string>();
  const out: HTMLElement[] = [];
  for (const page of pages) {
    const sectionId = page.dataset.sectionId;
    if (!sectionId || seen.has(sectionId)) continue;
    seen.add(sectionId);
    out.push(page);
  }
  return out;
}

/** Same selection rule for plain page records (tests / non-DOM callers). */
export function pickFirstPagePerSection<T extends { sectionId: string }>(
  pages: T[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const page of pages) {
    if (seen.has(page.sectionId)) continue;
    seen.add(page.sectionId);
    out.push(page);
  }
  return out;
}

/**
 * Downloads:
 * 1. Full PDF (all worksheet pages + answer keys)
 * 2. Cover PNG of the first worksheet page
 */
export async function exportLetterPagesToPdf(input: {
  root: HTMLElement;
  fileName: string;
}): Promise<void> {
  const allShells = [
    ...input.root.querySelectorAll<HTMLElement>(".print-page .letter-shell"),
  ];
  if (allShells.length === 0) {
    throw new Error("No pages to export");
  }

  const name = baseFileName(input.fileName);
  const worksheetShells = getWorksheetShells(input.root);
  const coverShell = worksheetShells[0] ?? allShells[0]!;

  const fullPdf = await buildPdfFromShells(allShells);
  fullPdf.save(`${name}.pdf`);

  await delay(150);
  const coverPngDataUrl = await captureShellPng(coverShell);
  downloadDataUrl(coverPngDataUrl, `${name}-cover.png`);
}

/**
 * PDF with only the first page of each section (no answer key).
 */
export async function exportSectionFirstPagesToPdf(input: {
  root: HTMLElement;
  fileName: string;
}): Promise<void> {
  const shells = getFirstPagePerSectionShells(input.root);
  if (shells.length === 0) {
    throw new Error("No pages to export");
  }
  const name = baseFileName(input.fileName);
  const pdf = await buildPdfFromShells(shells);
  pdf.save(`${name}-sections.pdf`);
}
