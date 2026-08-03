import { SubtractionBlank } from "./subtraction-blank";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const subtractionBlankMeta: ProblemTypeEntry = {
  id: "subtraction-blank",
  name: "Subtraction blank",
  description: "A − B with a blank for the difference",
  demoProps: { a: 8, b: 3 },
  Component: SubtractionBlank,
};
