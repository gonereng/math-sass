import { VerticalSubtraction } from "./vertical-subtraction";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const verticalSubtractionMeta: ProblemTypeEntry = {
  id: "vertical-subtraction",
  name: "Vertical subtraction",
  description: "Stacked A − B with answer blank",
  demoProps: { a: 15, b: 7 },
  Component: VerticalSubtraction,
};
