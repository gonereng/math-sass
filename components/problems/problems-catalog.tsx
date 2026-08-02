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
    <div className="panel-ruled flex h-[calc(100vh-8rem)] min-h-[28rem] gap-0 overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-muted">
        <div className="border-b px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Problems
          </h1>
          <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            Type catalog
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {problemTypes.map((entry) => {
            const active = entry.id === selected.id;
            return (
              <button
                key={entry.id}
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => setSelectedId(entry.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  active
                    ? "border border-border bg-card font-semibold text-foreground"
                    : "border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {entry.name}
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col gap-6 overflow-auto bg-card p-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {selected.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selected.description}
          </p>
        </div>
        <LetterPreviewFrame>
          <Component {...demoProps} />
        </LetterPreviewFrame>
      </section>
    </div>
  );
}
