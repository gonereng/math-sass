import { SkipCount2 } from "./skip-count-2";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const skipCount2Meta: ProblemTypeEntry = {
  id: "skip-count-2",
  name: "Skip count by 2",
  description: "Continue a count-by-2 sequence",
  demoProps: { start: 2 },
  Component: SkipCount2,
};
