import {
  WorksheetPageView,
  type WorksheetViewItem,
} from "@/components/worksheets/worksheet-page-view";

export type AnswerKeyCell = {
  label: string;
  layoutId: string;
  items: WorksheetViewItem[];
};

export function AnswerKeyPage({ cells }: { cells: AnswerKeyCell[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <h2 className="shrink-0 text-sm font-semibold tracking-wide uppercase">
        Answer Key
      </h2>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2">
        {Array.from({ length: 4 }, (_, i) => {
          const cell = cells[i];
          return (
            <div
              key={i}
              className="min-h-0 overflow-hidden border border-black/40 p-1"
            >
              {cell ? (
                <>
                  <p className="mb-0.5 text-[0.65rem] font-medium leading-tight">
                    {cell.label}
                  </p>
                  <WorksheetPageView
                    layoutId={cell.layoutId}
                    items={cell.items}
                    showAnswer
                    fontSize="0.7rem"
                  />
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
