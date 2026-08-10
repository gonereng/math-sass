"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
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
import {
  DEFAULT_CONTENT_INSET_IN,
  DEFAULT_SHEET_BACKGROUND_ID,
  clampContentInsetIn,
  getSheetBackground,
  type SheetBackgroundId,
} from "@/lib/sheet-backgrounds";

/**
 * Editor letter page: fixed 8.5×11in sheet, uniformly scaled to fit the column.
 * Fonts/padding scale with the page. Print uses real inches via print.css (no screen scale).
 * Content is clipped to the inset box so overflow does not paint over the frame.
 */
export function LetterShellView({
  children,
  className,
  overflowing = false,
  pageHeight: _pageHeight = 0,
  scale = 1,
  stageHeight = 0,
  headerLocale = DEFAULT_SHEET_HEADER_LOCALE,
  backgroundId = DEFAULT_SHEET_BACKGROUND_ID,
  contentInsetIn = DEFAULT_CONTENT_INSET_IN,
  contentRef,
  pageRef,
  shellRef,
  viewportRef,
}: {
  children: ReactNode;
  className?: string;
  overflowing?: boolean;
  /** Unscaled silhouette height in px (kept for callers / overflow measurement). */
  pageHeight?: number;
  /** Uniform fit scale applied to the fixed letter sheet. */
  scale?: number;
  /** Unscaled stage height (fixed to one letter page). */
  stageHeight?: number;
  headerLocale?: SheetHeaderLocaleId;
  backgroundId?: SheetBackgroundId | string;
  /** Content padding in inches (clamped by caller or clampContentInsetIn). */
  contentInsetIn?: number;
  contentRef?: Ref<HTMLDivElement>;
  pageRef?: Ref<HTMLDivElement>;
  shellRef?: Ref<HTMLDivElement>;
  viewportRef?: Ref<HTMLDivElement>;
}) {
  void _pageHeight;
  const scaledHeight =
    stageHeight > 0 ? stageHeight * scale : undefined;
  const labels = getSheetHeaderLabels(headerLocale);
  const bg = getSheetBackground(backgroundId);
  const inset = `${clampContentInsetIn(contentInsetIn)}in`;

  return (
    <div
      ref={viewportRef}
      className={cn("letter-shell-viewport w-full overflow-hidden", className)}
      style={scaledHeight != null ? { height: scaledHeight } : undefined}
    >
      <div
        ref={shellRef}
        className="letter-shell relative origin-top-left overflow-hidden bg-white text-black shadow-sm"
        style={{
          width: `${LETTER_WIDTH_IN}in`,
          height: `${LETTER_HEIGHT_IN}in`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div
          ref={pageRef}
          aria-hidden
          data-sheet-background={bg.id}
          className={cn(
            "letter-shell__silhouette pointer-events-none absolute top-0 left-0 z-0",
            !bg.src && "bg-white",
            bg.showPageBorder && "border-2 border-black",
          )}
          style={{
            width: `${LETTER_WIDTH_IN}in`,
            height: `${LETTER_HEIGHT_IN}in`,
            ...(bg.src
              ? {
                  backgroundImage: `url(${bg.src})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }
              : {}),
          }}
        />

        {/*
          Inset via absolute edges (not padding) so overflow:hidden clips at the
          white content box — padding would still allow paint over the frame.
        */}
        <div
          ref={contentRef}
          className="letter-shell__content absolute z-10 overflow-hidden text-black"
          style={
            {
              top: inset,
              right: inset,
              bottom: inset,
              left: inset,
              "--content-inset": inset,
            } as CSSProperties
          }
        >
          <header className="mb-6 flex w-full flex-wrap items-baseline justify-between gap-y-3 text-sm">
            <ShellBlank label={labels.name} widthClass="min-w-[10rem]" />
            <ShellBlank label={labels.classLabel} widthClass="min-w-[6rem]" />
            <ShellBlank label={labels.date} widthClass="min-w-[6rem]" />
          </header>
          <div>{children}</div>
        </div>

        {overflowing ? (
          <div
            data-overflow-wash="true"
            aria-hidden
            className="pointer-events-none absolute z-20 h-10 bg-gradient-to-t from-red-500/35 to-transparent"
            style={{ left: inset, right: inset, bottom: inset }}
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
  backgroundId = DEFAULT_SHEET_BACKGROUND_ID,
  contentInsetIn = DEFAULT_CONTENT_INSET_IN,
}: {
  children: ReactNode;
  className?: string;
  onOverflowChange?: (overflowing: boolean) => void;
  headerLocale?: SheetHeaderLocaleId;
  backgroundId?: SheetBackgroundId | string;
  contentInsetIn?: number;
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
      backgroundId={backgroundId}
      contentInsetIn={contentInsetIn}
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
