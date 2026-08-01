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
}: {
  layoutId: string;
  items: WorksheetViewItem[];
}) {
  const layout = getLayout(layoutId);

  return (
    <div className={getLayoutClassName(layout.id)}>
      {layout.boxes.map((box) => {
        const boxItems = items
          .filter((item) => item.boxId === box.id)
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <div key={box.id} className="min-h-24 p-2">
            <ul className="flex flex-col gap-2">
              {boxItems.map((item, index) => {
                const problemType = problemTypes.find(
                  (p) => p.id === item.problemTypeId,
                );
                const Component = problemType?.Component;
                if (!Component) return null;
                return (
                  <li key={`${item.boxId}-${item.sortOrder}-${index}`}>
                    <Component {...(item.props as object)} />
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
