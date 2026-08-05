"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import {
  LETTER_HEIGHT_IN,
  LETTER_WIDTH_IN,
  fitLetterScale,
} from "@/components/templates/letter-fit-scale";
import { usePageOverflow } from "@/components/templates/use-page-overflow";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SHEET_HEADER_LOCALE,
  getSheetHeaderLabels,
  type SheetHeaderLocaleId,
} from "@/lib/i18n/sheet-header-locales";

/**
 * Editor letter page: fixed 8.5×11in sheet, uniformly scaled to fit the column.
 * Fonts/padding scale with the page. Print uses real inches via print.css (no screen scale).
 */
export function LetterShellView({
  children,
  className,
  overflowing = false,
  pageHeight = 0,
  scale = 1,
  stageHeight = 0,
  headerLocale = DEFAULT_SHEET_HEADER_LOCALE,
  contentRef,
  pageRef,
  shellRef,
  viewportRef,
}: {
  children: ReactNode;
  className?: string;
  overflowing?: boolean;
  /** Unscaled silhouette height in px; wash top + overflow math. */
  pageHeight?: number;
  /** Uniform fit scale applied to the fixed letter sheet. */
  scale?: number;
  /** Unscaled stage height (at least one letter page; grows with spill). */
  stageHeight?: number;
  headerLocale?: SheetHeaderLocaleId;
  contentRef?: Ref<HTMLDivElement>;
  pageRef?: Ref<HTMLDivElement>;
  shellRef?: Ref<HTMLDivElement>;
  viewportRef?: Ref<HTMLDivElement>;
}) {
  const scaledHeight =
    stageHeight > 0 ? stageHeight * scale : undefined;
  const labels = getSheetHeaderLabels(headerLocale);

  return (
    <div
      ref={viewportRef}
      className={cn("letter-shell-viewport w-full overflow-hidden", className)}
      style={scaledHeight != null ? { height: scaledHeight } : undefined}
    >
      <div
        ref={shellRef}
        className="letter-shell relative origin-top-left bg-white text-black shadow-sm"
        style={{
          width: `${LETTER_WIDTH_IN}in`,
          minHeight: `${LETTER_HEIGHT_IN}in`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div
          ref={pageRef}
          aria-hidden
          className="letter-shell__silhouette pointer-events-none absolute top-0 left-0 z-0 border-2 border-black bg-white"
          style={{
            width: `${LETTER_WIDTH_IN}in`,
            height: `${LETTER_HEIGHT_IN}in`,
          }}
        />

        <div
          className="relative z-10"
          style={
            pageHeight > 0
              ? { minHeight: pageHeight }
              : { minHeight: `${LETTER_HEIGHT_IN}in` }
          }
        >
          <div
            ref={contentRef}
            className="letter-shell__content text-black"
            style={{ padding: "0.5in" }}
          >
            <header className="mb-6 flex w-full flex-wrap items-baseline justify-between gap-y-3 text-sm">
              <ShellBlank label={labels.name} widthClass="min-w-[10rem]" />
              <ShellBlank label={labels.classLabel} widthClass="min-w-[6rem]" />
              <ShellBlank label={labels.date} widthClass="min-w-[6rem]" />
            </header>
            <div>{children}</div>
          </div>
        </div>

        {overflowing && pageHeight > 0 ? (
          <div
            data-overflow-wash="true"
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-red-500/25"
            style={{ top: pageHeight }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function LetterShell({
  children,
  className,
  onOverflowChange,
  headerLocale = DEFAULT_SHEET_HEADER_LOCALE,
}: {
  children: ReactNode;
  className?: string;
  onOverflowChange?: (overflowing: boolean) => void;
  headerLocale?: SheetHeaderLocaleId;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [stageHeight, setStageHeight] = useState(0);

  const { overflowing, pageHeight } = usePageOverflow(pageRef, contentRef);

  useLayoutEffect(() => {
    onOverflowChange?.(overflowing);
  }, [overflowing, onOverflowChange]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const shell = shellRef.current;
    if (!viewport || !shell) return;

    const measure = () => {
      const letterWidthPx = shell.offsetWidth;
      const nextScale = fitLetterScale(viewport.clientWidth, letterWidthPx);
      setScale(nextScale);
      setStageHeight(shell.offsetHeight);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(shell);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <LetterShellView
      className={className}
      overflowing={overflowing}
      pageHeight={pageHeight}
      scale={scale}
      stageHeight={stageHeight}
      headerLocale={headerLocale}
      pageRef={pageRef}
      contentRef={contentRef}
      shellRef={shellRef}
      viewportRef={viewportRef}
    >
      {children}
    </LetterShellView>
  );
}

function ShellBlank({
  label,
  widthClass,
}: {
  label: string;
  widthClass: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span>{label}:</span>
      <span
        aria-hidden="true"
        className={cn("inline-block border-b border-black", widthClass)}
      >
        &nbsp;
      </span>
    </div>
  );
}
