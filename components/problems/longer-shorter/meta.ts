import { LongerShorter } from "./longer-shorter";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const longerShorterMeta: ProblemTypeEntry = {
  id: "longer-shorter",
  name: "Longer or shorter",
  description: "Choose which bar is longer",
  demoProps: { aLength: 3, bLength: 5 },
  Component: LongerShorter,
};
