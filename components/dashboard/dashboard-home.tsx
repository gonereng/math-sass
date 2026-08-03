import { FileText, Printer } from "lucide-react";
import { NewWorkbookButton } from "@/components/new-workbook-button";

export function DashboardHome() {
  return (
    <div className="flex min-h-dvh flex-col justify-center">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="order-2 w-full space-y-10 lg:order-1 lg:w-1/2">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Empty workspace
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Your worksheet
              <br />
              <span className="text-primary">canvas awaits.</span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Compose letter-sized templates, generate workbooks, and export
              print-ready PDFs with MathSheets.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl bg-muted p-6">
              <FileText className="size-6 text-primary" aria-hidden />
              <p className="text-lg font-semibold text-foreground">Templates</p>
              <p className="text-sm text-muted-foreground">
                Drag problem types into letter layouts you can reuse.
              </p>
            </div>
            <div className="space-y-2 rounded-xl bg-muted p-6">
              <Printer className="size-6 text-primary" aria-hidden />
              <p className="text-lg font-semibold text-foreground">
                Print-ready export
              </p>
              <p className="text-sm text-muted-foreground">
                Export from Projects via browser Print → Save as PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 flex w-full justify-center lg:order-2 lg:w-1/2">
          <div className="relative flex h-[440px] w-[340px] max-w-full flex-col items-center justify-center overflow-hidden rounded-sm border border-border/40 bg-card p-10 shadow-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <div className="relative z-10 flex flex-col items-center space-y-6 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-background shadow-inner">
                <FileText
                  className="size-10 text-muted-foreground"
                  strokeWidth={1.25}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  Workspace empty
                </h2>
                <p className="px-2 text-sm text-muted-foreground">
                  No workbooks yet. Create a project to start generating pages.
                </p>
              </div>
              <NewWorkbookButton
                label="New Project"
                size="lg"
                className="rounded-xl px-8 py-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
