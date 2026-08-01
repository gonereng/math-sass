import type { ComponentType } from "react";

export type AdditionBlankProps = {
  a: number;
  b: number;
  fontSize?: string | number;
  className?: string;
};

export type ProblemTypeEntry = {
  id: string;
  name: string;
  description: string;
  demoProps: Record<string, unknown>;
  Component: ComponentType<any>;
};
