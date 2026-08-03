import { CompareNumbers } from "./compare-numbers";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const compareNumbersMeta: ProblemTypeEntry = {
  id: "compare-numbers",
  name: "Compare numbers",
  description: "Write >, <, or = between two numbers",
  demoProps: { a: 17, b: 21 },
  Component: CompareNumbers,
};
