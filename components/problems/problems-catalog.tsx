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
    <div className="flex h-[calc(100vh-8rem)] min-h-[28rem] gap-0 overflow-hidden rounded-lg border">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/20">
        <div className="border-b px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">Problems</h1>
          <p className="text-xs text-muted-foreground">
            Browse problem types
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {problemTypes.map((entry) => {
            const active = entry.id === selected.id;
            return (
              <button
                key={entry.id}
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => setSelectedId(entry.id)}
                className={cn(
                  "rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {entry.name}
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col gap-6 overflow-auto p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
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
