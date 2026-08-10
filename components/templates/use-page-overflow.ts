"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { isPageOverflowing } from "@/components/templates/page-overflow";

/**
 * Measure unscaled layout sizes (offset* / scroll*) — getBoundingClientRect includes fit-scale transform.
 * Content is the inset clip box: scrollHeight is full content, clientHeight is the visible area.
 */
export function usePageOverflow(
  pageRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
): { overflowing: boolean; pageHeight: number } {
  const [pageHeight, setPageHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const pageEl = pageRef.current;
    const contentEl = contentRef.current;
    if (!pageEl || !contentEl) return;

    const measure = () => {
      // Prefer the inset content box for overflow; fall back to silhouette height.
      const visible =
        contentEl.clientHeight > 0
          ? contentEl.clientHeight
          : pageEl.offsetHeight;
      setPageHeight(visible);
      setContentHeight(contentEl.scrollHeight);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(pageEl);
    observer.observe(contentEl);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pageRef, contentRef]);

  return {
    pageHeight,
    overflowing: isPageOverflowing(contentHeight, pageHeight),
  };
}
