import { SkipCount5 } from "./skip-count-5";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const skipCount5Meta: ProblemTypeEntry = {
  id: "skip-count-5",
  name: "Skip count by 5",
  description: "Continue a count-by-5 sequence",
  demoProps: { start: 5 },
  Component: SkipCount5,
};
