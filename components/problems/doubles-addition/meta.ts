import { DoublesAddition } from "./doubles-addition";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const doublesAdditionMeta: ProblemTypeEntry = {
  id: "doubles-addition",
  name: "Doubles",
  description: "A + A with a blank for the sum",
  demoProps: { a: 6 },
  Component: DoublesAddition,
};
