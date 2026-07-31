import { EmptyStatePage } from "@/components/empty-state-page";

export default function DashboardPage() {
  return (
    <EmptyStatePage
      title="Dashboard"
      description="Overview of your recent activity."
      emptyMessage="Create a project to get started"
      actionLabel="New project"
    />
  );
}
