import { NumberSequence } from "./number-sequence";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const numberSequenceMeta: ProblemTypeEntry = {
  id: "number-sequence",
  name: "Fill the blank",
  description: "Complete a counting sequence",
  demoProps: { start: 4, blankIndex: 2 },
  Component: NumberSequence,
};
