import { TenFrameCount } from "./ten-frame-count";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const tenFrameCountMeta: ProblemTypeEntry = {
  id: "ten-frame-count",
  name: "Count the ten-frame",
  description: "Count filled dots on a ten-frame",
  demoProps: { count: 8 },
  Component: TenFrameCount,
};
