import { EmptyStatePage } from "@/components/empty-state-page";

export default function ProblemsPage() {
  return (
    <EmptyStatePage
      title="Problems"
      description="Your reusable problem bank."
      emptyMessage="Your problem bank is empty"
      actionLabel="New problem"
    />
  );
}
