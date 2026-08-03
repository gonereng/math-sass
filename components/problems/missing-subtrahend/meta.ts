import { MissingSubtrahend } from "./missing-subtrahend";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const missingSubtrahendMeta: ProblemTypeEntry = {
  id: "missing-subtrahend",
  name: "Missing subtrahend",
  description: "A − ___ = C",
  demoProps: { a: 9, c: 4 },
  Component: MissingSubtrahend,
};
