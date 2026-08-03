import { MakeTen } from "./make-ten";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const makeTenMeta: ProblemTypeEntry = {
  id: "make-ten",
  name: "Make ten",
  description: "A + ___ = 10 with a ten-frame",
  demoProps: { a: 7 },
  Component: MakeTen,
};
