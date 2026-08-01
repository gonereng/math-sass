import { AdditionBlank } from "./addition-blank";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const additionBlankMeta: ProblemTypeEntry = {
  id: "addition-blank",
  name: "Addition blank",
  description: "A + B with a blank for the sum",
  demoProps: { a: 3, b: 5 },
  Component: AdditionBlank,
};
