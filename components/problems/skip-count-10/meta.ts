import { SkipCount10 } from "./skip-count-10";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const skipCount10Meta: ProblemTypeEntry = {
  id: "skip-count-10",
  name: "Skip count by 10",
  description: "Continue a count-by-10 sequence",
  demoProps: { start: 10 },
  Component: SkipCount10,
};
