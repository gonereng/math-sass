import { TenLess } from "./ten-less";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const tenLessMeta: ProblemTypeEntry = {
  id: "ten-less",
  name: "Ten less",
  description: "10 less than N",
  demoProps: { n: 52 },
  Component: TenLess,
};
