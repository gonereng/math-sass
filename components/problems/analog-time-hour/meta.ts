import { AnalogTimeHour } from "./analog-time-hour";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const analogTimeHourMeta: ProblemTypeEntry = {
  id: "analog-time-hour",
  name: "Time to the hour",
  description: "Read an analog clock to the hour",
  demoProps: { hour: 3 },
  Component: AnalogTimeHour,
};
