import { VerticalAddition } from "./vertical-addition";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const verticalAdditionMeta: ProblemTypeEntry = {
  id: "vertical-addition",
  name: "Vertical addition",
  description: "Stacked A + B with answer blank",
  demoProps: { a: 12, b: 5 },
  Component: VerticalAddition,
};
