import { TenMore } from "./ten-more";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const tenMoreMeta: ProblemTypeEntry = {
  id: "ten-more",
  name: "Ten more",
  description: "10 more than N",
  demoProps: { n: 34 },
  Component: TenMore,
};
