import { MissingAddend } from "./missing-addend";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const missingAddendMeta: ProblemTypeEntry = {
  id: "missing-addend",
  name: "Missing addend",
  description: "A + ___ = C",
  demoProps: { a: 4, c: 9 },
  Component: MissingAddend,
};
