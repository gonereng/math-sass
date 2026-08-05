import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  LETTER_HEIGHT_IN,
  LETTER_WIDTH_IN,
} from "@/components/templates/letter-fit-scale";

/** Printable content height inside 0.5in padding on letter. */
const LETTER_CONTENT_PX = LETTER_HEIGHT_IN * 96 - 2 * 0.5 * 96;

function applyFitScale(shell: HTMLElement): () => void {
  const content = shell.querySelector<HTMLElement>(".letter-shell__content");
  if (!content) return () => {};
  const contentHeight = content.scrollHeight;
  const scale =
    contentHeight > LETTER_CONTENT_PX
      ? Math.min(1, (LETTER_CONTENT_PX * 0.98) / contentHeight)
      : 1;
  content.style.setProperty("--print-scale", String(scale));
  content.style.transformOrigin = "top left";
  content.style.transform = `scale(${scale})`;
  return () => {
    content.style.removeProperty("--print-scale");
    content.style.removeProperty("transform");
    content.style.removeProperty("transform-origin");
  };
}

function prepareShellForCapture(shell: HTMLElement): () => void {
  const prev = {
    transform: shell.style.transform,
    width: shell.style.width,
    height: shell.style.height,
    minHeight: shell.style.minHeight,
  };
  shell.style.transform = "none";
  shell.style.width = `${LETTER_WIDTH_IN}in`;
  shell.style.height = `${LETTER_HEIGHT_IN}in`;
  shell.style.minHeight = `${LETTER_HEIGHT_IN}in`;

  const wash = shell.querySelector<HTMLElement>("[data-overflow-wash]");
  const washDisplay = wash?.style.display;
  if (wash) wash.style.display = "none";

  const clearFit = applyFitScale(shell);

  return () => {
    shell.style.transform = prev.transform;
    shell.style.width = prev.width;
    shell.style.height = prev.height;
    shell.style.minHeight = prev.minHeight;
    if (wash) wash.style.display = washDisplay ?? "";
    clearFit();
  };
}

/**
 * Renders each `.print-page .letter-shell` in `root` into a US Letter PDF
 * (8.5in × 11in) and triggers browser downloads for the PDF plus a PNG of
 * the first page (cover).
 */
export async function exportLetterPagesToPdf(input: {
  root: HTMLElement;
  fileName: string;
}): Promise<void> {
  const shells = [
    ...input.root.querySelectorAll<HTMLElement>(".print-page .letter-shell"),
  ];
  if (shells.length === 0) {
    throw new Error("No pages to export");
  }

  const baseName = input.fileName.replace(/\.pdf$/i, "").trim() || "worksheet";
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: [LETTER_WIDTH_IN, LETTER_HEIGHT_IN],
    compress: true,
  });

  let coverPngDataUrl: string | null = null;

  for (let i = 0; i < shells.length; i++) {
    const shell = shells[i]!;
    const restore = prepareShellForCapture(shell);
    try {
      // Let layout settle after unscaling
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));

      const dataUrl = await toPng(shell, {
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

      if (i === 0) {
        coverPngDataUrl = dataUrl;
      }

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
    } finally {
      restore();
    }
  }

  pdf.save(`${baseName}.pdf`);

  if (coverPngDataUrl) {
    // Brief gap so the browser accepts a second automatic download.
    await new Promise((r) => setTimeout(r, 150));
    downloadDataUrl(coverPngDataUrl, `${baseName}-cover.png`);
  }
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
