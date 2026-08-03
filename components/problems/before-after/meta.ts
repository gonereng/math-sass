import { BeforeAfter } from "./before-after";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const beforeAfterMeta: ProblemTypeEntry = {
  id: "before-after",
  name: "Before and after",
  description: "Numbers before and after N",
  demoProps: { n: 18 },
  Component: BeforeAfter,
};
