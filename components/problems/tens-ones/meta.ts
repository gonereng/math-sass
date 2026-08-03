import { TensOnes } from "./tens-ones";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const tensOnesMeta: ProblemTypeEntry = {
  id: "tens-ones",
  name: "Tens and ones",
  description: "Compose a number from tens and ones",
  demoProps: { tens: 3, ones: 4 },
  Component: TensOnes,
};
