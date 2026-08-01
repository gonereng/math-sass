import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

/**
 * Editor letter page: fixed 8.5×11 silhouette (scaled to column width).
 * Print/PDF later should use real 8.5in×11in — do not treat this scaled box as print truth.
 */
export function LetterShell({
  children,
  className,
  overflowing = false,
  pageHeight = 0,
  contentRef,
  pageRef,
}: {
  children: ReactNode;
  className?: string;
  overflowing?: boolean;
  /** Measured silhouette height in px; used for content minHeight and wash top. */
  pageHeight?: number;
  contentRef?: Ref<HTMLDivElement>;
  pageRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className={cn("relative mx-auto w-full max-w-[52rem]", className)}
    >
      {/* Visible one-page outline; does not grow with content */}
      <div
        ref={pageRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 aspect-[8.5/11] border-2 border-black bg-white"
      />

      {/* In-flow content; may extend below the silhouette */}
      <div
        ref={contentRef}
        className="relative z-10 p-8 text-black"
        style={pageHeight > 0 ? { minHeight: pageHeight } : undefined}
      >
        <header className="mb-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <ShellBlank label="Name" widthClass="min-w-[10rem]" />
          <ShellBlank label="Class" widthClass="min-w-[6rem]" />
          <ShellBlank label="Date" widthClass="min-w-[6rem]" />
        </header>
        <div>{children}</div>
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
