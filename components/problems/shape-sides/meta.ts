import { ShapeSides } from "./shape-sides";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const shapeSidesMeta: ProblemTypeEntry = {
  id: "shape-sides",
  name: "Count the sides",
  description: "Count sides of a simple polygon",
  demoProps: { shape: "pentagon" },
  Component: ShapeSides,
};
