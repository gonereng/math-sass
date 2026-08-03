"use client";

import { useState } from "react";
import { LetterPreviewFrame } from "@/components/problems/letter-preview-frame";
import { problemTypes } from "@/components/problems/registry";
import { cn } from "@/lib/utils";

export function ProblemsCatalog() {
  const [selectedId, setSelectedId] = useState(
    problemTypes[0]?.id ?? "",
  );
  const selected =
    problemTypes.find((p) => p.id === selectedId) ?? problemTypes[0];

  if (!selected) {
    return (
      <p className="text-sm text-muted-foreground">No problem types yet</p>
    );
  }

  const { Component, demoProps } = selected;

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] gap-4">
      <aside className="flex w-56 shrink-0 flex-col gap-3 border-r border-border pr-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Problems
          </h1>
          <p className="mt-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            Type catalog
          </p>
        </div>
        <ul className="flex flex-col gap-0.5">
          {problemTypes.map((entry) => {
            const active = entry.id === selected.id;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => setSelectedId(entry.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "border border-border bg-card font-medium text-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
                      : "border border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  {entry.name}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="min-w-0 flex-1 overflow-auto px-2 [scrollbar-gutter:stable]">
        <div className="space-y-4">
          <div>
            <h2 className="px-2 text-base font-semibold tracking-tight text-foreground">
              {selected.name}
            </h2>
            <p className="px-2 text-xs text-muted-foreground">
              {selected.description}
            </p>
          </div>
          <LetterPreviewFrame>
            <Component {...demoProps} />
          </LetterPreviewFrame>
        </div>
      </section>
    </div>
  );
}
