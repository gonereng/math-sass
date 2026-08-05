import { problemTypes } from "@/components/problems/registry";
import {
  getLayout,
  getLayoutClassName,
} from "@/components/templates/layouts";

export type WorksheetViewItem = {
  boxId: string;
  problemTypeId: string;
  sortOrder: number;
  props: Record<string, unknown>;
};

export function WorksheetPageView({
  layoutId,
  items,
  showAnswer = false,
  fontSize,
}: {
  layoutId: string;
  items: WorksheetViewItem[];
  showAnswer?: boolean;
  fontSize?: string | number;
}) {
  const layout = getLayout(layoutId);
  const dense = showAnswer || fontSize != null;

  return (
    <div className={getLayoutClassName(layout.id)}>
      {layout.boxes.map((box) => {
        const boxItems = items
          .filter((item) => item.boxId === box.id)
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <div
            key={box.id}
            className={dense ? "min-h-0 p-1" : "min-h-24 p-2"}
          >
            <ul className={dense ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
              {boxItems.map((item, index) => {
                const problemType = problemTypes.find(
                  (p) => p.id === item.problemTypeId,
                );
                const Component = problemType?.Component;
                if (!Component) return null;
                return (
                  <li key={`${item.boxId}-${item.sortOrder}-${index}`}>
                    <Component
                      {...(item.props as object)}
                      showAnswer={showAnswer}
                      {...(fontSize != null ? { fontSize } : {})}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
